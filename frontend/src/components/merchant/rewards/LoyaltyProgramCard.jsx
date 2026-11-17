import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faStar,
  faClock,
  faArrowRight,
  faCalendarDays,
  faBarcode,
} from "@fortawesome/free-solid-svg-icons";
import { LoyaltyProgramStatus } from "./LoyaltyProgramStatus";

export const LoyaltyProgramCard = ({ program }) => {
  // Extract active or latest version safely
  const activeVersion =
    program.versions?.find((v) => v.status === "active") ||
    program.versions?.[0] ||
    null;

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const reward = activeVersion?.reward;

  // Format earning type label
  const formatEarningType = (type) => {
    switch (type) {
      case "visit":
        return "Per Visit";
      case "purchase":
        return "Minimum Spend";
      case "quantity":
        return "Items Purchased";
      default:
        return type || "Visit";
    }
  };

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] transition-all hover:shadow-[0_6px_20px_rgba(35,20,12,0.1)]">
      <div>
        {/* Top Header: Title and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C] transition-colors group-hover:bg-[#A51D27] group-hover:text-white">
              <FontAwesomeIcon icon={faGift} className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-[17px] font-bold text-[#23140C] leading-snug">
                <Link
                  to={`/merchant/loyalty-programs/${program.id}`}
                  className="hover:text-[#A51D27] transition-colors"
                >
                  {program.name}
                </Link>
              </h3>
              {program.description ? (
                <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-[#23140C]/80">
                  {program.description}
                </p>
              ) : (
                <p className="mt-1 text-[13px] italic text-[#23140C]/60">
                  No description provided
                </p>
              )}
            </div>
          </div>

          <LoyaltyProgramStatus status={program.status} />
        </div>

        {/* Earning Rule & Reward Information */}
        <div className="mt-6 grid grid-cols-2 gap-3.5 rounded-xl bg-[#F4F0EA]/70 p-4">
          {/* Stamps required / Threshold */}
          <div>
            <p className="text-[13px] font-semibold text-[#23140C]/75">
              Threshold
            </p>
            <p className="mt-1 text-[14.5px] font-bold text-[#23140C]">
              {earningRule?.threshold ? (
                <span>
                  {earningRule.earning_type === "purchase" ? "$" : ""}
                  {earningRule.threshold}{" "}
                  <span className="text-[13px] font-medium text-[#23140C]/70">
                    {earningRule.earning_type === "visit"
                      ? "visits"
                      : earningRule.earning_type === "quantity"
                      ? "items"
                      : "spend"}
                  </span>
                </span>
              ) : (
                "—"
              )}
            </p>
          </div>

          {/* Stamps Awarded */}
          <div>
            <p className="text-[13px] font-semibold text-[#23140C]/75">
              Stamps Awarded
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[14.5px] font-bold text-[#A51D27]">
              <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5" />
              <span>
                {earningRule?.stamps_awarded ?? "—"} stamp
                {earningRule?.stamps_awarded > 1 ? "s" : ""}
              </span>
            </p>
          </div>

          {/* Earning Type */}
          <div>
            <p className="text-[13px] font-semibold text-[#23140C]/75">
              Earning Rule
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-[#23140C]/85">
              <FontAwesomeIcon icon={faBarcode} className="h-3.5 w-3.5 text-[#23140C]/60" />
              <span>{formatEarningType(earningRule?.earning_type)}</span>
            </p>
          </div>

          {/* Daily Limit */}
          <div>
            <p className="text-[13px] font-semibold text-[#23140C]/75">
              Daily Limit
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold text-[#23140C]/85">
              <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-[#23140C]/60" />
              <span>
                {earningRule?.daily_stamp_limit
                  ? `${earningRule.daily_stamp_limit}/day`
                  : "No limit"}
              </span>
            </p>
          </div>
        </div>

        {/* Reward Highlight Box (Preserve actual reward terminology) */}
        {reward && (
          <div className="mt-4 flex items-center justify-between border-t border-[#F4F0EA] pt-3.5 text-[13.5px]">
            <div>
              <p className="text-[13px] font-semibold text-[#23140C]/75">
                Reward
              </p>
              <p className="font-bold text-[#23140C] line-clamp-1 text-[14px]">
                {reward.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[13px] font-semibold text-[#23140C]/75">
                Voucher Validity
              </p>
              <p className="flex items-center gap-1.5 font-semibold text-[#23140C]/85 text-[13.5px]">
                <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5 text-[#23140C]/60" />
                <span>{reward.voucher_validity_days} days</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-6 flex items-center justify-between border-t border-[#F4F0EA] pt-4">
        <span className="text-[13px] font-medium text-[#23140C]/75">
          Version {activeVersion?.version_number || 1}
        </span>

        <Link
          to={`/merchant/loyalty-programs/${program.id}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#A51D27] hover:text-[#91040C] transition-colors"
        >
          <span>View Details</span>
          <FontAwesomeIcon icon={faArrowRight} className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
};

export default LoyaltyProgramCard;

