import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

/**
 * Reusable StampGrid component for loyalty stamp cards.
 * Draws one circle per stamp (filled in brand-800 for earned, empty blush cream for remaining).
 * Rendered when stamps_required <= 20 and earning_method === 'visit'.
 */
export const StampGrid = ({
  stampsEarned = 0,
  stampsRequired = 10,
  isCompleted = false,
  className = "",
}) => {
  const total = Math.max(1, Number(stampsRequired) || 1);
  const earned = isCompleted ? total : Math.min(total, Math.max(0, Number(stampsEarned) || 0));

  return (
    <div
      role="group"
      aria-label={`Loyalty stamp progress: ${earned} of ${total} stamps earned`}
      className={`py-2 max-w-md mx-auto ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
        {Array.from({ length: total }).map((_, index) => {
          const isEarned = index < earned;
          const stampNumber = index + 1;

          return (
            <div
              key={stampNumber}
              aria-label={`Stamp ${stampNumber} of ${total}: ${isEarned ? "Earned" : "Not earned"}`}
              className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all select-none ${
                isEarned
                  ? "bg-brand-800 text-white shadow-sm ring-2 ring-brand-800/20"
                  : "bg-blush-100 text-ink-soft border border-dashed border-blush-300"
              }`}
            >
              {isEarned ? (
                <FontAwesomeIcon icon={faCheck} className="text-xs" aria-hidden="true" />
              ) : (
                <span>{stampNumber}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StampGrid;
