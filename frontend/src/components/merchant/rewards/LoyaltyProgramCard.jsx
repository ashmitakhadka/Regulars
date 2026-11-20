import { Link } from "react-router-dom";
import { Button } from "../../ui";

const MAX_STAMP_CIRCLES = 12;

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One readable sentence instead of several labeled boxes.
const getEarningSummary = (rule, tiers, productRules) => {
  if (!rule) return "Earning rules not set";

  const threshold = Number(rule.threshold) || 0;
  const stamps = Number(rule.stamps_awarded) || 1;
  const earns = `earn ${plural(stamps, "stamp")}`;

  switch (rule.earning_type) {
    case "visit":
      return threshold > 1
        ? `Visit ${threshold} times, ${earns}`
        : `Every visit, ${earns}`;

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

// Reward titles as plain text (validity only when the API provides it).
const getRewardInfo = (reward, productRules, isQuantity) => {
  if (isQuantity) {
    const titles = productRules
      .map((r) => r.reward?.title || r.reward_title)
      .filter(Boolean);

    return {
      titles: titles.length
        ? titles.slice(0, 2)
        : ["Individual product rewards"],
      extra: Math.max(titles.length - 2, 0),
    };
  }

  if (!reward) return null;

  return {
    titles: [reward.title],
    extra: 0,
    validity: reward.voucher_validity_days,
  };
};

export const LoyaltyProgramCard = ({ program }) => {
  // Extract active or latest version safely
  const activeVersion =
    program.versions?.find((v) => v.status === "active") ||
    program.versions?.[0] ||
    null;

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const tiers = earningRule?.tiers || [];
  const productRules =
    earningRule?.product_rules || earningRule?.productRules || [];
  const reward = activeVersion?.reward;

  const isQuantity = earningRule?.earning_type === "quantity";
  const isArchived = program.status === "archived";

  // NOTE: adjust these field names to match your API.
  const stampsRequired = Number(
    reward?.stamps_required ?? activeVersion?.stamps_required ?? 0,
  );
  const enrolled = program.enrolled_count ?? program.enrollment_count;

  const rewardInfo = getRewardInfo(reward, productRules, isQuantity);
  const circleCount = Math.min(stampsRequired, MAX_STAMP_CIRCLES);

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
        <dt className="text-[12.5px] text-[#23140C]/60">Earn</dt>
        <dd className="min-w-0 text-[14px] text-[#23140C]">
          {getEarningSummary(earningRule, tiers, productRules)}

          {/* Stamp card preview: the red circle is the reward */}
          {circleCount > 0 && (
            <span
              className="mt-2 flex flex-wrap items-center gap-1.5"
              role="img"
              aria-label={`${plural(stampsRequired, "stamp")} required for the reward`}
            >
              {Array.from({ length: circleCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-4 w-4 rounded-full ${
                    i === stampsRequired - 1 ? "bg-[#A51D27]" : "bg-[#F4F0EA]"
                  }`}
                />
              ))}

              {stampsRequired > MAX_STAMP_CIRCLES && (
                <span className="ml-1 text-[12.5px] font-medium text-[#23140C]/70">
                  +{stampsRequired - MAX_STAMP_CIRCLES}
                </span>
              )}
            </span>
          )}
        </dd>

        {rewardInfo && (
          <>
            <dt className="text-[12.5px] text-[#23140C]/60">Reward</dt>
            <dd className="min-w-0 text-[14px] text-[#23140C]">
              {rewardInfo.titles.join(", ")}
              {rewardInfo.extra > 0 && (
                <span className="text-[#23140C]/70">
                  {" "}
                  (+{rewardInfo.extra} more)
                </span>
              )}
            </dd>

            {rewardInfo.validity && (
              <>
                <dt className="text-[12.5px] text-[#23140C]/60">Validity</dt>
                <dd className="text-[14px] text-[#23140C]">
                  {rewardInfo.validity} days
                </dd>
              </>
            )}
          </>
        )}
      </dl>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        {enrolled != null && (
          <p className="text-[13px] text-[#23140C]/70">
            {Number(enrolled).toLocaleString()} enrolled
          </p>
        )}

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
