/** A date as YYYY-MM-DD in local time (for date inputs and date-only API fields). */
export const localDateKey = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

/** "2026-10-15" (or an ISO date-time) -> "Wed, Oct 15", without shifting the day. */
export const formatDateKey = (key: string) =>
  new Date(`${key.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
