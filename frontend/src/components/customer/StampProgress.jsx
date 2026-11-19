/**
 * Reusable StampProgress component for customer loyalty cards and programs.
 * Formatted with Regulars design tokens: blush track, brand-800 bar, and semantic typography.
 */
export const StampProgress = ({
  stamps = 0,
  total = 10,
  label = "Stamps collected",
  className = "",
}) => {
  const safeStamps = Math.max(0, Number(stamps) || 0);
  const safeTotal = Math.max(1, Number(total) || 1);
  const percentage = Math.min(100, (safeStamps / safeTotal) * 100);

  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-ink-soft mb-1.5">
        <span>{label}</span>
        <span className="text-brand-900 font-bold">
          {safeStamps} of {safeTotal} stamps
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-blush-100">
        <div
          className="h-full rounded-full bg-brand-800 transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={safeStamps}
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-label={`${safeStamps} of ${safeTotal} stamps collected`}
        />
      </div>
    </div>
  );
};

export default StampProgress;
