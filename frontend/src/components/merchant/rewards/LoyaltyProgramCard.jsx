import { Link } from "react-router-dom";
import { Button } from "../../ui";

const MAX_STAMP_CIRCLES = 12;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One readable sentence describing how customers earn.
const getEarningSummary = (rule, tiers, productRules) => {
  if (!rule) return "Earning rules not set";

  const threshold = Number(rule.threshold) || 0;
  const stamps = Number(rule.stamps_awarded) || 1;
  const earns = `earn ${plural(stamps, "stamp")}`;

  switch (rule.earning_type) {
    case "visit":
      // For visit programs, `threshold` is the number of visits that completes the card.
      return threshold > 1
        ? `Visit ${threshold} times to complete the card`
        : "One visit completes the card";

    case "quantity":
      return productRules.length > 0
        ? `Buy items from ${plural(productRules.length, "product")}, earn stamps per item`
        : "Earn stamps per item purchased";

    case "purchase": {
      if (tiers.length > 0) {
        const minAmount = Number(tiers[0]?.min_amount || 0).toLocaleString();
        const maxStamps = Math.max(
          ...tiers.map((t) => Number(t.stamps_awarded) || 1),
        );
        return `Spend tiers from NPR ${minAmount}, up to ${plural(maxStamps, "stamp")}`;
      }
      return threshold > 0
        ? `Spend NPR ${threshold.toLocaleString()}, ${earns}`
        : `Any purchase, ${earns}`;
    }

    default:
      return "Loyalty program";
  }
};

// How many steps until the reward, depending on program type.
// - visit: number of visits (earning_rule.threshold)
// - purchase: stamps required (reward.stamps_required)
// - quantity: no program-level requirement (each product has its own)
const getProgress = (rule, reward) => {
  if (rule?.earning_type === "visit") {
    return { count: Number(rule.threshold) || 0, label: "visit" };
  }
  if (rule?.earning_type === "purchase") {
    return { count: Number(reward?.stamps_required) || 0, label: "stamp" };
  }
  return null;
};

// Every card gets a Reward row; the kind decides how it renders.
const getRewardInfo = ({ reward, productRules, isQuantity, issuesVoucher }) => {
  if (!issuesVoucher) {
    return { kind: "muted", text: "No voucher, stamps only" };
  }

  if (isQuantity) {
    const items = productRules.map((r) => ({
      id: r.id,
      qty: r.quantity_required,
      product: r.product?.name,
      reward: r.reward?.title || r.reward_title,
    }));

    return items.length > 0
      ? { kind: "products", items }
      : { kind: "warning", text: "No products configured" };
  }

  const title = reward?.title?.trim();
  if (!title) return { kind: "warning", text: "Reward not set" };

  return {
    kind: "single",
    title,
    validity: Number(reward.voucher_validity_days) || 0,
  };
};

// Prefer the active version; otherwise the highest version number.
const pickVersion = (versions) => {
  if (!Array.isArray(versions) || versions.length === 0) return null;

  const active = versions.find((v) => v.status === "active");
  if (active) return active;

  return [...versions].sort(
    (a, b) => (Number(b.version_number) || 0) - (Number(a.version_number) || 0),
  )[0];
};

const LABEL = "text-[12.5px] text-[#23140C]/60";

