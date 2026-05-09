import { useState, useEffect, useContext } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth/AuthContext";
import InternalLayout from "../components/InternalLayout";

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ENGAGED: "Engaged",
  MEETING_SCHEDULED: "Meeting Scheduled",
  PROPOSAL_SENT: "Proposal Sent",
  CONVERTED: "Converted",
  DORMANT: "Dormant",
  NOT_A_FIT: "Not a Fit",
  LOST: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  CONTACTED: "bg-blue-100 text-blue-700",
  ENGAGED: "bg-yellow-100 text-yellow-700",
  MEETING_SCHEDULED: "bg-purple-100 text-purple-700",
  PROPOSAL_SENT: "bg-orange-100 text-orange-700",
  CONVERTED: "bg-green-100 text-green-700",
  DORMANT: "bg-gray-200 text-gray-500",
  NOT_A_FIT: "bg-red-100 text-red-600",
  LOST: "bg-rose-100 text-rose-700",
};

const TP_LABELS: Record<string, string> = {
  EMAIL: "Email",
  IN_PERSON: "In Person",
  CALL: "Call",
  TEXT: "Text",
  MEETING: "Meeting",
  INSTAGRAM_DM: "Instagram DM",
  NETWORKING: "Networking Event",
  WALK_UP: "Walk-Up",
  VISIT_ATTEMPT: "Visit Attempt",
  REFERRAL_OUTREACH: "Referral / 3rd-Party Contact",
};

const StatCard = ({
  label,
  value,
  helper,
  icon,
  onClick,
}: {
  label: string;
  value: number | string;
  helper?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`group bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)] flex flex-col gap-4 transition ${
      onClick
        ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.18)] hover:border-gray-200"
        : ""
    }`}
  >
    <div className="flex items-start gap-4">
      {icon && (
        <div className="flex-shrink-0 w-11 h-11 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100 group-hover:scale-105 transition">
          {icon}
        </div>
      )}

      <div>
        <p className="text-[10px] uppercase tracking-[0.02em] font-semibold text-gray-400">
          {label}
        </p>

        <p className="text-3xl md:text-[34px] leading-none font-bold text-gray-900 mt-2">
          {value}
        </p>
      </div>
    </div>

    {helper && (
      <p
        className={`text-xs font-medium ${helper.startsWith("↑") ? "text-green-600" : "text-gray-400"}`}
      >
        {helper}
      </p>
    )}
  </div>
);

const UsersIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-current"
  >
    <path
      d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Z"
      strokeWidth="2"
    />
    <path
      d="M2.5 19c.7-2.4 2.7-4 5.5-4s4.8 1.6 5.5 4"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M14.5 15c2.4.2 4.1 1.6 4.8 4"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-current"
  >
    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TouchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-current"
  >
    <path d="M9 11V7a2 2 0 1 1 4 0v6" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M13 10.5V9a2 2 0 1 1 4 0v5"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M17 13v-1a2 2 0 1 1 4 0v3c0 4-2.5 7-7 7h-1.5c-2.5 0-4.2-1.2-5.4-3.1L4.4 14.8a1.8 1.8 0 0 1 2.8-2.2L9 14"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-current"
  >
    <path d="M7 3v3M17 3v3" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 8h16" strokeWidth="2" />
    <path
      d="M5 5.5h14a1 1 0 0 1 1 1V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a1 1 0 0 1 1-1Z"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    className="stroke-current"
  >
    <path
      d="M4 16l5-5 4 4 7-8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 7h5v5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageIcon = () => (
  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="stroke-current"
    >
      <path
        d="M4.75 6.75h14.5v10.5H4.75V6.75Z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M5.25 7.25 12 12.25l6.75-5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user as { id: string; firstName: string } | null;

  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTouchpoints, setAllTouchpoints] = useState<any[]>([]);
  const [recentTouchpoints, setRecentTouchpoints] = useState<any[]>([]);
  const [goalPeriod, setGoalPeriod] = useState<"today" | "week" | "month">(
    "today",
  );
  const [visibleActivityCount, setVisibleActivityCount] = useState(20);
  const [outreachStats, setOutreachStats] = useState<{
    dm: { sent: number; responded: number; rate: number };
    email: { sent: number; responded: number; rate: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get("/api/leads"),
      api.get("/api/touchpoints", {}),
      api.get("/api/tasks", {}),
      api.get("/api/touchpoints/stats/outreach"),
    ])
      .then(([leadsRes, tpRes, tasksRes, statsRes]) => {
        setAllLeads(leadsRes.data);
        setAllTouchpoints(tpRes.data);
        setRecentTouchpoints(
          [...tpRes.data].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          ),
        );
        setTasks(tasksRes.data);
        setOutreachStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCompleteTask = (taskId: string) => {
    api.patch(`/api/tasks/${taskId}/complete`, {}).then(fetchAll);
  };

  // Stats
  const activeLeads = allLeads.filter(
    (l) =>
      !["CONVERTED", "DORMANT", "NOT_A_FIT", "LOST"].includes(l.pipelineStage),
  );
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const leadsThisWeek = allLeads.filter(
    (l) => new Date(l.createdAt) >= sevenDaysAgo,
  ).length;
  const meetingsScheduled = allLeads.filter(
    (l) => l.pipelineStage === "MEETING_SCHEDULED",
  ).length;
  const touchedThisWeek = allLeads.filter((l) => {
    if (!l.touchPoint || l.touchPoint.length === 0) return false;
    return new Date(l.touchPoint[0].date) >= sevenDaysAgo;
  }).length;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const conversionsThisMonth = allLeads.filter(
    (l) =>
      l.pipelineStage === "CONVERTED" &&
      l.convertedAt &&
      new Date(l.convertedAt) >= startOfMonth,
  ).length;

  // Trend comparisons (vs last week)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const leadsLastWeek = allLeads.filter((l) => {
    const d = new Date(l.createdAt);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
  const leadsThisWeekDiff = leadsThisWeek - leadsLastWeek;

  const touchedLastWeek = allLeads.filter((l) => {
    if (!l.touchPoint || l.touchPoint.length === 0) return false;
    const d = new Date(l.touchPoint[0].date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
  const touchedThisWeekDiff = touchedThisWeek - touchedLastWeek;

  // Task buckets
  const todayStr = now.toDateString();

  // Urgent = email-sent checks (always immediate) + overdue items
  const emailSentChecks = tasks.filter((r: any) => r.isEmailSentCheck);
  const overdueReminders = tasks.filter(
    (r: any) =>
      !r.isEmailSentCheck &&
      new Date(r.dueDate) < now &&
      new Date(r.dueDate).toDateString() !== todayStr,
  );
  const urgentTasks = [...emailSentChecks, ...overdueReminders];

  const todayTasks = tasks.filter(
    (r: any) =>
      !r.isEmailSentCheck && new Date(r.dueDate).toDateString() === todayStr,
  );
  const upcomingTasks = tasks.filter((r: any) => {
    if (r.isEmailSentCheck) return false;
    const d = new Date(r.dueDate);
    const in7 = new Date(now);
    in7.setDate(now.getDate() + 7);
    return d > now && d.toDateString() !== todayStr && d <= in7;
  });

  // New leads: no touchpoints yet
  const newLeads = allLeads.filter(
    (l) => !l.touchPoint || l.touchPoint.length === 0,
  );

  // Gone silent: has touchpoints but none in 7+ days
  const goneSilent = allLeads
    .filter((l) => {
      if (
        ["CONVERTED", "DORMANT", "NOT_A_FIT", "LOST"].includes(l.pipelineStage)
      )
        return false;
      if (!l.touchPoint || l.touchPoint.length === 0) return false;
      const daysSince =
        (Date.now() - new Date(l.touchPoint[0].date).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysSince >= 7;
    })
    .sort(
      (a, b) =>
        new Date(a.touchPoint[0].date).getTime() -
        new Date(b.touchPoint[0].date).getTime(),
    );

  const daysSince = (dateStr: string) =>
    Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );

  // ── Activity goals ───────────────────────────────────────────────────────
  const REVENUE_GOAL = 5000;
  const AVG_DEAL_SIZE = 700;
  const closesNeeded = Math.ceil(REVENUE_GOAL / AVG_DEAL_SIZE); // 8

  type GoalPeriod = "today" | "week" | "month";

  // Targets are explicit per period. Omitting "today" means the channel is
  // not shown on the Today tab (e.g. networking — you can't plan for it daily).
  const ACTIVITY_CHANNELS: Record<
    string,
    {
      label: string;
      category: "outreach" | "followup";
      targets: Partial<Record<GoalPeriod, number>>;
    }
  > = {
    IN_PERSON: {
      label: "Door Knocks",
      category: "outreach",
      targets: { today: 10, week: 50, month: 220 },
    },
    INSTAGRAM_DM: {
      label: "Instagram DMs",
      category: "outreach",
      targets: { today: 10, week: 50, month: 220 },
    },
    EMAIL: {
      label: "Emails",
      category: "followup",
      targets: { today: 20, week: 100, month: 440 },
    },
    CALL: {
      label: "Calls",
      category: "followup",
      targets: { today: 5, week: 25, month: 110 },
    },
    TEXT: {
      label: "Texts",
      category: "followup",
      targets: { today: 10, week: 50, month: 220 },
    },
    NETWORKING: {
      label: "Networking",
      category: "outreach",
      targets: { week: 3, month: 12 },
    },
  };

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
      return tp.type === type && d >= since && d < until;
    });
    const seen = new Set<string>();
    relevant.forEach((tp) => {
      seen.add(`${tp.leadId}_${new Date(tp.date).toDateString()}`);
    });
    return seen.size;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCheckInRespond = (taskId: string, responded: boolean) => {
    api.patch(`/api/tasks/${taskId}/respond`, { responded }).then(fetchAll);
  };

  const NEXT_ACTION_LABELS: Record<number, string> = {
    1: "Outreach A2",
    2: "Outreach A3",
    3: "Visit B",
    4: "Outreach B2",
    5: "Outreach B3",
    6: "Visit C",
    7: "Outreach C2",
    8: "Outreach C3",
    9: "Deprioritize",
  };

  // Returns a due label and color class for an urgent task
  const getDueLabel = (r: any): { label: string; colorClass: string } => {
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

  const UrgentTaskCard = ({ r }: { r: any }) => {
    const { label: dueLabel, colorClass: dueColor } = getDueLabel(r);
    const prompt = getTaskPrompt(r);

    return (
      <div className="bg-white border border-red-100/80 rounded-2xl px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
        <div className="flex items-start gap-4">
          <MessageIcon />

          <div className="flex-1 min-w-0 md:flex md:items-center md:justify-between md:gap-5">
            <div
              className="min-w-0 cursor-pointer"
              onClick={() => navigate(`/leads/${r.lead.id}`)}
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
                onClick={() => navigate(`/leads/${r.lead.id}`)}
                className="flex-1 md:flex-none bg-green-primary text-white text-sm font-semibold rounded-xl px-5 h-10 whitespace-nowrap shadow-[0_6px_14px_rgba(22,163,74,0.20)] hover:opacity-90 transition"
              >
                Log Follow-Up
              </button>

              <button
                onClick={() => handleCompleteTask(r.id)}
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

  // For non-urgent tasks (today, upcoming) — keep existing compact style
  const TaskRow = ({ r, urgent }: { r: any; urgent?: boolean }) => {
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
              onClick={() => navigate(`/leads/${r.lead.id}`)}
              className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
            >
              Log Follow-Up
            </button>
            <button
              onClick={() => handleCompleteTask(r.id)}
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
          onClick={() => navigate(`/leads/${r.lead.id}`)}
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
            onClick={() => navigate(`/leads/${r.lead.id}`)}
            className="text-xs bg-green-primary text-white rounded px-2.5 py-1 font-medium whitespace-nowrap"
          >
            Log Follow-Up
          </button>
          <button
            onClick={() => handleCompleteTask(r.id)}
            className="text-xs bg-white border border-gray-300 text-gray-500 rounded px-2.5 py-1 font-medium whitespace-nowrap"
          >
            Skip
          </button>
        </div>
      </div>
    );
  };

  return (
    <InternalLayout>
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {greeting()}, {user?.firstName}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Here's what needs your attention today
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/add-lead")}
              className="bg-charcoal text-white rounded-lg px-3 md:px-4 h-[36px] md:h-[40px] text-sm"
            >
              + New Lead
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-5 mb-6 md:mb-8">
              <StatCard
                label="Active Leads"
                value={activeLeads.length}
                helper={
                  leadsThisWeek > 0
                    ? `↑ ${leadsThisWeek} this week`
                    : "No new leads this week"
                }
                icon={<UsersIcon />}
                onClick={() => navigate("/leads")}
              />

              <StatCard
                label="New Leads"
                value={leadsThisWeek}
                helper={
                  leadsThisWeekDiff > 0
                    ? `↑ ${leadsThisWeekDiff} vs last week`
                    : leadsThisWeekDiff < 0
                      ? `${leadsThisWeekDiff} vs last week`
                      : "Same as last week"
                }
                icon={<PlusIcon />}
                onClick={() =>
                  navigate("/leads", { state: { quickFilter: "new" } })
                }
              />

              <StatCard
                label="Touchpoints"
                value={touchedThisWeek}
                helper={
                  touchedThisWeekDiff > 0
                    ? `↑ ${touchedThisWeekDiff} vs last week`
                    : touchedThisWeekDiff < 0
                      ? `${touchedThisWeekDiff} vs last week`
                      : "Same as last week"
                }
                icon={<TouchIcon />}
                onClick={() =>
                  navigate("/leads", {
                    state: { quickFilter: "recently-touched" },
                  })
                }
              />

              <StatCard
                label="Meetings Scheduled"
                value={meetingsScheduled}
                helper={
                  meetingsScheduled > 0
                    ? "Follow up and close"
                    : "No meetings yet"
                }
                icon={<CalendarIcon />}
              />

              <StatCard
                label="Conversions"
                value={conversionsThisMonth}
                helper={
                  conversionsThisMonth > 0
                    ? "↑ Momentum building"
                    : "Start the momentum"
                }
                icon={<TrendIcon />}
              />
            </div>

            {/* Outreach response rates */}
            {outreachStats && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)] mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Outreach Response Rates
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Instagram DMs */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        Instagram DMs
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {outreachStats.dm.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-pink-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${outreachStats.dm.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {outreachStats.dm.responded} of {outreachStats.dm.sent}{" "}
                      responded
                    </p>
                  </div>
                  {/* Emails */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Emails</span>
                      <span className="text-sm font-bold text-gray-800">
                        {outreachStats.email.rate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-blue-400 h-1.5 rounded-full transition-all"
                        style={{ width: `${outreachStats.email.rate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {outreachStats.email.responded} of{" "}
                      {outreachStats.email.sent} responded
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Goals */}
            <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)] mb-6">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                {" "}
                <p className="text-sm font-semibold text-gray-800">
                  Activity Goals
                </p>
                {/* Period toggle */}
                <div className="inline-flex items-center rounded-2xl bg-gray-100 p-1 shadow-inner">
                  {(["today", "week", "month"] as const).map((p) => {
                    const isActive = goalPeriod === p;

                    return (
                      <button
                        key={p}
                        onClick={() => setGoalPeriod(p)}
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
              </div>
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
                    It's the weekend — no targets today. Anything you log is
                    extra credit.
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
                          const isExtraCredit =
                            goalPeriod === "today" && isWeekend;
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
                                <span className="text-xs text-gray-600">
                                  {label}
                                </span>
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
            </div>

            {/* Main two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {/* LEFT — action items stacked */}
              <div className="flex flex-col gap-4">
                {/* Urgent Tasks */}
                {urgentTasks.length > 0 && (
                  <div className="bg-[#FFF7F7] border border-red-100 rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
                    {" "}
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        {/* <div className="w-7 h-7 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm"> */}
                        ⚠️
                        {/* </div> */}
                        <h2 className="font-semibold text-gray-900">
                          Urgent Tasks
                        </h2>
                      </div>

                      <span className="text-xs bg-red-100/80 text-red-600 border border-red-200/70 px-3 py-1.5 rounded-full font-semibold">
                        {urgentTasks.length} item
                        {urgentTasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* Task cards — show top 3 */}
                    <div className="space-y-3.5">
                      {urgentTasks.slice(0, 3).map((r: any) => (
                        <UrgentTaskCard key={r.id} r={r} />
                      ))}
                    </div>
                    {/* Footer CTA */}
                    {urgentTasks.length > 3 && (
                      <div className="pt-5 mt-5 border-t border-red-100/80 text-center">
                        <button
                          onClick={() => navigate("/sequence")}
                          className="text-sm text-red-500 font-semibold hover:text-red-600 transition"
                        >
                          View all {urgentTasks.length} tasks →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Today's Follow-ups */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">
                      Today's Follow-ups
                    </h2>
                    {todayTasks.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        {todayTasks.length} due today
                      </span>
                    )}
                  </div>
                  {todayTasks.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Nothing due today.{" "}
                      {upcomingTasks.length > 0 && (
                        <span className="text-gray-500">
                          Next up: {upcomingTasks[0].lead.business} on{" "}
                          {new Date(
                            upcomingTasks[0].dueDate,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {todayTasks.map((r: any) => (
                        <TaskRow key={r.id} r={r} />
                      ))}
                    </div>
                  )}
                  {upcomingTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Upcoming (next 7 days)
                      </p>
                      <div className="space-y-1">
                        {upcomingTasks.slice(0, 4).map((r: any) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                            onClick={() => navigate(`/leads/${r.lead.id}`)}
                          >
                            <span className="text-gray-700">
                              {r.lead.business}
                            </span>
                            <span className="text-xs text-gray-400">
                              {TP_LABELS[r.type] ?? r.type} ·{" "}
                              {new Date(r.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* No Recent Contact */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-700">
                      No Recent Contact
                    </h2>
                    {goneSilent.length > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                        {goneSilent.length} lead
                        {goneSilent.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {goneSilent.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      All active leads have been contacted in the last 7 days.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {goneSilent.slice(0, 5).map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {lead.business}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lead.industry?.name ?? "—"} ·{" "}
                              {lead.businessType?.name ?? "—"}
                            </p>
                            {lead.assignedTo && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {lead.assignedTo.firstName}{" "}
                                {lead.assignedTo.lastName}
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {daysSince(lead.touchPoint[0].date)}d ago
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Not Yet Contacted */}
                <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-gray-700">
                      Not Yet Contacted
                    </h2>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {newLeads.length} leads
                    </span>
                  </div>
                  {newLeads.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      No uncontacted leads.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {newLeads.slice(0, 5).map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {lead.business}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lead.industry?.name ?? "—"} ·{" "}
                              {lead.businessType?.name ?? "—"}
                            </p>
                            {lead.assignedTo ? (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {lead.assignedTo.firstName}{" "}
                                {lead.assignedTo.lastName}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-300 mt-0.5">
                                Unassigned
                              </p>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            New
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* end LEFT */}

              {/* RIGHT — Recent Activity */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_4px_16px_rgba(15,23,42,0.10)] self-start">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Recent Activity
                </h2>
                {recentTouchpoints.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No activity logged yet.
                  </p>
                ) : (
                  <>
                    <div>
                      {recentTouchpoints
                        .slice(0, visibleActivityCount)
                        .map((tp, index, arr) => (
                          <div key={tp.id} className="flex gap-3">
                            {/* Timeline spine */}
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-2.5 h-2.5 rounded-full bg-green-primary mt-1 flex-shrink-0" />
                              {index < arr.length - 1 && (
                                <div className="w-px bg-green-primary flex-1 mt-1" />
                              )}
                            </div>
                            {/* Content */}
                            <div className={`flex items-start justify-between text-sm w-full ${index < arr.length - 1 ? "pb-3" : ""}`}>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {tp.lead?.business ?? "Unknown"}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  {TP_LABELS[tp.type] ?? tp.type} ·{" "}
                                  {tp.contactedBy?.firstName}{" "}
                                  {tp.contactedBy?.lastName}
                                  {tp.summary && ` · "${tp.summary}"`}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                {new Date(tp.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                    {visibleActivityCount < recentTouchpoints.length && (
                      <div className="pt-4 mt-2 border-t text-center">
                        <button
                          onClick={() => setVisibleActivityCount((c) => c + 20)}
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition"
                        >
                          Show more (
                          {recentTouchpoints.length - visibleActivityCount}{" "}
                          remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* end RIGHT */}
            </div>
            {/* end grid */}
          </>
        )}
      </div>
    </InternalLayout>
  );
};
