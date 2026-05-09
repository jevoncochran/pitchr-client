import { TP_LABELS } from "./dashboardConstants";
import { MessageIcon } from "./DashboardIcons";

const getDueLabel = (
  r: any,
  now: Date,
  todayStr: string,
): { label: string; colorClass: string } => {
  if (r.isEmailSentCheck) {
    return { label: "Needs immediate attention", colorClass: "text-red-500" };
  }
  const due = new Date(r.dueDate);
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (due.toDateString() === todayStr) {
    return { label: "Due today", colorClass: "text-amber-500" };
  }
  if (diffDays === 1) {
    return { label: "Overdue • Yesterday", colorClass: "text-red-500" };
  }
  if (diffDays > 1) {
    return {
      label: `Overdue • ${diffDays} days ago`,
      colorClass: "text-red-500",
    };
  }
  // upcoming (shouldn't appear in urgent but just in case)
  return { label: "Upcoming", colorClass: "text-gray-400" };
};

const getTaskPrompt = (r: any): string => {
  if (r.isEmailSentCheck) return "Follow-up email sent?";
  if (r.isCheckIn) return r.note ?? "Did they respond?";
  const typeLabel = TP_LABELS[r.type] ?? r.type;
  return r.note ? `${typeLabel} — ${r.note}` : `Log ${typeLabel}`;
};

export const UrgentTaskCard = ({
  r,
  onNavigate,
  onComplete,
}: {
  r: any;
  onNavigate: (path: string) => void;
  onComplete: (id: string) => void;
}) => {
  const now = new Date();
  const todayStr = now.toDateString();
  const { label: dueLabel, colorClass: dueColor } = getDueLabel(r, now, todayStr);
  const prompt = getTaskPrompt(r);

  return (
    <div className="bg-white border border-red-100/80 rounded-2xl px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
      <div className="flex items-start gap-4">
        <MessageIcon />

        <div className="flex-1 min-w-0 md:flex md:items-center md:justify-between md:gap-5">
          <div
            className="min-w-0 cursor-pointer"
            onClick={() => onNavigate(`/leads/${r.lead.id}`)}
          >
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {r.lead.business}
            </p>

            <p className="text-sm text-gray-500 mt-1 leading-snug">
              {prompt}
            </p>

            <p className={`text-xs mt-2 font-semibold ${dueColor}`}>
              {dueLabel}
            </p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0 md:flex-shrink-0">
            <button
              onClick={() => onNavigate(`/leads/${r.lead.id}`)}
              className="flex-1 md:flex-none bg-green-primary text-white text-sm font-semibold rounded-xl px-5 h-10 whitespace-nowrap shadow-[0_6px_14px_rgba(22,163,74,0.20)] hover:opacity-90 transition"
            >
              Log Follow-Up
            </button>

            <button
              onClick={() => onComplete(r.id)}
              className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl px-5 h-10 whitespace-nowrap hover:bg-gray-50 hover:text-gray-700 transition"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
