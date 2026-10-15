import type { LeadDetail } from "./useLeadDetail";

/** "No contact in N days" when the last touchpoint is a week old or more. */
export const LeadSilenceWarning = ({ detail }: { detail: LeadDetail }) => {
  const { lead } = detail;
  return (
    <>
      {(() => {
        const touchpoints = lead.touchPoint;
        if (!touchpoints || touchpoints.length === 0) return null;
        const days = Math.floor(
          (Date.now() - new Date(touchpoints[0].date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (days < 7) return null;
        return (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 mb-6 text-sm">
            <span className="text-orange-500">⏰</span>
            <span className="text-orange-700 font-medium">
              No contact in {days} day{days !== 1 ? "s" : ""}
            </span>
            <span className="text-orange-400 text-xs ml-1">
              — last touchpoint on{" "}
              {new Date(touchpoints[0].date).toLocaleDateString()}
            </span>
          </div>
        );
      })()}
    </>
  );
};
