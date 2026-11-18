/**
 * Sanitizes and validates internal redirect paths.
 * Accepts only internal paths that start with a single '/' (never full URLs, never '//' or '/\').
 *
 * @param {string|null|undefined} target - The redirect query parameter or candidate path.
 * @param {string} fallback - The safe fallback path (defaults to '/wallet').
 * @returns {string} Safe internal redirect path.
 */
export function getSafeRedirect(target, fallback = "/wallet") {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Safe internal path: must start with a single '/', not followed by another '/' or '\'
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("://")
  ) {
    return trimmed;
  }

  return fallback;
}

export default getSafeRedirect;
