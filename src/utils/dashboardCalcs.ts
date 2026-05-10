// ---------------------------------------------------------------------------
// Pure stat/filter helpers for the Dashboard page.
// All functions take plain data arrays and a reference "now" date so they
// are easy to unit-test without any React or API setup.
// ---------------------------------------------------------------------------

import {
  NO_CONTACT_TYPES,
  type GoalPeriod,
} from "../components/dashboard/dashboardConstants";

const INACTIVE_STAGES = ["CONVERTED", "DORMANT", "NOT_A_FIT", "LOST"];

// ─── Lead stats ─────────────────────────────────────────────────────────────

export function getActiveLeads(allLeads: any[]): any[] {
  return allLeads.filter((l) => !INACTIVE_STAGES.includes(l.pipelineStage));
}

export function countLeadsThisWeek(allLeads: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return allLeads.filter((l) => new Date(l.createdAt) >= sevenDaysAgo).length;
}

export function countLeadsLastWeek(allLeads: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return allLeads.filter((l) => {
    const d = new Date(l.createdAt);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
}

export function countTouchedThisWeek(allTouchpoints: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return allTouchpoints.filter(
    (tp) => !NO_CONTACT_TYPES.has(tp.type) && new Date(tp.date) >= sevenDaysAgo,
  ).length;
}

export function countTouchedLastWeek(allTouchpoints: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return allTouchpoints.filter((tp) => {
    if (NO_CONTACT_TYPES.has(tp.type)) return false;
    const d = new Date(tp.date);
    return d >= fourteenDaysAgo && d < sevenDaysAgo;
  }).length;
}

export function countMeetingsScheduled(allLeads: any[]): number {
  return allLeads.filter((l) => l.pipelineStage === "MEETING_SCHEDULED").length;
}

export function countConversionsThisMonth(allLeads: any[], now: Date): number {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return allLeads.filter(
    (l) =>
      l.pipelineStage === "CONVERTED" &&
      l.convertedAt &&
      new Date(l.convertedAt) >= startOfMonth,
  ).length;
}

// ─── Lead buckets ────────────────────────────────────────────────────────────

export function filterNewLeads(allLeads: any[]): any[] {
  return allLeads.filter((l) => !l.touchPoint || l.touchPoint.length === 0);
}

export function filterGoneSilent(allLeads: any[], now: Date): any[] {
  return allLeads
    .filter((l) => {
      if (INACTIVE_STAGES.includes(l.pipelineStage)) return false;
      if (!l.touchPoint || l.touchPoint.length === 0) return false;
      const daysSince =
        (now.getTime() - new Date(l.touchPoint[0].date).getTime()) /
        (1000 * 60 * 60 * 24);
      return daysSince >= 7;
    })
    .sort(
      (a, b) =>
        new Date(a.touchPoint[0].date).getTime() -
        new Date(b.touchPoint[0].date).getTime(),
    );
}

// ─── Task buckets ─────────────────────────────────────────────────────────────

export interface TaskBuckets {
  urgentTasks: any[];
  todayTasks: any[];
  upcomingTasks: any[];
}

export function bucketTasks(tasks: any[], now: Date): TaskBuckets {
  const todayStr = now.toDateString();

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

  const in7 = new Date(now);
  in7.setDate(now.getDate() + 7);
  const upcomingTasks = tasks.filter((r: any) => {
    if (r.isEmailSentCheck) return false;
    const d = new Date(r.dueDate);
    return d > now && d.toDateString() !== todayStr && d <= in7;
  });

  return { urgentTasks, todayTasks, upcomingTasks };
}

// ─── Activity Goals ──────────────────────────────────────────────────────────

export interface ActivityPeriodBounds {
  periodStart: Record<GoalPeriod, Date>;
  periodEnd: Record<GoalPeriod, Date>;
  isWeekend: boolean;
}

/**
 * Computes the start/end date boundaries for each goal period (today, week,
 * month) relative to `now`, plus whether `now` falls on a weekend.
 *
 * "Week" is Monday-anchored calendar week.
 * All start/end times are midnight-aligned so a touchpoint dated today at any
 * hour falls within the today bucket.
 */
export function getActivityPeriodBounds(now: Date): ActivityPeriodBounds {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfCalendarWeek = new Date(now);
  startOfCalendarWeek.setDate(now.getDate() - daysFromMonday);
  startOfCalendarWeek.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const startOfNextCalendarWeek = new Date(startOfCalendarWeek);
  startOfNextCalendarWeek.setDate(startOfCalendarWeek.getDate() + 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    periodStart: {
      today: startOfToday,
      week: startOfCalendarWeek,
      month: startOfMonth,
    },
    periodEnd: {
      today: startOfTomorrow,
      week: startOfNextCalendarWeek,
      month: startOfNextMonth,
    },
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  };
}

/**
 * Counts unique (entity × calendar-day) pairs for a given touchpoint type
 * within the half-open interval [since, until).
 *
 * "Entity" is the lead or contact the touchpoint belongs to — multiple
 * touchpoints to the same entity on the same day count as 1 toward the goal.
 * The same entity on a different day counts as 1 more.
 *
 * The upper bound prevents future-dated touchpoints from inflating the period.
 * VISIT_ATTEMPT (and any other NO_CONTACT_TYPES) are excluded.
 */
export function countActivityForChannel(
  allTouchpoints: any[],
  type: string,
  since: Date,
  until: Date,
): number {
  const relevant = allTouchpoints.filter((tp) => {
    const d = new Date(tp.date);
    return (
      !NO_CONTACT_TYPES.has(tp.type) &&
      tp.type === type &&
      d >= since &&
      d < until
    );
  });

  const seen = new Set<string>();
  relevant.forEach((tp) => {
    // Use whichever entity id is present — leadId for lead touchpoints,
    // contactId for standalone contact touchpoints.
    const entityId = tp.leadId ?? tp.contactId ?? "unknown";
    seen.add(`${entityId}_${new Date(tp.date).toDateString()}`);
  });

  return seen.size;
}
