import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import InternalLayout from "../../app/InternalLayout";
import { SectionCard } from "../../components/ui/SectionCard";
import {
  SessionDetails,
  SessionDetailsDialog,
} from "./SessionDetailsDialog";
import { AuthContext } from "../auth/AuthContext";
import { channelInfo, sessionStatus } from "./constants";
import { formatDateKey } from "../../lib/dates";
import type { SessionSummary } from "./types";

const GROUPS = [
  { status: "inProgress", title: "In progress" },
  { status: "planned", title: "Upcoming" },
  { status: "ended", title: "Past" },
] as const;

const SessionCard = ({
  session,
  showOwner,
  onClick,
}: {
  session: SessionSummary;
  showOwner: boolean;
  onClick: () => void;
}) => {
  const channel = channelInfo(session.channel);
  const { total, completed } = session.itemCounts;
  const status = sessionStatus(session);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 shadow-[0_2px_8px_rgba(15,23,42,0.06)] hover:border-gray-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">
            {channel.label}
            {session.area && <span className="font-normal text-gray-500"> · {session.area}</span>}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {session.plannedFor ? formatDateKey(session.plannedFor) : "No date"}
            {showOwner && ` · ${session.user.firstName} ${session.user.lastName}`}
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
          {status === "planned"
            ? `${total} ${total === 1 ? channel.item : channel.items}`
            : `${completed} of ${total} ${channel.done}`}
        </span>
      </div>
      {session.goal && (
        <p className="text-xs text-gray-400 mt-2">
          Goal: {session.goal} {session.goal === 1 ? channel.item : channel.items}
        </p>
      )}
    </button>
  );
};

const SessionsPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const isAdmin = (auth?.user as { role?: string } | null)?.role === "ADMIN";

  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [everyone, setEveryone] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setSessions(null);
    api
      .get<SessionSummary[]>(`/api/sessions${everyone ? "?all=true" : ""}`)
      .then((res) => setSessions(res.data))
      .catch(() => setError("Couldn't load sessions."));
  }, [everyone]);

  const handleCreate = async (details: SessionDetails) => {
    const res = await api.post("/api/sessions", {
      channel: details.channel,
      plannedFor: details.plannedFor,
      area: details.area || null,
      goal: details.goal,
      notes: details.notes || null,
    });
    setCreating(false);
    navigate(`/sessions/${res.data.id}`);
  };

  return (
    <InternalLayout>
      <div className="p-4 md:p-8 max-w-3xl w-full">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sessions</h1>
          <button
            onClick={() => setCreating(true)}
            className="text-sm bg-green-primary text-white px-3 py-1.5 rounded-lg font-medium"
          >
            + Plan a session
          </button>
        </div>

        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <input type="checkbox" checked={everyone} onChange={(e) => setEveryone(e.target.checked)} />
            Show everyone's sessions
          </label>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        {sessions === null && !error && <p className="text-sm text-gray-400">Loading…</p>}

        {sessions !== null && sessions.length === 0 && (
          <SectionCard className="rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 font-medium">No sessions yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Plan one to line up the leads you'll visit, call or message.
            </p>
          </SectionCard>
        )}

        {sessions !== null &&
          GROUPS.map((group) => {
            const inGroup = sessions.filter((s) => sessionStatus(s) === group.status);
            // Upcoming: soonest first (the server lists newest first)
            if (group.status === "planned") {
              inGroup.sort((a, b) => (a.plannedFor ?? "").localeCompare(b.plannedFor ?? ""));
            }
            if (inGroup.length === 0) return null;
            return (
              <section key={group.status} className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {group.title}
                </h2>
                <div className="space-y-2">
                  {inGroup.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      showOwner={everyone}
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
      </div>

      <SessionDetailsDialog
        open={creating}
        onSave={handleCreate}
        onCancel={() => setCreating(false)}
      />
    </InternalLayout>
  );
};

export default SessionsPage;
