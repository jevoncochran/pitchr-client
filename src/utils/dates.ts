/** A date as YYYY-MM-DD in local time (for date inputs and date-only API fields). */
export const localDateKey = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};
