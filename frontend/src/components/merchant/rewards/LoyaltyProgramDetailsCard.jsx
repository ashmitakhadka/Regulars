const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// One readable sentence for how customers earn.
const getEarningSummary = (rule, tiers) => {
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
      return "Buy specific products, earn stamps per item";
    case "purchase":
      if (tiers.length > 0) return "Spend more, earn more stamps (see tiers)";
      return threshold > 0
        ? `Spend NPR ${threshold.toLocaleString()}, ${earns}`
        : `Any purchase, ${earns}`;
    default:
      return "Loyalty program";
  }
};

const Row = ({ label, children }) => (
  <>
    <dt className="text-[13px] text-[#23140C]/60">{label}</dt>
    <dd className="min-w-0 text-[14px] text-[#23140C]">{children}</dd>
  </>
);

const Section = ({ title, children }) => (
  <section>
    <h3 className="font-display text-[15px] font-bold text-[#23140C]">
      {title}
    </h3>
    <div className="mt-3">{children}</div>
  </section>
);

export const LoyaltyProgramDetailsCard = ({ program }) => {
  if (!program) return null;

  const versions = program.versions || [];
  const activeVersion =
    versions.find((v) => v.status === "active") || versions[0] || null;

  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const tiers = earningRule?.tiers || [];
  const productRules =
    earningRule?.product_rules || earningRule?.productRules || [];
  const reward = activeVersion?.reward;

  const isTiered = earningRule?.earning_type === "purchase" && tiers.length > 0;
  const isQuantity = earningRule?.earning_type === "quantity";

  const hasRewardValue =
    reward?.reward_value !== null && reward?.reward_value !== undefined;

  return (
    <div className="space-y-8 rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-8">
      {/* Overview (the page title already shows the name) */}
      <header>
        {program.description && (
          <p className="text-[14px] leading-relaxed text-[#23140C]/80">
            {program.description}
          </p>
        )}

        <p
          className={`text-[13px] text-[#23140C]/60 ${
            program.description ? "mt-2" : ""
          }`}
        >
          Created {formatDate(program.created_at)} · Version{" "}
          {activeVersion?.version_number || 1}
        </p>
      </header>

      {/* Earning and reward (quantity programs show the Products list instead) */}
      {!isQuantity && (
        <Section title="Earning and reward">
          <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3">
            <Row label="Earn">
              {getEarningSummary(earningRule, tiers)}
            </Row>

            {earningRule?.daily_stamp_limit && (
              <Row label="Daily limit">
                {plural(Number(earningRule.daily_stamp_limit), "stamp")} per day
              </Row>
            )}

            {!isQuantity && reward && (
              <>
                <Row label="Reward">
                  {reward.title}
                  {reward.description && (
                    <span className="mt-0.5 block text-[13px] text-[#23140C]/70">
                      {reward.description}
                    </span>
                  )}
                </Row>

                {hasRewardValue && (
                  <Row label="Value">
                    {reward.reward_type === "discount_percentage"
                      ? `${reward.reward_value}%`
                      : `NPR ${Number(reward.reward_value).toLocaleString()}`}
                  </Row>
                )}

                {reward.stamps_required && (
                  <Row label="Target">
                    {plural(Number(reward.stamps_required), "stamp")} required to complete reward
                  </Row>
                )}

                {reward.voucher_validity_days && (
                  <Row label="Validity">
                    {reward.voucher_validity_days} days
                  </Row>
                )}

                <Row label="Vouchers">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeVersion?.issues_voucher !== false
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {activeVersion?.issues_voucher !== false
                      ? "Automatic issuance enabled"
                      : "No vouchers (completion only)"}
                  </span>
                </Row>
              </>
            )}
          </dl>
        </Section>
      )}

      {/* Spend tiers */}
      {isTiered && (
        <Section title="Spend tiers">
          <ul className="space-y-2 text-[14px] text-[#23140C]">
            {tiers.map((t, idx) => (
              <li
                key={t.id || idx}
                className="flex items-baseline justify-between gap-4"
              >
                <span>
                  {t.max_amount
                    ? `NPR ${Number(t.min_amount).toLocaleString()} to ${Number(t.max_amount).toLocaleString()}`
                    : `NPR ${Number(t.min_amount).toLocaleString()} and above`}
                </span>
                <span className="text-[#23140C]/70">
                  {plural(Number(t.stamps_awarded) || 1, "stamp")}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Products and their rewards */}
      {isQuantity && (
        <Section title="Products">
          {productRules.length > 0 ? (
            <ul className="space-y-3 text-[14px] text-[#23140C]">
              {productRules.map((pr, idx) => {
                const validity = pr.reward?.voucher_validity_days;
                const hasRule = pr.reward && pr.quantity_required;

                return (
                  <li
                    key={pr.id || idx}
                    className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <span>
                      {pr.product?.name || `Product #${pr.product_id}`}
                      {pr.product?.price !== undefined && (
                        <span className="text-[#23140C]/60">
                          {" "}
                          · NPR {Number(pr.product.price).toLocaleString()}
                        </span>
                      )}
                    </span>

                    {hasRule ? (
                      <span className="text-[#23140C]/80">
                        Buy {pr.quantity_required} → {pr.reward.title}
                        {validity && (
                          <span className="text-[#23140C]/60">
                            {" "}
                            · valid {validity} days
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#A51D27]">No reward set</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13.5px] text-[#23140C]/60">
              No products added yet.
            </p>
          )}

          {earningRule?.daily_stamp_limit && (
            <p className="mt-4 text-[13px] text-[#23140C]/60">
              Limit: {plural(Number(earningRule.daily_stamp_limit), "stamp")}{" "}
              per day
            </p>
          )}
        </Section>
      )}

      {/* Version history, collapsed by default */}
      {versions.length > 1 && (
        <details className="group">
          <summary className="cursor-pointer list-none font-display text-[15px] font-bold text-[#23140C] hover:text-[#A51D27]">
            Version history ({versions.length})
          </summary>

          <ul className="mt-3 space-y-2 text-[14px] text-[#23140C]">
            {versions.map((ver) => (
              <li
                key={ver.id || ver.version_number}
                className="flex items-baseline justify-between gap-4"
              >
                <span>
                  Version {ver.version_number}
                  {ver.status === "active" && (
                    <span className="text-emerald-700"> · Active</span>
                  )}
                </span>
                <span className="text-[13px] text-[#23140C]/60">
                  {formatDate(ver.effective_at || ver.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};

export default LoyaltyProgramDetailsCard;
