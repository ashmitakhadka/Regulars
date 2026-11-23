const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Format an ISO date string "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS..." into "DD Mon YYYY" (e.g. "19 Nov 2026").
 * Uses pure string splitting without new Date() so timezone never shifts the calendar day.
 */
export function formatPlainDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";
  const clean = dateStr.trim().split("T")[0].split(" ")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return dateStr;
  }
  return `${day} ${MONTHS[monthIdx]} ${year}`;
}

/**
 * Format a time string "HH:MM:SS" or "HH:MM" into "10:15 AM" format.
 * Uses pure string splitting without timezone shifts.
 */
export function formatPlainTime(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return "";
  const clean = timeStr.trim().split(".")[0];
  const parts = clean.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1].padStart(2, "0");
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

/**
 * Combine formatted date and optional time into a single label, e.g. "19 Nov 2026, 10:15 AM".
 */
export function formatVisitDateTime(dateStr, timeStr) {
  const d = formatPlainDate(dateStr);
  const t = formatPlainTime(timeStr);
  if (d && t) return `${d}, ${t}`;
  return d || t || "";
}

/**
 * Format an ISO datetime string into "DD Mon YYYY, HH:MM AM/PM" using pure string splitting.
 */
export function formatIsoDateTime(isoStr) {
  if (!isoStr || typeof isoStr !== "string") return "";
  const parts = isoStr.trim().split("T");
  const datePart = parts[0];
  const d = formatPlainDate(datePart);
  if (parts.length < 2) return d;

  const timeWithTz = parts[1];
  const timePart = timeWithTz.split(/[+-Z]/)[0];
  const t = formatPlainTime(timePart);
  return t ? `${d}, ${t}` : d;
}

export default formatVisitDateTime;
