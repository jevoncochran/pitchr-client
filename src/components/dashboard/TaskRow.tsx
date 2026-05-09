import { TP_LABELS } from "./dashboardConstants";

export const TaskRow = ({
  r,
  urgent,
  onNavigate,
  onComplete,
}: {
  r: any;
  urgent?: boolean;
  onNavigate: (path: string) => void;
  onComplete: (id: string) => void;
}) => {
  if (r.isEmailSentCheck) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm bg-red-50 border border-red-300">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-red-500 flex-shrink-0">⚠️</span>
          <div className="min-w-0">
            <span className="font-semibold text-red-700 truncate">
              {r.lead.business}
            </span>
            <span className="text-red-400 ml-1.5 text-xs">
              — follow-up email sent?
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onNavigate(`/leads/${r.lead.id}`)}
            className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
          >
            Log Follow-Up
          </button>
          <button
            onClick={() => onComplete(r.id)}
            className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm border ${
        urgent ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
      }`}
    >
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate(`/leads/${r.lead.id}`)}
      >
        <p className="font-medium text-gray-800 truncate">
          {r.lead.business}
        </p>
        <p
          className={`text-xs mt-0.5 truncate ${urgent ? "text-red-500" : "text-yellow-600"}`}
        >
          {r.isCheckIn
            ? (r.note ?? "Did they respond?")
            : (TP_LABELS[r.type] ?? r.type)}
          {r.note && !r.isCheckIn && ` · ${r.note}`}
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={() => onNavigate(`/leads/${r.lead.id}`)}
          className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
        >
          Log Follow-Up
        </button>
        <button
          onClick={() => onComplete(r.id)}
          className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
        >
          Skip
        </button>
      </div>
    </div>
  );
};
