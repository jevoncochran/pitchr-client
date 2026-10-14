import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaTimes } from "react-icons/fa";
import api from "../../lib/api";
import InternalLayout from "../../app/InternalLayout";
import { SectionCard } from "../../components/ui/SectionCard";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { LeadSnapshot } from "../leads/LeadSnapshot";
import { LogVisitForm, VisitLog } from "./LogVisitForm";
import { MessageRow } from "./MessageRow";
import {
  AddToSessionDialog,
  UnplannedTarget,
} from "./AddToSessionDialog";
import { SESSION_CHANNEL_ORIGIN } from "../leads/origins";
import { PIPELINE_STAGES } from "../leads/constants";
import { MIXED_TYPES, OUTCOME_LABEL } from "../leads/results";
import { channelInfo, directionsUrl } from "./constants";
import type { SessionDetail, SessionItem } from "./types";

const MESSAGE_CHANNELS = ["INSTAGRAM_DM", "EMAIL", "TEXT"];

const errorMessage = (err: unknown, fallback: string) =>
  (axios.isAxiosError(err) && err.response?.data?.message) || fallback;

const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

const elapsedLabel = (startedAt: string | null, now: number) => {
  if (!startedAt) return "";
  const minutes = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 60_000));
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} elapsed`;
};

const itemResult = (item: SessionItem) => {
  if (item.status === "SKIPPED") return "Skipped";
  if (item.status !== "COMPLETED" || !item.touchPoint) return "Planned";
  if (item.touchPoint.outcome) return OUTCOME_LABEL[item.touchPoint.outcome] ?? item.touchPoint.outcome;
  return item.touchPoint.delivery === "FAILED" ? "Failed" : "Sent";
};

/** Logging a DM, email or text inside a mixed session: sent or failed, plus a note. */
const MessageLogForm = ({
  saving,
  onLog,
}: {
  saving: boolean;
  onLog: (delivery: "SENT" | "FAILED", note: string) => void;
}) => {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        rows={2}
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 resize-none"
      />
      <div className="flex gap-2">
        <button onClick={() => onLog("FAILED", note)} disabled={saving} className="px-4 py-3 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 disabled:opacity-50">
          Failed
        </button>
        <button onClick={() => onLog("SENT", note)} disabled={saving} className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-green-primary disabled:opacity-50">
          {saving ? "Saving…" : "Sent → next"}
        </button>
      </div>
    </div>
  );
};

const RunSessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Which lead the form is for: a chosen planned item, or an unplanned one
  const [chosenItemId, setChosenItemId] = useState<string | null>(null);
  const [unplanned, setUnplanned] = useState<UnplannedTarget | null>(null);
  const [mixedType, setMixedType] = useState("IN_PERSON");

  const [showList, setShowList] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [stageSuggestion, setStageSuggestion] = useState<{
    leadId: string;
    business: string;
    stage: string;
  } | null>(null);

  // Load the session, starting it if needed; an ended session goes back to its page
  const load = useCallback(async () => {
    try {
      let res = await api.get<SessionDetail>(`/api/sessions/${id}`);
      if (res.data.endedAt) {
        navigate(`/sessions/${id}`, { replace: true });
        return;
      }
      if (!res.data.startedAt) {
        res = await api.post<SessionDetail>(`/api/sessions/${id}/start`);
      }
      setSession(res.data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load this session."));
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the elapsed time current
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (!session) {
    return (
      <InternalLayout>
        <div className="p-4 md:p-8 text-sm text-gray-400">{error || "Loading…"}</div>
      </InternalLayout>
    );
  }

  const channel = channelInfo(session.channel);
  const messageMode = MESSAGE_CHANNELS.includes(session.channel);
  const items = session.items;
  const plannedCount = items.filter((i) => i.status === "PLANNED").length;
  const doneCount = items.filter((i) => i.status === "COMPLETED").length;

  // The lead in front of us: a chosen item, else the next planned one
  const chosen = items.find((i) => i.id === chosenItemId && i.status !== "COMPLETED");
  const current = unplanned ? null : (chosen ?? items.find((i) => i.status === "PLANNED") ?? null);
  const currentIndex = current ? items.indexOf(current) : -1;
  const target = current
    ? { business: current.lead.business, leadId: current.lead.id }
    : unplanned
      ? { business: unplanned.business, leadId: "leadId" in unplanned ? unplanned.leadId : null }
      : null;

  // The type being logged: the channel, or the per-lead choice in a mixed session
  const type = session.channel === "MIXED" ? mixedType : session.channel;
  const isVisit = type === "IN_PERSON";
  const address = current?.lead.primaryLocation;

  // ── Actions ─────────────────────────────────────────────────────────────

  const log = async (body: Record<string, unknown>, itemOverride?: SessionItem) => {
    const item = itemOverride ?? current;
    setSaving(true);
    setError("");
    try {
      const res = await api.post(`/api/sessions/${id}/log`, {
        ...(item
          ? { itemId: item.id }
          : unplanned && "leadId" in unplanned
            ? { leadId: unplanned.leadId }
            : { newLead: unplanned && "newLead" in unplanned ? unplanned.newLead : undefined }),
        ...body,
      });
      const updated: SessionDetail = res.data.session;
      setSession(updated);
      if (res.data.suggestedStage) {
        const logged = updated.items.find((i) => i.touchPoint?.id === res.data.touchpointId);
        if (logged) {
          setStageSuggestion({
            leadId: logged.lead.id,
            business: logged.lead.business,
            stage: res.data.suggestedStage,
          });
        }
      }
      setChosenItemId(null);
      setUnplanned(null);
      setShowSnapshot(false);
      setMixedType("IN_PERSON");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(errorMessage(err, "Couldn't save. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  const logVisit = (visit: VisitLog) =>
    log({
      type: visit.type,
      outcome: visit.outcome,
      providerType: visit.providerType,
      comeBackAt: visit.comeBackAt,
      addBackToRoute: visit.addBackToRoute,
      contactIds: visit.contactIds,
      newContact: visit.newContact,
      summary: visit.summary || null,
      leftMaterials: visit.leftMaterials,
    });

  const logMessage = (delivery: "SENT" | "FAILED", note: string, item?: SessionItem) =>
    log({ type, delivery, summary: note.trim() || null }, item);

  const skip = async (item: SessionItem) => {
    setSaving(true);
    setError("");
    try {
      const res = await api.patch<SessionDetail>(`/api/sessions/${id}/items/${item.id}`, {
        status: "SKIPPED",
      });
      setSession(res.data);
      setChosenItemId(null);
      setShowSnapshot(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't skip."));
    } finally {
      setSaving(false);
    }
  };

  const endSession = async () => {
    setEnding(true);
    try {
      await api.post(`/api/sessions/${id}/end`);
      navigate(`/sessions/${id}`);
    } catch (err) {
      setError(errorMessage(err, "Couldn't end the session."));
      setEnding(false);
      setConfirmEnd(false);
    }
  };

  const applyStage = async () => {
    if (!stageSuggestion) return;
    try {
      await api.patch(`/api/leads/${stageSuggestion.leadId}`, { pipelineStage: stageSuggestion.stage });
    } catch (err) {
      setError(errorMessage(err, "Couldn't change the stage."));
    }
    setStageSuggestion(null);
  };

  // ── Page ────────────────────────────────────────────────────────────────

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-xl w-full">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              {channel.label}
              {session.area && <span className="font-normal text-gray-500"> · {session.area}</span>}
            </p>
            <p className="text-xs text-gray-400">
              {doneCount} of {items.length} {channel.done} · {elapsedLabel(session.startedAt, now)}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!messageMode && (
              <button onClick={() => setShowList(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100">
                List
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100">
              + Add
            </button>
            <button onClick={() => setConfirmEnd(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gray-900">
              End
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-3" role="alert">
            {error}
          </p>
        )}

        {/* DMs, emails, texts: the fast list */}
        {messageMode && (
          <>
            {unplanned && (
              <SectionCard className="rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">{unplanned.business}</p>
                  <button onClick={() => setUnplanned(null)} aria-label="Cancel" className="text-gray-400">
                    <FaTimes size={12} />
                  </button>
                </div>
                <MessageLogForm saving={saving} onLog={(d, n) => logMessage(d, n)} />
              </SectionCard>
            )}
            {items.length === 0 && !unplanned && (
              <p className="text-sm text-gray-400 text-center py-8">No leads on this session yet. Use + Add.</p>
            )}
            <ul className="space-y-2">
              {items.map((item) => (
                <MessageRow
                  key={item.id}
                  item={item}
                  saving={saving}
                  onLog={(delivery, note) => logMessage(delivery, note, item)}
                  onSkip={() => skip(item)}
                />
              ))}
            </ul>
          </>
        )}

        {/* Visits and calls: one lead at a time */}
        {!messageMode && target && (
          <SectionCard className="rounded-xl p-4 md:p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {current ? `${capitalize(channel.item)} ${currentIndex + 1} of ${items.length}` : "Not on the plan"}
                {current?.plannedTime &&
                  ` · back at ${new Date(current.plannedTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
              </p>
              {unplanned && (
                <button onClick={() => setUnplanned(null)} aria-label="Cancel" className="text-gray-400">
                  <FaTimes size={12} />
                </button>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{target.business}</h1>
            {current && (
              <p className="text-xs text-gray-400 mt-0.5">
                {[current.lead.industry?.name, PIPELINE_STAGES.find((s) => s.value === current.lead.pipelineStage)?.label]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {isVisit &&
                (address ? (
                  <a href={directionsUrl(address)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-700 bg-blue-50">
                    Navigate
                  </a>
                ) : (
                  current && <span className="px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-gray-50">No address</span>
                ))}
              {target.leadId && (
                <button onClick={() => setShowSnapshot((v) => !v)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-gray-100">
                  {showSnapshot ? "Hide snapshot" : "Snapshot"}
                </button>
              )}
            </div>

            {showSnapshot && target.leadId && (
              <div className="mt-3">
                <LeadSnapshot key={target.leadId} leadId={target.leadId} />
              </div>
            )}

            {session.channel === "MIXED" && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">How?</p>
                <div className="flex flex-wrap gap-1.5">
                  {MIXED_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setMixedType(t.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                        mixedType === t.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5">
              {type === "IN_PERSON" || type === "CALL" ? (
                <LogVisitForm
                  key={`${current?.id ?? target.business}-${type}`}
                  type={type}
                  contacts={current?.lead.contacts ?? []}
                  canAddBackToRoute={session.channel === "IN_PERSON" || session.channel === "MIXED"}
                  saving={saving}
                  onSave={logVisit}
                  onSkip={current ? () => skip(current) : undefined}
                />
              ) : (
                <MessageLogForm key={`${current?.id ?? target.business}-${type}`} saving={saving} onLog={(d, n) => logMessage(d, n)} />
              )}
            </div>
          </SectionCard>
        )}

        {/* Nothing left on the plan */}
        {!messageMode && !target && (
          <SectionCard className="rounded-xl p-6 text-center">
            <p className="text-base font-semibold text-gray-800">
              {items.length === 0 ? "No leads planned" : "That's everyone on the list"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {doneCount} {channel.done}
              {items.some((i) => i.status === "SKIPPED") && ` · ${items.filter((i) => i.status === "SKIPPED").length} skipped (in List)`}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100">
                + Add a lead
              </button>
              <button onClick={() => setConfirmEnd(true)} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gray-900">
                End session
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      {/* The whole list (visits and calls) */}
      {showList && (
        <div className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-black/40 md:p-4">
          <div role="dialog" aria-modal="true" aria-label="Session list" className="bg-white w-full md:max-w-md md:rounded-2xl shadow-xl flex flex-col md:max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {capitalize(channel.items)} · {doneCount} of {items.length} {channel.done}
              </h2>
              <button onClick={() => setShowList(false)} aria-label="Close" className="p-1 text-gray-400">
                <FaTimes />
              </button>
            </div>
            <ol className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {items.map((item, index) => {
                const open = item.status !== "COMPLETED";
                return (
                  <li key={item.id}>
                    <button
                      disabled={!open}
                      onClick={() => {
                        setUnplanned(null);
                        setChosenItemId(item.id);
                        setShowSnapshot(false);
                        setShowList(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 ${open ? "hover:bg-gray-50" : ""} ${
                        item.id === current?.id ? "bg-green-50" : ""
                      }`}
                    >
                      <span className="w-5 text-xs font-semibold text-gray-400">{index + 1}</span>
                      <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{item.lead.business}</span>
                      <span className="text-xs text-gray-500">{itemResult(item)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      <AddToSessionDialog
        open={showAdd}
        excludeLeadIds={items.filter((i) => i.status === "PLANNED").map((i) => i.lead.id)}
        defaultOrigin={SESSION_CHANNEL_ORIGIN[session.channel] ?? ""}
        onChoose={(choice) => {
          setUnplanned(choice);
          setChosenItemId(null);
          setShowSnapshot(false);
          setShowAdd(false);
          window.scrollTo({ top: 0 });
        }}
        onCancel={() => setShowAdd(false)}
      />

      <ConfirmModal
        open={confirmEnd}
        title="End this session?"
        message={
          plannedCount > 0
            ? `${plannedCount} ${plannedCount === 1 ? channel.item : channel.items} still planned will stay on the list as not done.`
            : `${doneCount} ${channel.done}. Nice work.`
        }
        confirmLabel="End session"
        loading={ending}
        onConfirm={endSession}
        onCancel={() => setConfirmEnd(false)}
      />

      <ConfirmModal
        open={stageSuggestion !== null}
        title={`Move to ${PIPELINE_STAGES.find((s) => s.value === stageSuggestion?.stage)?.label ?? stageSuggestion?.stage}?`}
        message={stageSuggestion ? `Based on this visit, ${stageSuggestion.business} may belong in this stage now.` : ""}
        confirmLabel="Move"
        cancelLabel="Not now"
        onConfirm={applyStage}
        onCancel={() => setStageSuggestion(null)}
      />
    </InternalLayout>
  );
};

export default RunSessionPage;
