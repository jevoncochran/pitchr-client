import { Link } from "react-router-dom";
import { FaCheck } from "react-icons/fa";
import { SectionCard } from "../ui/SectionCard";
import { MESSAGE_TYPES, OUTCOMES } from "../../constants/results";
import { channelInfo } from "../../constants/sessions";
import { formatDateKey, localDateKey } from "../../utils/dates";
import type { EndOfSessionSummary, SessionChannel } from "../../types/sessions";

/** 95 -> "1 h 35 min" */
const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-gray-50 rounded-lg p-3">
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

/** What an ended session got done: shown at the top of the session page. */
export const SessionSummaryCard = ({
  summary,
  channel,
  goal,
}: {
  summary: EndOfSessionSummary;
  channel: SessionChannel;
  goal: number | null;
}) => {
  const info = channelInfo(channel);
  const { itemCounts, messages } = summary;
  // Visits and calls have outcomes; messages have delivery. Mixed can have both.
  const showOutcomes = !MESSAGE_TYPES.includes(channel);
  const showMessages = MESSAGE_TYPES.includes(channel) || messages.sent + messages.failed > 0;
  const outcomeRows = OUTCOMES.filter((o) => summary.outcomes[o.value]);

  return (
    <SectionCard className="rounded-xl p-4 mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Summary</p>
      <p className="text-lg font-semibold text-gray-800 mt-1">
        {itemCounts.completed} of {itemCounts.total} {info.items} {info.done}
      </p>
      <p className="text-sm text-gray-500">
        {formatDuration(summary.durationMinutes)}
        {goal && ` · Goal: ${goal} (${itemCounts.completed >= goal ? "met" : `${goal - itemCounts.completed} short`})`}
        {itemCounts.skipped > 0 && ` · ${itemCounts.skipped} skipped`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
        {showOutcomes && (
          <>
            <Stat label="Conversations" value={summary.conversations} />
            <Stat label="Decision-makers reached" value={summary.decisionMakersReached} />
            <Stat label="Meetings booked" value={summary.meetingsBooked} />
          </>
        )}
        {showMessages && (
          <>
            <Stat label="Messages sent" value={messages.sent} />
            {messages.failed > 0 && <Stat label="Failed to send" value={messages.failed} />}
          </>
        )}
      </div>

      {outcomeRows.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Outcomes</p>
          <ul className="text-sm text-gray-700 divide-y divide-gray-100">
            {outcomeRows.map((o) => (
              <li key={o.value} className="flex justify-between py-1.5">
                <span>{o.label}</span>
                <span className="font-medium">{summary.outcomes[o.value]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
          Follow-ups created
        </p>
        {summary.followUps.length === 0 ? (
          <p className="text-sm text-gray-400">None</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {summary.followUps.map((task) => (
              <li key={task.id} className="flex items-start gap-2 py-2">
                <span
                  className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${
                    task.completed ? "bg-green-primary border-green-primary text-white" : "border-gray-300"
                  }`}
                  aria-label={task.completed ? "Done" : "To do"}
                >
                  {task.completed && <FaCheck size={8} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${task.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>
                    {task.lead ? (
                      <Link to={`/leads/${task.lead.id}`} className="font-medium hover:underline">
                        {task.lead.business}
                      </Link>
                    ) : null}
                    {task.note && <span className="text-gray-500"> · {task.note}</span>}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-gray-400">Due {formatDateKey(localDateKey(new Date(task.dueDate)))}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
};
