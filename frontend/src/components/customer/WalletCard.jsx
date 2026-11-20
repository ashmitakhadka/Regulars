import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faFire, faGift } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { StampProgress } from "./StampProgress";
import { formatPlainDate } from "../../lib/formatVisitDate";

/**
 * Reusable WalletCard component for customer wallet listings.
 * Displays shop logo (with store icon fallback), program name, stamp progress,
 * reward preview, streak badge (only if active >= 2), and paused/completed tags.
 */
export const WalletCard = ({ card }) => {
  const [imgError, setImgError] = useState(false);

  const business = card.business || {};
  const program = card.program || {};
  const reward = card.reward || {};
  const streak = card.streak || {};

  const isCompleted = card.status === "completed";
  const isSuspended = business.status === "suspended";
  const earningMethod = card.earning_method || "visit";
  const isVisit = earningMethod === "visit";

  const stampsEarned = Number(card.stamps_earned) || 0;
  const stampsRequired = Number(card.stamps_required) || Number(card.threshold) || 10;

  // Streak is shown only when streak_active is true AND current_streak >= 2
  const currentStreak = Number(streak.current_streak ?? card.current_streak ?? 0);
  const streakActive = Boolean(streak.streak_active ?? card.streak_active);
  const showStreak = streakActive && currentStreak >= 2;

  // Last visit date formatting
  const lastVisit = streak.last_visit_date || card.last_visit_date;
  const formattedLastVisit = lastVisit ? formatPlainDate(lastVisit) : null;

  // Reward title
  const rewardTitle = reward.title || card.reward_title || "Special Reward";

  // Value text for StampProgress
  let valueText = undefined;
  if (isCompleted) {
    valueText = "Completed";
  } else if (!isVisit) {
    valueText = `${stampsEarned} of ${stampsRequired}`;
  }

  return (
    <Link
      to={`/wallet/${card.id}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 rounded-xl transition"
    >
      <Card className="h-full flex flex-col justify-between group-hover:shadow-[0_4px_16px_rgba(43,17,20,0.1)] transition-all">
        <div>
          {/* Card Header: Business Logo + Business Name + Tags */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Business Logo or Store Icon in Cream Circle */}
              {business.logo && !imgError ? (
                <img
                  src={business.logo}
                  alt=""
                  onError={() => setImgError(true)}
                  className="h-11 w-11 shrink-0 rounded-full object-cover border border-blush-200"
                />
              ) : (
                <div
                  className="h-11 w-11 shrink-0 rounded-full bg-blush-100 flex items-center justify-center text-ink-soft border border-blush-200"
                  aria-hidden="true"
                >
                  <FontAwesomeIcon icon={faStore} className="text-sm text-ink-soft" />
                </div>
              )}

              <div className="min-w-0">
                <h2 className="font-display text-base sm:text-lg font-bold text-brand-900 group-hover:text-brand-800 transition truncate">
                  {business.name || "Business"}
                </h2>
                <p className="text-xs text-ink-soft truncate">
                  {program.name || "Loyalty Program"}
                </p>
              </div>
            </div>

            {/* Status Tags */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              {isSuspended && (
                <Tag variant="amber" className="text-xs">
                  Paused
                </Tag>
              )}
              {isCompleted ? (
                <Tag variant="cream" className="text-xs">
                  Completed
                </Tag>
              ) : !isVisit && (
                <Tag variant="cream" className="capitalize text-xs">
                  {earningMethod}
                </Tag>
              )}
            </div>
          </div>

          {/* Stamp Progress */}
          <div className="mt-2">
            <StampProgress
              stamps={isCompleted ? stampsRequired : stampsEarned}
              total={stampsRequired}
              valueText={valueText}
            />
          </div>

          {/* Reward Line */}
          <div className="mt-3.5 flex items-center gap-2 text-xs sm:text-sm text-ink-soft font-medium">
            <FontAwesomeIcon
              icon={faGift}
              className="text-brand-800 shrink-0 text-xs"
              aria-hidden="true"
            />
            <span className="truncate">
              <strong className="text-brand-900 font-semibold">Reward:</strong> {rewardTitle}
            </span>
          </div>
        </div>

        {/* Card Footer: Secondary Info (Last Visit & Streak Badge) */}
        <div className="mt-4 pt-3 border-t border-blush-100 flex items-center justify-between text-xs text-ink-soft min-h-[32px]">
          <div>
            {formattedLastVisit && (
              <span>Last visit: {formattedLastVisit}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showStreak && (
              <span className="inline-flex items-center gap-1 font-semibold text-brand-900 bg-blush-100 px-2 py-0.5 rounded-full border border-blush-200">
                <FontAwesomeIcon icon={faFire} className="text-brand-800" aria-hidden="true" />
                {currentStreak} day streak
              </span>
            )}
            <span className="font-semibold text-brand-800 group-hover:underline">
              View card &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default WalletCard;
