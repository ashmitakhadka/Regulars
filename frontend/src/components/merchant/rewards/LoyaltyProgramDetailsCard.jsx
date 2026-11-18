import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faStar,
  faCodeBranch,
  faLayerGroup,
  faBoxesStacked,
  faBox,
} from "@fortawesome/free-solid-svg-icons";
import { LoyaltyProgramStatus } from "./LoyaltyProgramStatus";

export const LoyaltyProgramDetailsCard = ({ program }) => {
  if (!program) return null;

  // Extract versions and active version
  const versions = program.versions || [];
  const activeVersion =
    versions.find((v) => v.status === "active") || versions[0] || null;

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const tiers = earningRule?.tiers || [];
  const productRules =
    earningRule?.product_rules || earningRule?.productRules || [];
  const reward = activeVersion?.reward;

  const isTiered =
    earningRule?.earning_type === "purchase" && tiers.length > 0;
  const isQuantity = earningRule?.earning_type === "quantity";

  const formatEarningType = (type) => {
    switch (type) {
      case "visit":
        return "Per Store Visit";
      case "purchase":
        return isTiered ? "Tier-Based Purchase Amount" : "Minimum Spend Amount";
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faGift} className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="font-display text-[22px] sm:text-[24px] font-bold text-[#23140C]">
                  {program.name}
                </h2>
                <LoyaltyProgramStatus status={program.status} />
              </div>

              {program.description ? (
                <p className="mt-2 text-[14px] leading-relaxed text-[#23140C]/80">
                  {program.description}
                </p>
              ) : (
                <p className="mt-2 text-[13px] italic text-[#23140C]/60">
                  No loyalty program description provided.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[13.5px] text-[#23140C]/75">
                <span>
                  Created on{" "}
                  <strong className="text-[#23140C]">
                    {formatDate(program.created_at)}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Active Version:{" "}
                  <strong className="text-[#23140C]">
                    Version {activeVersion?.version_number || 1}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Earning Mode:{" "}
                  <strong className="text-[#A51D27]">
                    {formatEarningType(earningRule?.earning_type)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Earning Rules Specification */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
        <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-[#A51D27]" />
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold text-[#23140C]">
              Earning Rules
            </h3>
            <p className="text-[13px] text-[#23140C]/75">
              How customers earn stamps toward loyalty rewards
            </p>
          </div>
        </div>

        {/* Earning Overview Row */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[#F4F0EA]/50 p-4">
            <span className="text-[13px] font-semibold text-[#23140C]/75">
              Earning Method
            </span>
            <p className="mt-1 font-bold text-[#23140C] text-[15px]">
              {formatEarningType(earningRule?.earning_type)}
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F0EA]/50 p-4">
            <span className="text-[13px] font-semibold text-[#23140C]/75">
              Daily Stamp Limit
            </span>
            <p className="mt-1 font-bold text-[#23140C] text-[15px]">
              {earningRule?.daily_stamp_limit
                ? `${earningRule.daily_stamp_limit} stamp(s) / day`
                : "No Daily Limit"}
            </p>
          </div>

          <div className="rounded-xl bg-[#F4F0EA]/50 p-4">
            <span className="text-[13px] font-semibold text-[#23140C]/75">
              Rule Mode
            </span>
            <p className="mt-1 font-bold text-[#A51D27] text-[15px]">
              {isQuantity
                ? `${productRules.length} Catalog Products`
                : isTiered
                ? `${tiers.length} Spend Brackets`
                : "Threshold Based"}
            </p>
          </div>
        </div>

        {/* Dynamic Section: Purchase Tiers Table */}
        {isTiered && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faLayerGroup} className="text-[#A51D27]" />
              <h4 className="text-[14.5px] font-bold text-[#23140C]">
                Configured Purchase Tiers
              </h4>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#F4F0EA]">
              <table className="w-full text-left text-[13.5px]">
                <thead className="bg-[#F4F0EA]/70 text-[#23140C]/80 font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Tier #</th>
                    <th className="py-2.5 px-4">Spend Range (NPR)</th>
                    <th className="py-2.5 px-4">Stamps Awarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F0EA]">
                  {tiers.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-[#F4F0EA]/20">
                      <td className="py-2.5 px-4 font-bold text-[#A51D27]">
                        Tier {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#23140C]">
                        {t.max_amount
                          ? `NPR ${Number(t.min_amount).toLocaleString()} – ${Number(t.max_amount).toLocaleString()}`
                          : `NPR ${Number(t.min_amount).toLocaleString()} and above`}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#A51D27]">
                        <span className="inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faStar} className="text-xs" />
                          <span>{t.stamps_awarded} stamp(s)</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Section: Quantity Product Rules & Individual Rewards */}
        {isQuantity && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-[#A51D27]" />
              <h4 className="text-[14.5px] font-bold text-[#23140C]">
                Product Quantity Rules & Individual Rewards
              </h4>
            </div>

            {productRules.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productRules.map((pr, idx) => {
                  const prod = pr.product;
                  const prReward = pr.reward;
                  return (
                    <div
                      key={pr.id || idx}
                      className="rounded-xl border border-[#F4F0EA] bg-[#F4F0EA]/30 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-[#F4F0EA] pb-2">
                        <div className="flex items-center gap-2 font-bold text-[#23140C]">
                          <FontAwesomeIcon icon={faBox} className="text-[#A51D27]" />
                          <span>{prod?.name || `Product #${pr.product_id}`}</span>
                        </div>
                        {prod?.price !== undefined && (
                          <span className="text-[12px] font-semibold text-[#23140C]/70">
                            NPR {Number(prod.price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="text-[13px] space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-[#23140C]/70">Required Quantity:</span>
                          <strong className="text-[#23140C]">
                            {pr.quantity_required} item(s)
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#23140C]/70">Unlocked Reward:</span>
                          <strong className="text-[#A51D27]">
                            {prReward?.title || "Complimentary Reward"}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#23140C]/70">Reward Type:</span>
                          <span className="capitalize text-[#23140C]">
                            {formatRewardType(prReward?.reward_type)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#23140C]/70">Voucher Validity:</span>
                          <span className="text-[#23140C]">
                            {prReward?.voucher_validity_days || 30} days
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] italic text-[#23140C]/60">
                No product rules configured.
              </p>
            )}
          </div>
        )}

        {/* Simple Visit / Purchase Threshold */}
        {!isTiered && !isQuantity && (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#F4F0EA]/40 p-4">
              <span className="text-[13px] font-semibold text-[#23140C]/75">
                Threshold Required
              </span>
              <p className="mt-1 font-bold text-[#23140C] text-[15px]">
                {earningRule?.threshold ? (
                  <span>
                    {earningRule.earning_type === "purchase" ? "NPR " : ""}
                    {Number(earningRule.threshold).toLocaleString()}{" "}
                    <span className="font-normal text-[13px] text-[#23140C]/70">
                      {earningRule.earning_type === "visit" ? "visit(s)" : "spend"}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="rounded-xl bg-[#F4F0EA]/40 p-4">
              <span className="text-[13px] font-semibold text-[#23140C]/75">
                Stamps Awarded
              </span>
              <p className="mt-1 font-bold text-[#A51D27] text-[15px]">
                {earningRule?.stamps_awarded ?? 1} stamp
                {earningRule?.stamps_awarded > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 3. Reward Details (For Visit and Purchase Programs) */}
      {!isQuantity && reward && (
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
          <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faGift} className="h-4 w-4 text-[#A51D27]" />
            </div>
            <div>
              <h3 className="font-display text-[17px] font-bold text-[#23140C]">
                Reward Details
              </h3>
              <p className="text-[13px] text-[#23140C]/75">
                Customer redemption value unlocked upon completing stamps
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3.5">
            <div className="rounded-xl bg-[#F4F0EA]/50 p-4 text-[14px]">
              <p className="font-medium text-[#23140C]/80">Reward Title</p>
              <p className="mt-1 font-bold text-[#23140C] text-[15px]">
                {reward.title}
              </p>
              {reward.description && (
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#23140C]/80">
                  {reward.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#F4F0EA]/50 p-3.5 text-[14px]">
                <span className="text-[12px] font-medium text-[#23140C]/70 block">
                  Reward Type
                </span>
                <span className="font-bold text-[#23140C]">
                  {formatRewardType(reward.reward_type)}
                </span>
              </div>

              {reward.reward_value !== null && reward.reward_value !== undefined && (
                <div className="rounded-xl bg-[#F4F0EA]/50 p-3.5 text-[14px]">
                  <span className="text-[12px] font-medium text-[#23140C]/70 block">
                    Reward Value
                  </span>
                  <span className="font-bold text-[#23140C]">
                    {reward.reward_type === "discount_percentage"
                      ? `${reward.reward_value}%`
                      : `NPR ${reward.reward_value}`}
                  </span>
                </div>
              )}

              <div className="rounded-xl bg-[#F4F0EA]/50 p-3.5 text-[14px]">
                <span className="text-[12px] font-medium text-[#23140C]/70 block">
                  Voucher Validity
                </span>
                <span className="font-bold text-[#23140C]">
                  {reward.voucher_validity_days || 30} days
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Version Information History */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
        <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faCodeBranch} className="h-4 w-4 text-[#A51D27]" />
          </div>
          <div>
            <h3 className="font-display text-[17px] font-bold text-[#23140C]">
              Version Information
            </h3>
            <p className="text-[13px] text-[#23140C]/75">
              Loyalty program historical versions and audit log
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
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold ${
                      ver.status === "active"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-[#F4F0EA] text-[#23140C]/75"
                    }`}
                  >
                    v{ver.version_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-bold text-[#23140C]">
                        Version {ver.version_number}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold capitalize ${
                          ver.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : "bg-[#F4F0EA] text-[#23140C]/75 border border-neutral-300"
                        }`}
                      >
                        {ver.status || "active"}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#23140C]/75">
                      Effective since {formatDate(ver.effective_at || ver.created_at)}
                    </p>
                  </div>
                </div>

                <div className="text-[13.5px] text-[#23140C]/80 sm:text-right">
                  <span>
                    Rule:{" "}
                    <strong className="text-[#23140C]">
                      {ver.earning_rule?.earning_type ||
                        ver.earningRule?.earning_type ||
                        "—"}
                    </strong>
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    Reward:{" "}
                    <strong className="text-[#23140C]">
                      {ver.reward?.title ||
                        (ver.earningRule?.productRules?.length
                          ? `${ver.earningRule.productRules.length} product rewards`
                          : "—")}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13.5px] italic text-[#23140C]/60">
            No version history recorded.
          </p>
        )}
      </section>
    </div>
  );
};

export default LoyaltyProgramDetailsCard;
