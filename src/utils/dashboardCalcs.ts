// ---------------------------------------------------------------------------
// Pure stat/filter helpers for the Dashboard page.
// All functions take plain data arrays and a reference "now" date so they
// are easy to unit-test without any React or API setup.
// ---------------------------------------------------------------------------

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

export function countTouchedThisWeek(allLeads: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return allLeads.reduce((total, l) => {
    if (!l.touchPoint || l.touchPoint.length === 0) return total;
    const count = l.touchPoint.filter(
      (tp: any) => new Date(tp.date) >= sevenDaysAgo,
    ).length;
    return total + count;
  }, 0);
}

export function countTouchedLastWeek(allLeads: any[], now: Date): number {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return allLeads.reduce((total, l) => {
    if (!l.touchPoint || l.touchPoint.length === 0) return total;
    const count = l.touchPoint.filter((tp: any) => {
      const d = new Date(tp.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    }).length;
    return total + count;
  }, 0);
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
