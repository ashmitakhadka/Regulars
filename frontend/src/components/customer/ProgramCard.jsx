import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGift, faAward } from "@fortawesome/free-solid-svg-icons";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { Button } from "../ui/Button";

/**
 * Reusable ProgramCard for loyalty program listings on shop detail pages.
 * Displays program rules, reward description, and membership status.
 * Notice: When not joined, renders program details without any join button.
 */
export const ProgramCard = ({ program, businessSlug }) => {
  const isJoined = Boolean(program.already_joined || program.joined);
  const cardId = program.card_id;

  const rewardTitle =
    program.reward?.title || program.reward_title || "Special Reward";
  const rewardDesc =
    program.reward?.description || program.reward_description;

  const isVisit = (program.earning_method || "visit") === "visit";
  const ruleText = isVisit && program.stamps_required
    ? `${program.stamps_required} stamps for ${rewardTitle}`
    : `Threshold: ${program.threshold} for ${rewardTitle}`;

  const detailPath = businessSlug
    ? `/businesses/${businessSlug}/programs/${program.id}`
    : null;

  return (
    <Card padding="p-5 sm:p-6" className="flex flex-col justify-between border-none transition-all">
      <div>
        {/* Header: Name & Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-brand-900">
              {detailPath ? (
                <Link
                  to={detailPath}
                  className="hover:text-brand-800 transition focus-visible:outline-none focus-visible:underline"
                >
                  {program.name}
                </Link>
              ) : (
                program.name
              )}
            </h3>
            {program.description && (
              <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
                {program.description}
              </p>
            )}
          </div>

          {isJoined && (
            <Tag variant="green" className="shrink-0 text-xs px-2.5 py-0.5">
              Joined
            </Tag>
          )}
        </div>

        {/* Reward & Stamp Rule Highlight */}
        <div className="mt-4 rounded-lg bg-blush-50 p-3.5 border border-blush-200">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-900">
            <FontAwesomeIcon icon={faGift} className="text-brand-800 shrink-0 text-sm" />
            <span>{ruleText}</span>
          </div>
          {rewardDesc && (
            <p className="text-xs sm:text-sm text-ink-soft leading-normal pl-6 mt-1">
              {rewardDesc}
            </p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-3 border-t border-blush-100 flex items-center justify-between gap-3 flex-wrap">
        {isJoined && cardId ? (
          <Button
            to={`/wallet/${cardId}`}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            View my card
          </Button>
        ) : (
          <span className="text-xs sm:text-sm text-ink-soft font-medium">
            Available at this shop
          </span>
        )}

        {detailPath && (
          <Link
            to={detailPath}
            className="text-xs sm:text-sm font-semibold text-brand-800 hover:underline inline-flex items-center gap-1 min-h-[44px] py-1.5"
          >
            Details &rarr;
          </Link>
        )}
      </div>
    </Card>
  );
};

export default ProgramCard;
