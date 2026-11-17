import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faStar,
  faClock,
  faCalendarDays,
  faBarcode,
  faCodeBranch,
} from "@fortawesome/free-solid-svg-icons";
import { RewardProgramStatus } from "./RewardProgramStatus";

export const RewardProgramDetailsCard = ({ program }) => {
  if (!program) return null;

  // Extract versions and active version
  const versions = program.versions || [];
  const activeVersion =
    versions.find((v) => v.status === "active") || versions[0] || null;

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const reward = activeVersion?.reward;

  const formatEarningType = (type) => {
    switch (type) {
      case "visit":
        return "Per Store Visit";
      case "purchase":
        return "Minimum Spend Amount";
      case "quantity":
        return "Item Quantity Purchased";
      default:
        return type || "Visit";
    }
  };

  const formatRewardType = (type) => {
    switch (type) {
      case "free_item":
        return "Free Item / Product";
      case "discount_percentage":
        return "Percentage Discount";
      case "discount_fixed":
        return "Fixed Amount Discount";
      case "custom":
        return "Custom Perk";
      default:
        return type || "Reward";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Card */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F4F0EA] text-[#A51D27]">
              <FontAwesomeIcon icon={faGift} className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-xl font-bold text-[#23140C] sm:text-2xl">
                  {program.name}
                </h2>
                <RewardProgramStatus status={program.status} />
              </div>

              {program.description ? (
                <p className="mt-2 text-sm leading-relaxed text-[#23140C]/70">
                  {program.description}
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-[#23140C]/40">
                  No program description provided.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#23140C]/50">
                <span>
                  Created on <strong>{formatDate(program.created_at)}</strong>
                </span>
                <span>•</span>
                <span>
                  Active Version:{" "}
                  <strong>Version {activeVersion?.version_number || 1}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Earning Rules & Reward Specification Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Earning Rules Box */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
          <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-[#A51D27]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#23140C]">
                Earning Rules
              </h3>
              <p className="text-xs text-[#23140C]/50">
                How customers earn stamps
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-[#23140C]/60">
                <FontAwesomeIcon icon={faBarcode} className="h-3.5 w-3.5" />
                Earning Type
              </span>
              <span className="font-bold text-[#23140C]">
                {formatEarningType(earningRule?.earning_type)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="text-xs font-semibold uppercase text-[#23140C]/60">
                Threshold Required
              </span>
              <span className="font-bold text-[#23140C]">
                {earningRule?.threshold ? (
                  <span>
                    {earningRule.earning_type === "purchase" ? "$" : ""}
                    {earningRule.threshold}{" "}
                    <span className="text-xs font-normal text-[#23140C]/60">
                      {earningRule.earning_type === "visit"
                        ? "visit(s)"
                        : earningRule.earning_type === "quantity"
                        ? "item(s)"
                        : "spend"}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="text-xs font-semibold uppercase text-[#23140C]/60">
                Stamps Awarded
              </span>
              <span className="font-bold text-[#A51D27]">
                {earningRule?.stamps_awarded ?? "—"} stamp
                {earningRule?.stamps_awarded > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-[#23140C]/60">
                <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5" />
                Daily Stamp Limit
              </span>
              <span className="font-bold text-[#23140C]">
                {earningRule?.daily_stamp_limit
                  ? `${earningRule.daily_stamp_limit} stamp(s) / day`
                  : "No Daily Limit"}
              </span>
            </div>
          </div>
        </section>

        {/* Reward Details Box */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
          <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faGift} className="h-4 w-4 text-[#A51D27]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#23140C]">
                Reward Details
              </h3>
              <p className="text-xs text-[#23140C]/50">
                Customer redemption value
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-[#23140C]/60">
                Reward Title
              </p>
              <p className="mt-1 font-bold text-[#23140C]">
                {reward?.title || "—"}
              </p>
              {reward?.description && (
                <p className="mt-1 text-xs text-[#23140C]/70">
                  {reward.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="text-xs font-semibold uppercase text-[#23140C]/60">
                Reward Type
              </span>
              <span className="font-bold text-[#23140C]">
                {formatRewardType(reward?.reward_type)}
              </span>
            </div>

            {reward?.reward_value !== null && reward?.reward_value !== undefined && (
              <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
                <span className="text-xs font-semibold uppercase text-[#23140C]/60">
                  Reward Value
                </span>
                <span className="font-bold text-[#23140C]">
                  {reward.reward_type === "discount_percentage"
                    ? `${reward.reward_value}%`
                    : `$${reward.reward_value}`}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl bg-[#F4F0EA]/40 p-3 text-sm">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-[#23140C]/60">
                <FontAwesomeIcon icon={faCalendarDays} className="h-3.5 w-3.5" />
                Voucher Validity
              </span>
              <span className="font-bold text-[#23140C]">
                {reward?.voucher_validity_days ?? 30} days
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Version Information History */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
        <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faCodeBranch} className="h-4 w-4 text-[#A51D27]" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#23140C]">
              Version Information
            </h3>
            <p className="text-xs text-[#23140C]/50">
              Loyalty program history and policy versions
            </p>
          </div>
        </div>

        {versions.length > 0 ? (
          <div className="mt-5 divide-y divide-[#F4F0EA]">
            {versions.map((ver) => (
              <div
                key={ver.id || ver.version_number}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      ver.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-[#F4F0EA] text-[#23140C]/60"
                    }`}
                  >
                    v{ver.version_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#23140C]">
                        Version {ver.version_number}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          ver.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#F4F0EA] text-[#23140C]/60"
                        }`}
                      >
                        {ver.status || "active"}
                      </span>
                    </div>
                    <p className="text-xs text-[#23140C]/50">
                      Effective since {formatDate(ver.effective_at || ver.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#23140C]/60 sm:text-right">
                  <span>
                    Rule:{" "}
                    <strong>
                      {ver.earning_rule?.earning_type ||
                        ver.earningRule?.earning_type ||
                        "—"}
                    </strong>
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Reward:{" "}
                    <strong>
                      {ver.reward?.title || "—"}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs italic text-[#23140C]/50">
            No version history recorded.
          </p>
        )}
      </section>
    </div>
  );
};

export default RewardProgramDetailsCard;
