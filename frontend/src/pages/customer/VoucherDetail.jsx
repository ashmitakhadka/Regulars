import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTicket } from "@fortawesome/free-solid-svg-icons";
import { voucherService } from "../../services/customer/voucherService";
import { Card } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { BackButton } from "../../components/ui/BackButton";
import { Spinner } from "../../components/ui/Spinner";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { CopyButton } from "../../components/ui/CopyButton";
import { formatPlainDate } from "../../lib/formatVisitDate";

/**
 * Customer Voucher Detail page (/vouchers/:id).
 * Clean, centered card layout matching the user's design screenshot:
 * - Back link and header
 * - Centered card with status & days remaining pill tag
 * - Reward title and description
 * - Compact dashed voucher code box with copy button and dates inside in small text
 * - Terms/validity note at the bottom
 */
export const VoucherDetail = () => {
  const { id } = useParams();

  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const abortControllerRef = useRef(null);

  const fetchVoucher = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setIsNotFound(false);

    try {
      const response = await voucherService.getVoucher(id, controller.signal);
      setVoucher(response.data?.voucher || null);
      setLoading(false);
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        return;
      }
      if (err.response?.status === 404) {
        setIsNotFound(true);
      } else {
        setError(
          err.response?.data?.message ||
            "We couldn't load the voucher details. Please try again."
        );
      }
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVoucher();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchVoucher]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <BackButton to="/vouchers" iconOnly />
        </div>
        <div
          className="flex flex-col items-center justify-center py-20"
          aria-live="polite"
        >
          <Spinner size="lg" className="text-brand-800" />
          <p className="mt-3 text-sm text-ink-soft">Loading voucher details...</p>
        </div>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="space-y-6">
        <div>
          <BackButton to="/vouchers" iconOnly />
        </div>
        <EmptyState
          icon={faTicket}
          title="Voucher not found"
          description="This voucher does not exist or does not belong to your account."
          action={
            <Button to="/vouchers" variant="primary">
              Back to my vouchers
            </Button>
          }
        />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="space-y-6">
        <div>
          <BackButton to="/vouchers" iconOnly />
        </div>
        <ErrorState
          title="Couldn't load voucher"
          message={error || "Voucher details unavailable."}
          onRetry={fetchVoucher}
        />
      </div>
    );
  }

  const business = voucher.business || {};
  const isActive = voucher.status === "active";
  const isUsed = voucher.status === "used";
  const isExpired = voucher.status === "expired";

  // Top pill tag configuration matching the screenshot style: Active • N days remaining
  let tagVariant = "green";
  let tagText = "Active";

  if (isActive) {
    if (voucher.expiring_soon) {
      tagVariant = "amber";
      if (voucher.days_left === 0) {
        tagText = "Active • Expires today";
      } else if (voucher.days_left === 1) {
        tagText = "Active • Expires in 1 day";
      } else if (voucher.days_left > 1) {
        tagText = `Active • Expires in ${voucher.days_left} days`;
      } else {
        tagText = "Active • Expiring soon";
      }
    } else {
      tagVariant = "green";
      if (voucher.days_left === 1) {
        tagText = "Active • 1 day remaining";
      } else if (voucher.days_left > 1) {
        tagText = `Active • ${voucher.days_left} days remaining`;
      } else {
        tagText = "Active";
      }
    }
  } else if (isUsed) {
    tagVariant = "cream";
    tagText = "Redeemed";
  } else if (isExpired) {
    tagVariant = "red";
    tagText = "Expired";
  }

  // Show "Worth Rs. <value>" ONLY when reward_type is free_item and reward_value > 0
  const showRewardValue =
    voucher.reward_type === "free_item" &&
    voucher.reward_value !== null &&
    voucher.reward_value !== undefined &&
    Number(voucher.reward_value) > 0;
  const formattedRewardValue = showRewardValue
    ? Math.round(Number(voucher.reward_value))
    : null;

  return (
    <div className="space-y-6">
      {/* Header with back button & merchant name */}
      <div>
        <BackButton to="/vouchers" iconOnly className="mb-3" />
        <h1 className="font-display text-2xl font-extrabold text-brand-900">
          Voucher Detail
        </h1>
        {business.slug ? (
          <Link
            to={`/businesses/${business.slug}`}
            className="text-sm text-ink-soft hover:text-brand-800 hover:underline inline-block mt-0.5"
          >
            {business.name || "Business"}
          </Link>
        ) : (
          <p className="text-sm text-ink-soft mt-0.5">{business.name || "Business"}</p>
        )}
      </div>

      {/* Main Centered Voucher Card */}
      <Card className="text-center py-8 px-5 sm:px-8 max-w-2xl mx-auto border-none shadow-[0_2px_12px_rgba(43,17,20,0.06)]">
        {/* Status & Expiry Tag */}
        <Tag variant={tagVariant} className="mb-4">
          {tagText}
        </Tag>

        {/* Reward Title */}
        <h2 className="font-display text-2xl font-extrabold text-brand-900 mb-2">
          {voucher.reward_title}
        </h2>

        {/* Optional Worth Value */}
        {showRewardValue && (
          <p className="text-sm font-bold text-brand-800 mb-2">
            Worth Rs. {formattedRewardValue}
          </p>
        )}

        {/* Description */}
        <p className="text-sm text-ink-soft max-w-sm mx-auto mb-6 leading-relaxed">
          {voucher.reward_description ||
            (isActive
              ? "Show this code to the barista before placing your order."
              : isUsed
              ? "This voucher has been redeemed."
              : "This voucher has expired.")}
        </p>

        {/* Voucher Code Box */}
        <div
          className={`inline-block rounded-xl border-2 border-dashed px-6 sm:px-8 py-5 text-center max-w-sm w-full mx-auto ${
            isActive
              ? "bg-blush-50 border-blush-300"
              : "bg-blush-50/50 border-blush-200"
          }`}
        >
          <p className="text-xs uppercase tracking-widest text-ink-soft mb-1 font-semibold">
            Redemption Code
          </p>

          <p
            className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider select-all break-all ${
              isActive
                ? "text-brand-900"
                : "text-brand-900/60 line-through decoration-brand-900/40"
            }`}
          >
            {voucher.code}
          </p>

          {/* Compact copy button for active vouchers */}
          {isActive && (
            <div className="mt-3 flex justify-center">
              <CopyButton text={voucher.code} size="xs" variant="secondary" />
            </div>
          )}

          {/* Dates & status details inside voucher box in smaller size */}
          <div className="mt-4 pt-3 border-t border-blush-200/60 flex items-center justify-center gap-3 sm:gap-4 text-[11px] text-ink-soft flex-wrap">
            {voucher.issued_at && (
              <span>
                Issued:{" "}
                <strong className="font-semibold text-brand-900">
                  {formatPlainDate(voucher.issued_at)}
                </strong>
              </span>
            )}
            {voucher.expires_at && (
              <span>
                {isActive ? "Expires: " : isExpired ? "Expired: " : "Expiry: "}
                <strong className="font-semibold text-brand-900">
                  {formatPlainDate(voucher.expires_at)}
                </strong>
              </span>
            )}
            {isUsed && voucher.redeemed_at && (
              <span>
                Redeemed:{" "}
                <strong className="font-semibold text-brand-900">
                  {formatPlainDate(voucher.redeemed_at)}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Footnote text below code box */}
        <p className="text-xs text-ink-soft mt-6 max-w-md mx-auto leading-relaxed">
          {isActive
            ? `Valid at ${
                business.name || "this business"
              } until ${formatPlainDate(
                voucher.expires_at
              )}. Show this code to the cashier before placing your order.`
            : isUsed
            ? `This voucher was redeemed at ${business.name || "this business"}.`
            : `This voucher expired on ${formatPlainDate(voucher.expires_at)}.`}
        </p>
      </Card>
    </div>
  );
};

export default VoucherDetail;
