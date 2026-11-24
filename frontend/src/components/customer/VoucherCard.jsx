import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Tag } from "../ui/Tag";
import { formatPlainDate } from "../../lib/formatVisitDate";

/**
 * Reusable VoucherCard component for customer voucher listings.
 * Clean card layout matching the user's design screenshot:
 * - Left: Uppercase merchant name, bold reward title, and formatted date
 * - Right: Status tag (only for 'all' and 'active' filters), and monospace code
 */
export const VoucherCard = ({ voucher, activeFilter = "all" }) => {
  const business = voucher.business || {};

  // Status tag configuration based on current active filter
  let tagText = null;
  let tagVariant = "cream";

  if (activeFilter === "all") {
    if (voucher.status === "active") {
      tagVariant = "green";
      tagText = "Active";
    } else if (voucher.status === "expired") {
      tagVariant = "red";
      tagText = "Expired";
    } else if (voucher.status === "used") {
      tagVariant = "cream";
      tagText = "Redeemed";
    }
  } else if (activeFilter === "active") {
    if (voucher.expiring_soon) {
      tagVariant = "amber";
      if (voucher.days_left === 0) {
        tagText = "Expires today";
      } else if (voucher.days_left === 1) {
        tagText = "Expires in 1 day";
      } else if (voucher.days_left > 1) {
        tagText = `Expires in ${voucher.days_left} days`;
      } else {
        tagText = "Expiring soon";
      }
    } else {
      tagVariant = "green";
      if (voucher.days_left === 1) {
        tagText = "1 day left";
      } else if (voucher.days_left > 1) {
        tagText = `${voucher.days_left} days remaining`;
      } else {
        tagText = "Active";
      }
    }
  }
  // For 'used' and 'expired' filters, tagText remains null (no redundant status tag)

  // Formatted date string
  let dateText = "";
  if (voucher.status === "active" && voucher.expires_at) {
    dateText = `Valid until ${formatPlainDate(voucher.expires_at)}`;
  } else if (voucher.status === "expired" && voucher.expires_at) {
    dateText = `Expired on ${formatPlainDate(voucher.expires_at)}`;
  } else if (voucher.status === "used" && voucher.redeemed_at) {
    dateText = `Redeemed on ${formatPlainDate(voucher.redeemed_at)}`;
  } else if (voucher.expires_at) {
    dateText = `Valid until ${formatPlainDate(voucher.expires_at)}`;
  }

  return (
    <Link
      to={`/vouchers/${voucher.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-800 focus-visible:ring-offset-2 rounded-xl transition"
    >
      <Card className="group-hover:shadow-[0_4px_16px_rgba(43,17,20,0.1)] transition-all">
        <div className="flex items-start justify-between gap-3">
          {/* Left Column: Merchant, Title, Date */}
          <div className="min-w-0 pr-2">
            <span className="text-xs font-semibold text-ink-soft uppercase tracking-wider block truncate">
              {business.name || "Business"}
            </span>
            <h2 className="font-display text-base sm:text-lg font-bold text-brand-900 group-hover:text-brand-800 transition mt-0.5">
              {voucher.reward_title}
            </h2>
            {dateText && (
              <p className="text-xs text-ink-soft mt-2">{dateText}</p>
            )}
          </div>

          {/* Right Column: Tag & Code */}
          <div className="text-right shrink-0">
            {tagText && (
              <Tag variant={tagVariant} className="capitalize">
                {tagText}
              </Tag>
            )}
            <p
              className={`${
                tagText ? "mt-3" : "mt-1"
              } font-mono text-xs font-bold text-brand-900`}
            >
              {voucher.code}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default VoucherCard;
