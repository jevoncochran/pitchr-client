import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { FaTimes, FaGripVertical } from "react-icons/fa";
import axios from "axios";
import api from "../api";
import InternalLayout from "../components/InternalLayout";
import { SectionCard } from "../components/ui/SectionCard";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { LeadPicker } from "../components/sessions/LeadPicker";
import {
  SessionDetails,
  SessionDetailsDialog,
} from "../components/sessions/SessionDetailsDialog";
import { PIPELINE_STAGES } from "../constants/leads";
import { channelInfo, directionsUrl, sessionStatus } from "../constants/sessions";
import { formatDateKey } from "../utils/dates";
import type { SessionDetail, SessionItem } from "../types/sessions";

const STATUS_BADGE = {
  planned: { label: "Upcoming", className: "bg-blue-50 text-blue-700 border-blue-100" },
  inProgress: { label: "In progress", className: "bg-amber-50 text-amber-700 border-amber-100" },
  ended: { label: "Ended", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const ITEM_STATUS = {
  PLANNED: null,
  COMPLETED: { label: "Done", className: "text-green-700 bg-green-50" },
  SKIPPED: { label: "Skipped", className: "text-gray-500 bg-gray-100" },
};

const stageLabel = (value: string) =>
  PIPELINE_STAGES.find((s) => s.value === value)?.label ?? value;

// The server's error message, if it sent one
const errorMessage = (err: unknown, fallback: string) =>
  (axios.isAxiosError(err) && err.response?.data?.message) || fallback;

const SessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<SessionItem | null>(null);

  const load = useCallback(() => {
    api
      .get<SessionDetail>(`/api/sessions/${id}`)
      .then((res) => setSession(res.data))
      .catch((err) => setError(errorMessage(err, "Couldn't load this session.")));
  }, [id]);

  useEffect(load, [load]);

  if (!session) {
    return (
      <InternalLayout>
        <div className="p-4 md:p-8 text-sm text-gray-400">{error || "Loading…"}</div>
      </InternalLayout>
    );
  }

  const channel = channelInfo(session.channel);
  const status = sessionStatus(session);
  const canChangeList = status !== "ended";
  const completed = session.items.filter((i) => i.status === "COMPLETED").length;
  // Visits get directions; calls and messages don't need an address
  const showDirections = session.channel === "IN_PERSON" || session.channel === "MIXED";
  const plannedLeadIds = session.items.filter((i) => i.status === "PLANNED").map((i) => i.lead.id);

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleSaveDetails = async (details: SessionDetails) => {
    const res = await api.patch<SessionDetail>(`/api/sessions/${id}`, {
      ...(status === "planned" && { channel: details.channel }),
      plannedFor: details.plannedFor,
      area: details.area || null,
      goal: details.goal,
      notes: details.notes || null,
    });
    setSession(res.data);
    setEditing(false);
  };

  const handleAddLeads = async (leadIds: string[]) => {
    const res = await api.post<SessionDetail>(`/api/sessions/${id}/items`, { leadIds });
    setSession(res.data);
    setPicking(false);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      const res = await api.delete<SessionDetail>(`/api/sessions/${id}/items/${removeTarget.id}`);
      setSession(res.data);
    } catch (err) {
      setError(errorMessage(err, "Couldn't remove that lead."));
    }
    setRemoveTarget(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/sessions/${id}`);
      navigate("/sessions");
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete this session."));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Drag to reorder: update the screen right away, then save; undo if saving fails
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const previous = session.items;
    const items = [...previous];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setSession({ ...session, items });

    api
      .put<SessionDetail>(`/api/sessions/${id}/items/order`, { itemIds: items.map((i) => i.id) })
      .then((res) => setSession(res.data))
      .catch((err) => {
        setSession((current) => (current ? { ...current, items: previous } : current));
        setError(errorMessage(err, "Couldn't save the new order."));
      });
  };

  // ── Page ────────────────────────────────────────────────────────────────

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-3xl w-full">
        <button
          onClick={() => navigate("/sessions")}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 block"
        >
          ← Sessions
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-800">
              {channel.label}
              {session.area && <span className="font-normal text-gray-500"> · {session.area}</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {session.plannedFor ? formatDateKey(session.plannedFor) : "No date"}
              {session.goal && ` · Goal: ${session.goal} ${session.goal === 1 ? channel.item : channel.items}`}
            </p>
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_BADGE[status].className}`}
          >
            {STATUS_BADGE[status].label}
          </span>
        </div>

        {session.notes && <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{session.notes}</p>}

        {status !== "ended" && (
          <button
            onClick={() => navigate(`/sessions/${id}/run`)}
            className="w-full md:w-auto mb-4 px-5 py-3 rounded-lg text-sm font-semibold text-white bg-green-primary"
          >
            {status === "planned" ? "Start session →" : "Continue session →"}
          </button>
        )}

        <div className="flex gap-4 text-sm mb-6">
          <button onClick={() => setEditing(true)} className="text-gray-600 underline hover:text-gray-900">
            Edit details
          </button>
          <button onClick={() => setConfirmDelete(true)} className="text-red-500 underline hover:text-red-600">
            Delete session
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4" role="alert">
            {error}
          </p>
        )}

        {/* The list */}
        <SectionCard className="rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-semibold text-gray-700">
              {status === "planned"
                ? `${session.items.length} ${session.items.length === 1 ? channel.item : channel.items} planned`
                : `${completed} of ${session.items.length} ${channel.items} ${channel.done}`}
            </p>
            {canChangeList && (
              <button
                onClick={() => setPicking(true)}
                className="text-sm bg-green-primary text-white px-3 py-1 rounded-lg"
              >
                + Add leads
              </button>
            )}
          </div>

          {session.items.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No leads yet. Add the businesses you plan to {session.channel === "IN_PERSON" ? "visit" : "contact"}.
            </p>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="items" isDropDisabled={!canChangeList}>
                {(provided) => (
                  <ol ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {session.items.map((item, index) => {
                      const itemStatus = ITEM_STATUS[item.status];
                      const address = item.lead.primaryLocation;
                      return (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                          isDragDisabled={!canChangeList}
                        >
                          {(drag) => (
                            <li
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg p-3"
                            >
                              {canChangeList && (
                                <span
                                  {...drag.dragHandleProps}
                                  aria-label="Drag to reorder"
                                  className="pt-1 text-gray-300 hover:text-gray-500 cursor-grab"
                                >
                                  <FaGripVertical size={12} />
                                </span>
                              )}
                              <span className="w-5 pt-0.5 text-xs font-semibold text-gray-400">{index + 1}</span>
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => navigate(`/leads/${item.lead.id}`)}
                                  className="text-sm font-medium text-gray-800 hover:underline text-left"
                                >
                                  {item.lead.business}
                                </button>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {[item.lead.industry?.name, stageLabel(item.lead.pipelineStage)]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                {showDirections &&
                                  (address ? (
                                    <a
                                      href={directionsUrl(address)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                    >
                                      Navigate · {address.addressLine1}, {address.city}
                                    </a>
                                  ) : (
                                    <p className="text-xs text-gray-300 mt-1">No address on file</p>
                                  ))}
                              </div>
                              {itemStatus && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${itemStatus.className}`}>
                                  {itemStatus.label}
                                </span>
                              )}
                              {canChangeList && item.status !== "COMPLETED" && (
                                <button
                                  onClick={() => setRemoveTarget(item)}
                                  aria-label={`Remove ${item.lead.business}`}
                                  className="p-1 text-gray-300 hover:text-red-500"
                                >
                                  <FaTimes size={12} />
                                </button>
                              )}
                            </li>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ol>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </SectionCard>
      </div>

      <SessionDetailsDialog
        open={editing}
        initial={{
          channel: session.channel,
          plannedFor: session.plannedFor?.slice(0, 10),
          area: session.area ?? "",
          goal: session.goal,
          notes: session.notes ?? "",
        }}
        channelLocked={status !== "planned"}
        onSave={handleSaveDetails}
        onCancel={() => setEditing(false)}
      />

      <LeadPicker
        open={picking}
        excludeLeadIds={plannedLeadIds}
        onAdd={handleAddLeads}
        onCancel={() => setPicking(false)}
      />

      <ConfirmModal
        open={removeTarget !== null}
        title="Remove from session?"
        message={removeTarget ? `${removeTarget.lead.business} will be taken off this session's list.` : ""}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Delete this session?"
        message="The session and its list will be deleted. Anything already logged stays on each lead's history."
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </InternalLayout>
  );
};

export default SessionPage;
