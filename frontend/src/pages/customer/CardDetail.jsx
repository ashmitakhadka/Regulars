import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faGift,
  faFire,
  faClock,
  faStore,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { walletService } from "../../services/customer/walletService";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { StampProgress } from "../../components/customer/StampProgress";
import { StampGrid } from "../../components/customer/StampGrid";
import {
  formatPlainDate,
  formatPlainTime,
  formatVisitDateTime,
} from "../../lib/formatVisitDate";

/**
 * Customer Stamp Card Detail page (/wallet/:cardId).
 * Displays card progress, stamp grid, reward details, streak bonuses, and visit history.
 */
export const CardDetail = () => {
  const { cardId } = useParams();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [is404, setIs404] = useState(false);

  const activeRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchCard = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const requestId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);
    setIs404(false);

    try {
      const response = await walletService.getCard(cardId, controller.signal);
      if (requestId === activeRequestIdRef.current) {
        setCard(response.data);
        setLoading(false);
      }
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (requestId === activeRequestIdRef.current) {
        if (err.response?.status === 404) {
          setIs404(true);
        } else {
          setError(
            err.response?.data?.message || "Failed to load card details. Please try again."
          );
        }
        setLoading(false);
      }
    }
  }, [cardId]);

  useEffect(() => {
    fetchCard();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCard]);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" aria-live="polite">
        <Spinner size="lg" className="text-brand-800" />
        <p className="mt-3 text-sm text-ink-soft">Loading stamp card...</p>
      </div>
    );
  }

  // 404 Not Found State
  if (is404) {
    return (
      <div className="space-y-6">
        <Link
          to="/wallet"
          className="text-xs sm:text-sm font-semibold text-brand-800 hover:underline inline-flex items-center gap-1.5 min-h-[44px] py-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" aria-hidden="true" />
          <span>Back to wallet</span>
        </Link>
        <EmptyState
          title="Card not found"
          description="This stamp card does not exist or belongs to another customer account."
          action={
            <Button to="/wallet" variant="primary" size="md">
              Back to wallet
            </Button>
          }
        />
      </div>
    );
  }

  // General Error State with Retry
  if (error || !card) {
    return (
      <div className="space-y-6">
        <Link
          to="/wallet"
          className="text-xs sm:text-sm font-semibold text-brand-800 hover:underline inline-flex items-center gap-1.5 min-h-[44px] py-2"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" aria-hidden="true" />
          <span>Back to wallet</span>
        </Link>
        <ErrorState
          title="Couldn't load card details"
          message={error || "An unexpected error occurred."}
          onRetry={fetchCard}
        />
      </div>
    );
  }

  // Extracted Data
  const business = card.business || {};
  const program = card.program || {};
  const reward = card.reward || {};
  const streak = card.streak || {};
  const visits = card.visit_history || [];

  const isCompleted = card.status === "completed";
  const isSuspended = business.status === "suspended";
  const earningMethod = card.earning_method || "visit";
  const isVisit = earningMethod === "visit";

  const stampsEarned = Number(card.stamps_earned) || 0;
  const stampsRequired = Number(card.stamps_required) || Number(card.threshold) || 10;

  // Streak details
  const currentStreak = Number(streak.current_streak ?? card.current_streak ?? 0);
  const longestStreak = Number(streak.longest_streak ?? card.longest_streak ?? 0);
  const streakActive = Boolean(streak.streak_active ?? card.streak_active);
  const showCurrentStreak = streakActive && currentStreak >= 2;
  const showLongestStreak = longestStreak > 0;
  const hasStreakSection = showCurrentStreak || showLongestStreak;

  // Stamp progress value text
  let valueText = undefined;
  if (isCompleted) {
    valueText = "Completed";
  } else if (!isVisit) {
    valueText = `${stampsEarned} of ${stampsRequired}`;
  }

  // Reward info
  const rewardTitle = reward.title || card.reward_title || "Special Reward";
  const rewardDesc = reward.description || card.reward_description;
  const validityDays = reward.voucher_validity_days;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back Link to Wallet */}
      <div>
        <Link
          to="/wallet"
          className="text-xs sm:text-sm font-semibold text-brand-800 hover:underline inline-flex items-center gap-1.5 min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-800 rounded"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" aria-hidden="true" />
          <span>Back to wallet</span>
        </Link>
      </div>

      {/* Header: Business & Program Name + Status Tag */}
      <Card padding="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {business.slug ? (
              <Link
                to={`/businesses/${business.slug}`}
                className="font-display text-xl sm:text-2xl font-bold text-brand-900 hover:text-brand-800 transition block truncate"
              >
                {business.name || "Business"}
              </Link>
            ) : (
              <h1 className="font-display text-xl sm:text-2xl font-bold text-brand-900 truncate">
                {business.name || "Business"}
              </h1>
            )}

            <p className="text-sm font-medium text-ink-soft mt-1">
              {program.name || "Loyalty Program"}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {isSuspended && (
              <Tag variant="amber" className="text-xs">
                Paused
              </Tag>
            )}
            {isCompleted ? (
              <Tag variant="cream" className="text-xs">
                Completed
              </Tag>
            ) : (
              <Tag variant="green" className="text-xs">
                Active
              </Tag>
            )}
          </div>
        </div>

        {/* Large Stamp Progress Bar */}
        <div className="mt-6">
          <StampProgress
            stamps={isCompleted ? stampsRequired : stampsEarned}
            total={stampsRequired}
            valueText={valueText}
            className="text-sm sm:text-base"
          />
        </div>

        {/* Visual Stamp Grid (rendered when visit-based and stamps_required <= 20) */}
        {isVisit && stampsRequired <= 20 && (
          <div className="mt-6 pt-6 border-t border-blush-100">
            <StampGrid
              stampsEarned={stampsEarned}
              stampsRequired={stampsRequired}
              isCompleted={isCompleted}
            />
          </div>
        )}
      </Card>

      {/* Reward Card */}
      <Card padding="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-brand-800 mb-3">
          <FontAwesomeIcon icon={faGift} className="text-base" aria-hidden="true" />
          <h2 className="font-display text-base sm:text-lg font-bold text-brand-900">
            Reward Details
          </h2>
        </div>

        <div className="rounded-lg bg-blush-50 p-4 border border-blush-200">
          <h3 className="font-display text-base font-bold text-brand-900">
            {rewardTitle}
          </h3>
          {rewardDesc && (
            <p className="mt-1 text-sm text-ink-soft leading-relaxed">
              {rewardDesc}
            </p>
          )}

          {validityDays && (
            <div className="mt-3 pt-3 border-t border-blush-200/80 flex items-center gap-2 text-xs font-semibold text-brand-900">
              <FontAwesomeIcon icon={faClock} className="text-brand-800" aria-hidden="true" />
              <span>Voucher valid for {validityDays} days upon completion</span>
            </div>
          )}
        </div>
      </Card>

      {/* Streak Information (shown only when applicable) */}
      {hasStreakSection && (
        <Card padding="p-5 sm:p-6">
          <div className="flex items-center gap-2 text-brand-800 mb-2">
            <FontAwesomeIcon icon={faFire} className="text-base" aria-hidden="true" />
            <h2 className="font-display text-base sm:text-lg font-bold text-brand-900">
              Visit Streak
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {showCurrentStreak && (
              <div className="rounded-lg bg-blush-50 p-3 border border-blush-200">
                <span className="text-xs text-ink-soft font-medium">Current streak</span>
                <p className="text-lg font-display font-bold text-brand-900 mt-0.5">
                  {currentStreak} days
                </p>
              </div>
            )}
            {showLongestStreak && (
              <div className="rounded-lg bg-blush-50 p-3 border border-blush-200">
                <span className="text-xs text-ink-soft font-medium">Longest streak</span>
                <p className="text-lg font-display font-bold text-brand-900 mt-0.5">
                  {longestStreak} days
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-ink-soft leading-normal">
            Visit on consecutive days to build a streak. Streaks are just a bonus, stamps earn the reward.
          </p>
        </Card>
      )}

      {/* Recent Visits at This Business */}
      <Card padding="p-5 sm:p-6">
        <h2 className="font-display text-base sm:text-lg font-bold text-brand-900 mb-4">
          Recent visits at this business
        </h2>

        {visits.length === 0 ? (
          <EmptyState
            title="No visits yet"
            description="Visits at this business will appear here as your card gets scanned."
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-blush-100">
            {visits.map((visit) => {
              const isSuccess = visit.result === "successful" || visit.status === "successful";
              const formattedDate = formatPlainDate(visit.date);
              const formattedTime = formatPlainTime(visit.time);
              const stampsAwarded = visit.stamps_awarded;

              return (
                <div
                  key={visit.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-900">
                      {formattedDate}
                    </p>
                    {formattedTime && (
                      <p className="text-xs text-ink-soft mt-0.5">
                        {formattedTime}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isSuccess ? (
                      <div className="flex items-center gap-2">
                        <Tag variant="green" className="text-xs">
                          Stamp added
                        </Tag>
                        {stampsAwarded && (
                          <span className="text-xs font-bold text-brand-900">
                            +{stampsAwarded}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-right">
                        <Tag variant="red" className="text-xs">
                          Not counted
                        </Tag>
                        {visit.rejection_reason && (
                          <span className="text-xs text-brand-900 font-medium max-w-[180px] sm:max-w-none truncate">
                            {visit.rejection_reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CardDetail;
