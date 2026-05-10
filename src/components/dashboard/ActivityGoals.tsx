import {
  ACTIVITY_CHANNELS,
  NO_CONTACT_TYPES,
  REVENUE_GOAL,
  AVG_DEAL_SIZE,
  type GoalPeriod,
} from "./dashboardConstants";
import { SectionCard } from "../ui/SectionCard";
import { SectionHeader } from "../ui/SectionHeader";

export const ActivityGoals = ({
  allTouchpoints,
  goalPeriod,
  onPeriodChange,
}: {
  allTouchpoints: any[];
  goalPeriod: GoalPeriod;
  onPeriodChange: (p: GoalPeriod) => void;
}) => {
  const closesNeeded = Math.ceil(REVENUE_GOAL / AVG_DEAL_SIZE); // 8

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Monday of the current calendar week
  const startOfCalendarWeek = new Date(now);
  const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfCalendarWeek.setDate(now.getDate() - daysFromMonday);
  startOfCalendarWeek.setHours(0, 0, 0, 0);

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Period end boundaries (exclusive upper bound)
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const startOfNextCalendarWeek = new Date(startOfCalendarWeek);
  startOfNextCalendarWeek.setDate(startOfCalendarWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const PERIOD_START: Record<GoalPeriod, Date> = {
    today: startOfToday,
    week: startOfCalendarWeek,
    month: startOfMonth,
  };

  const PERIOD_END: Record<GoalPeriod, Date> = {
    today: startOfTomorrow,
    week: startOfNextCalendarWeek,
    month: startOfNextMonth,
  };

  // Count unique (leadId × calendar-day) pairs for a given type within [since, until).
  // Multiple touchpoints to the same lead on the same day = 1 toward the goal.
  // Same lead on a different day = 1 more.
  // The upper bound prevents future-dated touchpoints from inflating the current period.
  const activityCount = (type: string, since: Date, until: Date): number => {
    const relevant = allTouchpoints.filter((tp) => {
      const d = new Date(tp.date);
      return !NO_CONTACT_TYPES.has(tp.type) && tp.type === type && d >= since && d < until;
    });
    const seen = new Set<string>();
    relevant.forEach((tp) => {
      seen.add(`${tp.leadId}_${new Date(tp.date).toDateString()}`);
    });
    return seen.size;
  };

  return (
    <SectionCard className="rounded-2xl p-4 md:p-5 mb-6">
      {/* Header row */}
      <SectionHeader
        title="Activity Goals"
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1"
        action={
        /* Period toggle */
        <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1 shadow-inner">
          {(["today", "week", "month"] as const).map((p) => {
            const isActive = goalPeriod === p;

            return (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`h-8 rounded-xl px-5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-green-600 shadow-[0_2px_8px_rgba(15,23,42,0.12)] ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "today"
                  ? "Today"
                  : p === "week"
                    ? "This Week"
                    : "This Month"}
              </button>
            );
          })}
        </div>
        }
      />
      <p className="text-xs text-gray-400 mb-4">
        Goal:{" "}
        <span className="font-medium text-gray-600">
          ${REVENUE_GOAL.toLocaleString()}/mo
        </span>
        {" · "}~{closesNeeded} closes at ${AVG_DEAL_SIZE} avg
      </p>

      {/* Weekend banner on Today tab */}
      {goalPeriod === "today" && isWeekend && (
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 mb-4 text-xs text-purple-700">
          <span>🎉</span>
          <span>
            It's the weekend — no targets today. Anything you log is extra
            credit.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(["outreach", "followup"] as const).map((category) => (
          <div key={category}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {category === "outreach" ? "Cold Outreach" : "Follow-Up"}
            </p>
            <div className="flex flex-col gap-3">
              {Object.entries(ACTIVITY_CHANNELS)
                .filter(([, v]) => v.category === category)
                .map(([type, { label, targets }]) => {
                  const target = targets[goalPeriod];
                  // Skip channels with no target for this period
                  // (e.g. Networking has no daily target)
                  if (target === undefined) return null;
                  const isExtraCredit = goalPeriod === "today" && isWeekend;
                  const count = activityCount(
                    type,
                    PERIOD_START[goalPeriod],
                    PERIOD_END[goalPeriod],
                  );
                  const pct = Math.min(
                    Math.round((count / target) * 100),
                    100,
                  );
                  const color = isExtraCredit
                    ? "bg-purple-400"
                    : pct >= 80
                      ? "bg-green-500"
                      : pct >= 40
                        ? "bg-amber-400"
                        : "bg-red-400";
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{label}</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {count}
                          {!isExtraCredit && (
                            <span className="text-gray-400 font-normal">
                              {" "}
                              / {target}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`${color} h-1.5 rounded-full transition-all`}
                          style={{
                            width: isExtraCredit
                              ? `${Math.min(count * 10, 100)}%`
                              : `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
