/**
 * Format a UTC ISO timestamp string into Asia/Kathmandu date and time (e.g. "24 Nov 2026, 2:15 PM").
 * Uses Intl.DateTimeFormat with explicit timeZone "Asia/Kathmandu" to ensure exact timezone display.
 */
export function formatKathmanduDateTime(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format a UTC ISO timestamp string into Asia/Kathmandu date only (e.g. "24 Nov 2026").
 */
export function formatKathmanduDate(isoStr) {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kathmandu",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
