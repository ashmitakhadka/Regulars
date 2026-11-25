import { Card } from "./Card";

/**
 * Reusable StatTile component for platform analytics.
 * Formats numbers with thousands separators and optional badge or subtext.
 */
export const StatTile = ({
  label,
  value,
  subtext,
  badge,
  className = "",
}) => {
  const formattedValue =
    typeof value === "number"
      ? new Intl.NumberFormat("en-US").format(value)
      : value ?? "0";

  return (
    <Card className={`p-4 sm:p-5 flex flex-col justify-between ${className}`.trim()}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {label}
        </span>
        {badge && <div>{badge}</div>}
      </div>

      <div className="mt-3">
        <div className="font-display text-2xl sm:text-3xl font-bold text-brand-900 tracking-tight">
          {formattedValue}
        </div>
        {subtext && (
          <p className="mt-1 text-xs text-ink-soft">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
};

export default StatTile;
