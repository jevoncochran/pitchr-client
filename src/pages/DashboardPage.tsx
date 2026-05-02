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
};

const StatCard = ({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number | string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-white border rounded-xl p-5 flex flex-col gap-1 ${
      onClick ? "cursor-pointer hover:border-gray-300 hover:shadow-sm transition" : ""
    }`}
  >
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
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
  const [reminders, setReminders] = useState<any[]>([]);
  const [recentTouchpoints, setRecentTouchpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get("/api/leads"),
      api.get("/api/touchpoints", {}),
      api.get("/api/reminders", {}),
    ])
      .then(([leadsRes, tpRes, remindersRes]) => {
        setAllLeads(leadsRes.data);
        setRecentTouchpoints(
          [...tpRes.data]
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            )
            .slice(0, 5),
        );
        setReminders(remindersRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCompleteReminder = (reminderId: string) => {
    api.patch(`/api/reminders/${reminderId}/complete`, {}).then(fetchAll);
  };

  // Stats
  const activeLeads = allLeads.filter((l) => l.pipelineStage !== "CONVERTED");
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const leadsThisWeek = allLeads.filter(
    (l) => new Date(l.createdAt) >= startOfWeek,
  ).length;
  const meetingsScheduled = allLeads.filter(
    (l) => l.pipelineStage === "MEETING_SCHEDULED",
  ).length;
  // Leads with a touchpoint logged this calendar week (regardless of when added)
  const touchedThisWeek = allLeads.filter((l) => {
    if (!l.touchPoint || l.touchPoint.length === 0) return false;
    return new Date(l.touchPoint[0].date) >= startOfWeek;
  }).length;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const conversionsThisMonth = allLeads.filter(
    (l) =>
      l.pipelineStage === "CONVERTED" &&
      l.convertedAt &&
      new Date(l.convertedAt) >= startOfMonth,
  ).length;

  // Reminder buckets
  const todayStr = now.toDateString();

  // Urgent = email-sent checks (always immediate) + overdue items
  const emailSentChecks = reminders.filter((r: any) => r.isEmailSentCheck);
  const overdueReminders = reminders.filter(
    (r: any) =>
      !r.isEmailSentCheck &&
      new Date(r.dueDate) < now &&
      new Date(r.dueDate).toDateString() !== todayStr,
  );
  const urgentReminders = [...emailSentChecks, ...overdueReminders];

  const todayReminders = reminders.filter(
    (r: any) =>
      !r.isEmailSentCheck && new Date(r.dueDate).toDateString() === todayStr,
  );
  const upcomingReminders = reminders.filter((r: any) => {
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCheckInRespond = (reminderId: string, responded: boolean) => {
    api
      .patch(`/api/reminders/${reminderId}/respond`, { responded })
      .then(fetchAll);
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

  // Returns a due label and color class for an urgent reminder
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
      <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-start md:items-center gap-3 md:gap-4">
          {" "}
          {/* Icon */}
          <MessageIcon />
          {/* Right-side content column */}
          <div className="flex-1 min-w-0 md:flex md:items-center md:gap-4">
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/leads/${r.lead.id}`)}
            >
              <p className="font-semibold text-gray-900 text-sm leading-snug">
                {r.lead.business}
              </p>
              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                {prompt}
              </p>
              <p className={`text-xs mt-1 font-medium ${dueColor}`}>
                {dueLabel}
              </p>
            </div>
            {/* Actions — stacked on mobile, inline on desktop */}
            <div className="flex flex-row gap-2 mt-3 md:mt-0 md:flex-shrink-0">
              {" "}
              <button
                onClick={() => navigate(`/leads/${r.lead.id}`)}
                className="flex-1 md:flex-none bg-green-primary text-white text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap hover:opacity-90 transition"
              >
                Log Follow-Up
              </button>
              <button
                onClick={() => handleCompleteReminder(r.id)}
                className="flex-1 md:flex-none bg-white border border-gray-200 text-gray-500 text-sm font-medium rounded-lg px-4 py-2 whitespace-nowrap hover:bg-gray-50 transition"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // For non-urgent reminders (today, upcoming) — keep existing compact style
  const ReminderRow = ({ r, urgent }: { r: any; urgent?: boolean }) => {
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
              onClick={() => handleCompleteReminder(r.id)}
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
            onClick={() => handleCompleteReminder(r.id)}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
              <StatCard
                label="Active Leads"
                value={activeLeads.length}
                onClick={() => navigate("/leads")}
              />
              <StatCard
                label="Added This Week"
                value={leadsThisWeek}
                onClick={() => navigate("/leads", { state: { quickFilter: "new" } })}
              />
              <StatCard
                label="Touched This Week"
                value={touchedThisWeek}
                onClick={() => navigate("/leads", { state: { quickFilter: "recently-touched" } })}
              />
              <StatCard label="Meetings Scheduled" value={meetingsScheduled} />
              <StatCard
                label="Conversions This Month"
                value={conversionsThisMonth}
              />
            </div>

            {/* Main two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {/* LEFT — action items stacked */}
              <div className="flex flex-col gap-4">
                {/* Urgent Tasks */}
                {urgentReminders.length > 0 && (
                  <div className="bg-red-50/60 border border-red-200 rounded-2xl p-4 md:p-5 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold text-red-700 flex items-center gap-2">
                        ⚠️ Urgent Tasks
                      </h2>

                      <span className="text-xs bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-semibold">
                        {urgentReminders.length} item
                        {urgentReminders.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Task cards — show top 3 */}
                    <div className="space-y-3">
                      {urgentReminders.slice(0, 3).map((r: any) => (
                        <UrgentTaskCard key={r.id} r={r} />
                      ))}
                    </div>

                    {/* Footer CTA */}
                    {urgentReminders.length > 3 && (
                      <div className="pt-4 mt-4 border-t border-red-100 text-center">
                        <button
                          onClick={() => navigate("/sequence")}
                          className="text-sm text-red-600 font-semibold hover:text-red-700 transition"
                        >
                          View all {urgentReminders.length} tasks →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Today's Follow-ups */}
                <div className="bg-white border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-gray-700">
                      Today's Follow-ups
                    </h2>
                    {todayReminders.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                        {todayReminders.length} due today
                      </span>
                    )}
                  </div>
                  {todayReminders.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Nothing due today.{" "}
                      {upcomingReminders.length > 0 && (
                        <span className="text-gray-500">
                          Next up: {upcomingReminders[0].lead.business} on{" "}
                          {new Date(
                            upcomingReminders[0].dueDate,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {todayReminders.map((r: any) => (
                        <ReminderRow key={r.id} r={r} />
                      ))}
                    </div>
                  )}
                  {upcomingReminders.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Upcoming (next 7 days)
                      </p>
                      <div className="space-y-1">
                        {upcomingReminders.slice(0, 4).map((r: any) => (
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
                <div className="bg-white border rounded-xl p-5">
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
                <div className="bg-white border rounded-xl p-5">
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
              <div className="bg-white border rounded-xl p-5 self-start">
                <h2 className="font-semibold text-gray-700 mb-4">
                  Recent Activity
                </h2>
                {recentTouchpoints.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No activity logged yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentTouchpoints.map((tp) => (
                      <div
                        key={tp.id}
                        className="flex items-start justify-between text-sm border-l-2 border-green-primary pl-3"
                      >
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
                    ))}
                  </div>
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
