/**
 * Adds whole months while keeping the day of month, clamped to the length of
 * the target month: 31 Jan + 1 month = 28/29 Feb, not 3 Mar.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(day, lastDayOfMonth));

  return result;
}