export const LoyaltyProgramCard = ({ program }) => {
  const activeVersion = pickVersion(program.versions);

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const tiers = earningRule?.tiers || [];
  const productRules =
    earningRule?.product_rules || earningRule?.productRules || [];
  const reward = activeVersion?.reward;

  const isQuantity = earningRule?.earning_type === "quantity";
  const isArchived = program.status?.toLowerCase() === "archived";

  // Defaults to true when the field is missing (matches the backend default).
  const issuesVoucher = Boolean(activeVersion?.issues_voucher ?? true);

  const enrolled = program.enrolled_count ?? program.stamp_cards_count;

  const progress = getProgress(earningRule, reward);
  const requiredCount = progress?.count ?? 0;
  const circleCount = Math.min(requiredCount, MAX_STAMP_CIRCLES);

  const rewardInfo = getRewardInfo({
    reward,
    productRules,
    isQuantity,
    issuesVoucher,
  });

  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] transition-shadow hover:shadow-[0_6px_20px_rgba(35,20,12,0.1)] ${
        isArchived ? "opacity-75" : ""
      }`}
    >
      {/* Name */}
      <h3 className="font-display text-[17px] font-bold leading-snug text-[#23140C]">
        <Link
          to={`/merchant/loyalty-programs/${program.id}`}
          className="transition-colors hover:text-[#A51D27]"
        >
          {program.name}
        </Link>
      </h3>

      {/* Earn, reward and validity as labeled rows */}
      <dl className="grid grid-cols-[4.5rem_1fr] items-baseline gap-x-3 gap-y-3">
        <dt className={LABEL}>Earn</dt>
        <dd className="min-w-0 text-[14px] text-[#23140C]">
          {getEarningSummary(earningRule, tiers, productRules)}

          {/* Progress preview: the red circle is the reward */}
          {circleCount > 0 && (
            <span
              className="mt-2 flex flex-wrap items-center gap-1.5"
              role="img"
              aria-label={`${plural(requiredCount, progress.label)} required for the reward`}
            >
              {Array.from({ length: circleCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full ${
                    i === requiredCount - 1 ? "bg-[#A51D27]" : "bg-[#F4F0EA]"
                  }`}
                />
              ))}

              {requiredCount > MAX_STAMP_CIRCLES && (
                <span className="ml-1 text-[12.5px] font-medium text-[#23140C]/70">
                  +{requiredCount - MAX_STAMP_CIRCLES}
                </span>
              )}
            </span>
          )}

          {/* Missing requirement for visit/purchase programs */}
          {progress && requiredCount === 0 && (
            <span className="mt-1 block text-[12.5px] text-amber-800">
              {progress.label === "visit"
                ? "Visits required not set"
                : "Stamps required not set"}
            </span>
          )}
        </dd>

        <dt className={LABEL}>Reward</dt>
        <dd className="min-w-0 text-[14px] text-[#23140C]">
          {rewardInfo.kind === "single" && rewardInfo.title}

          {rewardInfo.kind === "products" && (
            <ul className="space-y-1">
              {rewardInfo.items.slice(0, 3).map((item) => (
                <li key={item.id}>
                  Buy {item.qty} {item.product ?? "item"}, get{" "}
                  {item.reward ?? "reward"}
                </li>
              ))}
              {rewardInfo.items.length > 3 && (
                <li className="text-[#23140C]/60">
                  +{rewardInfo.items.length - 3} more
                </li>
              )}
            </ul>
          )}

          {rewardInfo.kind === "muted" && (
            <span className="text-[#23140C]/50">{rewardInfo.text}</span>
          )}

          {rewardInfo.kind === "warning" && (
            <span className="font-medium text-amber-800">
              {rewardInfo.text}
            </span>
          )}
        </dd>

        {rewardInfo.kind === "single" && rewardInfo.validity > 0 && (
          <>
            <dt className={LABEL}>Validity</dt>
            <dd className="text-[14px] text-[#23140C]">
              {rewardInfo.validity} days
            </dd>
          </>
        )}
      </dl>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {enrolled != null && (
            <p className="text-[13px] text-[#23140C]/70">
              {Number(enrolled).toLocaleString()} enrolled
            </p>
          )}
        </div>

        <Button
          className="ml-auto"
          variant="soft"
          size="xs"
          to={`/merchant/loyalty-programs/${program.id}`}
          aria-label={`View details for ${program.name}`}
        >
          View details
        </Button>
      </div>
    </article>
  );
};

export default LoyaltyProgramCard;
