import { useState, useEffect, useContext } from "react";
import { QuickLog } from "../components/dashboard/QuickLog";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/auth/AuthContext";
import InternalLayout from "../components/InternalLayout";
import { StatCard } from "../components/dashboard/StatCard";
import { UrgentTaskCard } from "../components/dashboard/UrgentTaskCard";
import { TaskRow } from "../components/dashboard/TaskRow";
import { OutreachStats } from "../components/dashboard/OutreachStats";
import { ActivityGoals } from "../components/dashboard/ActivityGoals";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { NoRecentContact } from "../components/dashboard/NoRecentContact";
import { NotYetContacted } from "../components/dashboard/NotYetContacted";
import {
  UsersIcon,
  PlusIcon,
  TouchIcon,
  CalendarIcon,
  TrendIcon,
} from "../components/dashboard/DashboardIcons";
import { TP_LABELS } from "../components/dashboard/dashboardConstants";
import { SectionCard } from "../components/ui/SectionCard";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  getActiveLeads,
  countLeadsThisWeek,
  countLeadsLastWeek,
  countTouchedThisWeek,
  countTouchedLastWeek,
  countMeetingsScheduled,
  countConversionsThisMonth,
  filterNewLeads,
  filterGoneSilent,
  bucketTasks,
} from "../utils/dashboardCalcs";

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
  const now = new Date();
  const activeLeads = getActiveLeads(allLeads);
  const leadsThisWeek = countLeadsThisWeek(allLeads, now);
  const leadsLastWeek = countLeadsLastWeek(allLeads, now);
  const leadsThisWeekDiff = leadsThisWeek - leadsLastWeek;
  const touchedThisWeek = countTouchedThisWeek(allTouchpoints, now);
  const touchedLastWeek = countTouchedLastWeek(allTouchpoints, now);
  const touchedThisWeekDiff = touchedThisWeek - touchedLastWeek;
  const meetingsScheduled = countMeetingsScheduled(allLeads);
  const conversionsThisMonth = countConversionsThisMonth(allLeads, now);

  // Task buckets
  const { urgentTasks, todayTasks, upcomingTasks } = bucketTasks(tasks, now);

  // Lead buckets
  const newLeads = filterNewLeads(allLeads);
  const goneSilent = filterGoneSilent(allLeads, now);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
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
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 md:gap-5 mb-6 md:mb-8">
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

            {/* Outreach Response Rates */}
            {outreachStats && <OutreachStats stats={outreachStats} />}

            {/* Activity Goals */}
            <ActivityGoals
              allTouchpoints={allTouchpoints}
              goalPeriod={goalPeriod}
              onPeriodChange={setGoalPeriod}
            />

            {/* Main two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
              {/* LEFT — action items stacked */}
              <div className="flex flex-col gap-4">
                {/* Urgent Tasks */}
                {urgentTasks.length > 0 && (
                  <div className="bg-[#FFF7F7] border border-red-100 rounded-2xl p-5 md:p-6 shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        ⚠️
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
                        <UrgentTaskCard
                          key={r.id}
                          r={r}
                          onNavigate={navigate}
                          onComplete={handleCompleteTask}
                        />
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
                <SectionCard className="rounded-xl p-5">
                  <SectionHeader
                    title="Today's Follow-ups"
                    className="mb-4"
                    action={
                      todayTasks.length > 0 ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          {todayTasks.length} due today
                        </span>
                      ) : undefined
                    }
                  />
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
                        <TaskRow
                          key={r.id}
                          r={r}
                          onNavigate={navigate}
                          onComplete={handleCompleteTask}
                        />
                      ))}
                    </div>
                  )}
                  {upcomingTasks.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                        Upcoming (next 7 days)
                      </p>
                      <div className="space-y-1">
                        {upcomingTasks.slice(0, 4).map((r: any) => {
                          const name =
                            r.lead?.business ??
                            (r.contact
                              ? `${r.contact.firstName}${r.contact.lastName ? ` ${r.contact.lastName}` : ""}`
                              : "Unknown");
                          const path = r.lead
                            ? `/leads/${r.lead.id}`
                            : `/contacts/${r.contact?.id}`;
                          return (
                            <div
                              key={r.id}
                              className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2"
                              onClick={() => navigate(path)}
                            >
                              <span className="text-gray-700">{name}</span>
                              <span className="text-xs text-gray-400">
                                {TP_LABELS[r.type] ?? r.type} ·{" "}
                                {new Date(r.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </SectionCard>

                <NoRecentContact leads={goneSilent} onNavigate={navigate} />

                <NotYetContacted leads={newLeads} onNavigate={navigate} />
              </div>
              {/* end LEFT */}

              {/* RIGHT — Recent Activity */}
              <RecentActivity
                touchpoints={recentTouchpoints}
                visibleCount={visibleActivityCount}
                onShowMore={() => setVisibleActivityCount((c) => c + 20)}
              />
              {/* end RIGHT */}
            </div>
            {/* end grid */}
          </>
        )}
      </div>
      <QuickLog
        allLeads={allLeads}
        userId={user?.id}
        onSubmitSuccess={fetchAll}
      />
    </InternalLayout>
  );
};
