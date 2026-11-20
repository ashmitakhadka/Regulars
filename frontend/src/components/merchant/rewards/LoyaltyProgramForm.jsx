import { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPlus,
  faTrash,
  faBox,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { Button, Input, Spinner, EmptyState } from "../../ui";
import { productService } from "../../../services/productService";
import {
  getLoyaltyProgramSchema,
  tiersSchema,
  getProductRulesSchema,
  formatSchemaError,
} from "../../../schema/loyaltyProgramFormSchema";

/* ---------- helpers ---------- */

const text = (v) => (v?.trim() ? v.trim() : null);

const EARNING_TYPES = [
  {
    value: "visit",
    label: "Per visit",
    hint: "Customers earn stamps each time they visit.",
  },
  {
    value: "purchase",
    label: "Per spend",
    hint: "Customers earn stamps based on how much they spend.",
  },
  {
    value: "quantity",
    label: "Per product",
    hint: "Customers earn rewards for buying specific products.",
  },
];

const REWARD_TYPES = [
  { value: "free_item", label: "Free item" },
  { value: "discount_percentage", label: "Percentage discount" },
  { value: "discount_fixed", label: "Fixed discount (NPR)" },
  { value: "custom", label: "Custom perk" },
];

const newTier = (min = 1000, stamps = 1) => ({
  min_amount: min,
  max_amount: "",
  stamps_awarded: stamps,
});

const newRule = (product) => ({
  product_id: product?.id ?? "",
  quantity_required: 3,
  reward_title: product ? `Free ${product.name}` : "",
  reward_description: "",
  reward_type: "free_item",
  reward_value: "",
  voucher_validity_days: 30,
});

/* ---------- small building blocks ---------- */

const Select = forwardRef(
  (
    {
      label,
      className = "",
      children,
      disabled = false,
      required = false,
      ...props
    },
    ref,
  ) => (
    <div className={`w-full text-left ${className}`}>
      {label && (
        <label className="mb-1.5 block text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-1 text-brand-800">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          required={required}
          {...props}
          className="w-full min-h-[44px] appearance-none rounded-lg border border-blush-200 bg-white px-3.5 py-2 pr-9 text-sm text-ink transition focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/20 disabled:cursor-not-allowed disabled:bg-blush-50 disabled:opacity-60"
        >
          {children}
        </select>

        <FontAwesomeIcon
          icon={faChevronDown}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft text-[10px]"
        />
      </div>
    </div>
  ),
);

Select.displayName = "Select";

const Section = ({ title, description, children }) => (
  <section className="space-y-3">
    <div className="space-y-0.5">
      <h2 className="font-display text-base font-bold text-brand-900">
        {title}
      </h2>

      {description && <p className="text-xs text-ink-soft">{description}</p>}
    </div>

    <div className="space-y-3">{children}</div>
  </section>
);

/** Reward inputs shared by every earning type. */
const RewardFields = ({ field, rewardType, disabled, errors = {} }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Reward title"
        placeholder="e.g. Free latte"
        error={errors.reward_title?.message}
        disabled={disabled}
        {...field("reward_title")}
      />

      <Input
        label="Notes (optional)"
        placeholder="e.g. Dine-in only"
        disabled={disabled}
        {...field("reward_description")}
      />
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Select label="Type" disabled={disabled} {...field("reward_type")}>
        {REWARD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>

      <Input
        label={
          rewardType === "discount_percentage"
            ? "Value (%)"
            : "Value (optional)"
        }
        type="number"
        min="0"
        step="any"
        error={errors.reward_value?.message}
        disabled={disabled}
        {...field("reward_value")}
      />

      <Input
        label="Valid for (days)"
        type="number"
        min="1"
        step="1"
        error={errors.voucher_validity_days?.message}
        disabled={disabled}
        {...field("voucher_validity_days")}
      />
    </div>
  </div>
);

const RowHeader = ({ title, onRemove }) => (
  <div className="flex items-center justify-between pb-1">
    <span className="text-sm font-semibold text-ink">{title}</span>

    {onRemove && (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label={`Remove ${title}`}
        onClick={onRemove}
      >
        <FontAwesomeIcon icon={faTrash} />
      </Button>
    )}
  </div>
);

/* ---------- form ---------- */

export const LoyaltyProgramForm = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState("");

  const [tiers, setTiers] = useState(
    initialValues.tiers?.length
      ? initialValues.tiers
      : [newTier(1000, 1), newTier(2000, 2), newTier(3000, 3)],
  );

  const [rules, setRules] = useState(
    initialValues.product_rules?.length
      ? initialValues.product_rules
      : [newRule()],
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    // Validate with the schema for the selected earning type.
    resolver: (values, context, options) =>
      zodResolver(getLoyaltyProgramSchema(values.earning_type))(
        values,
        context,
        options,
      ),
    defaultValues: {
      name: initialValues.name || "",
      description: initialValues.description || "",
      earning_type: initialValues.earning_type || "visit",
      purchase_mode: initialValues.tiers?.length ? "tiers" : "simple",
      threshold: initialValues.threshold ?? 1,
      stamps_awarded: initialValues.stamps_awarded ?? 1,
      daily_stamp_limit: initialValues.daily_stamp_limit ?? "",
      stamps_required:
        initialValues.stamps_required ??
        initialValues.reward?.stamps_required ??
        10,
      // Vouchers are opt-in: unticked unless the program already issues them.
      issues_voucher:
        initialValues.issues_voucher ??
        initialValues.versions?.[0]?.issues_voucher ??
        false,
      reward_title: initialValues.reward_title || "",
      reward_description: initialValues.reward_description || "",
      reward_type: initialValues.reward_type || "free_item",
      reward_value: initialValues.reward_value ?? "",
      voucher_validity_days: initialValues.voucher_validity_days ?? 30,
    },
  });

  const earningType = watch("earning_type");
  const purchaseMode = watch("purchase_mode");
  const rewardType = watch("reward_type");
  const issuesVoucher = Boolean(watch("issues_voucher"));

  useEffect(() => {
    let ignore = false;

    setLoadingProducts(true);

    productService
      .getProducts()
      .then((res) => {
        if (ignore) return;

        const active = (res.data || []).filter((p) => p.status === "active");

        setProducts(active);

        if (active.length) {
          setRules((prev) =>
            prev.length && !prev[0].product_id
              ? [{ ...prev[0], ...newRule(active[0]) }, ...prev.slice(1)]
              : prev,
          );
        }
      })
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => !ignore && setLoadingProducts(false));

    return () => {
      ignore = true;
    };
  }, []);

  /* tiers */

  const addTier = () => {
    const last = tiers[tiers.length - 1];

    setTiers([
      ...tiers,
      newTier(
        last?.max_amount ? Number(last.max_amount) + 1 : 1000,
        last ? Number(last.stamps_awarded) + 1 : 1,
      ),
    ]);
  };

  const updateTier = (i, key, value) =>
    setTiers((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)),
    );

  const removeTier = (i) =>
    tiers.length > 1 && setTiers(tiers.filter((_, idx) => idx !== i));

  /* product rules */

  const addRule = () => {
    const used = new Set(rules.map((r) => Number(r.product_id)));

    setRules([
      ...rules,
      newRule(products.find((p) => !used.has(p.id)) || products[0]),
    ]);
  };

  const updateRule = (i, key, value) =>
    setRules((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;

        const next = { ...r, [key]: value };

        if (key === "product_id") {
          const prod = products.find((p) => p.id === Number(value));

          const isDefault =
            !r.reward_title || r.reward_title.startsWith("Free ");

          if (prod && isDefault) {
            next.reward_title = `Free ${prod.name}`;
          }
        }

        return next;
      }),
    );

  const removeRule = (i) =>
    rules.length > 1 && setRules(rules.filter((_, idx) => idx !== i));

  /* submit */

  const fail = (msg) => {
    setError(msg);
  };

  // `src` is already validated and coerced by the schema.
  const rewardPayload = (src) => ({
    reward_title: src.reward_title.trim(),
    reward_description: text(src.reward_description),
    reward_type: src.reward_type || "free_item",
    reward_value: src.reward_value ?? null,
    voucher_validity_days: src.voucher_validity_days,
  });

  // Runs only after the program schema has passed, so `d` holds clean values.
  const submit = (d) => {
    setError("");

    const payload = {
      name: d.name,
      description: text(d.description),
      earning_type: d.earning_type,
      daily_stamp_limit: d.daily_stamp_limit ?? null,
      issues_voucher: d.issues_voucher,
    };

    // Visit and purchase programs share one reward. It is only sent when
    // vouchers are on; the backend fills in defaults otherwise.
    if (d.earning_type !== "quantity" && d.issues_voucher) {
      Object.assign(payload, rewardPayload(d));
    }

    if (d.earning_type === "visit") {
      payload.threshold = d.threshold;
      payload.stamps_awarded = d.stamps_awarded;
    }

    if (d.earning_type === "purchase") {
      payload.stamps_required = d.stamps_required;

      if (d.purchase_mode === "simple") {
        payload.threshold = d.threshold;
        payload.stamps_awarded = d.stamps_awarded;
      } else {
        const parsed = tiersSchema.safeParse(tiers);
        if (!parsed.success)
          return fail(formatSchemaError(parsed.error, "Tier"));

        payload.tiers = parsed.data.map((t) => ({
          min_amount: t.min_amount,
          max_amount: t.max_amount ?? null,
          stamps_awarded: t.stamps_awarded,
        }));
      }
    }

    if (d.earning_type === "quantity") {
      if (!products.length) {
        return fail(
          "Add a product to your catalog before creating a per-product program.",
        );
      }

      const parsed = getProductRulesSchema(d.issues_voucher).safeParse(rules);
      if (!parsed.success) return fail(formatSchemaError(parsed.error, "Rule"));

      payload.product_rules = parsed.data.map((r) => ({
        product_id: r.product_id,
        quantity_required: r.quantity_required,
        ...(d.issues_voucher ? rewardPayload(r) : {}),
      }));
    }

    onSubmit(payload);
  };

  const activeType = EARNING_TYPES.find((t) => t.value === earningType);

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="w-full space-y-5"
      noValidate
    >
      {/* Basics */}

      <Section title="Basics">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Program name"
            className="sm:col-span-2"
            placeholder="e.g. Coffee Lovers Club"
            error={errors.name?.message}
            disabled={isSubmitting}
            {...register("name")}
          />

          <Input
            label="Daily stamp limit (optional)"
            type="number"
            min="1"
            step="1"
            placeholder="No limit"
            error={errors.daily_stamp_limit?.message}
            disabled={isSubmitting}
            {...register("daily_stamp_limit")}
          />
        </div>

        <Input
          label="Description (optional)"
          placeholder="What customers get for joining"
          error={errors.description?.message}
          disabled={isSubmitting}
          {...register("description")}
        />
      </Section>

      {/* Earning */}

      <Section title="How customers earn stamps">
        <div className="space-y-1">
          <Select
            label="Earning type"
            disabled={isSubmitting}
            {...register("earning_type")}
          >
            {EARNING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <p className="text-xs text-ink-soft">{activeType?.hint}</p>
        </div>

        {earningType === "visit" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Visits required"
              type="number"
              min="1"
              step="1"
              error={errors.threshold?.message}
              disabled={isSubmitting}
              {...register("threshold")}
            />

            <Input
              label="Stamps per qualifying visit"
              type="number"
              min="1"
              step="1"
              error={errors.stamps_awarded?.message}
              disabled={isSubmitting}
              {...register("stamps_awarded")}
            />
          </div>
        )}

        {earningType === "purchase" && (
          <div className="space-y-3">
            <Select
              label="Calculation"
              disabled={isSubmitting}
              {...register("purchase_mode")}
            >
              <option value="simple">Minimum spend</option>
              <option value="tiers">Spend tiers</option>
            </Select>

            {purchaseMode === "simple" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Minimum spend (NPR)"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="1000"
                  error={errors.threshold?.message}
                  disabled={isSubmitting}
                  {...register("threshold")}
                />

                <Input
                  label="Stamps awarded"
                  type="number"
                  min="1"
                  step="1"
                  error={errors.stamps_awarded?.message}
                  disabled={isSubmitting}
                  {...register("stamps_awarded")}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier, i) => (
                  <div
                    key={i}
                    className="space-y-3 rounded-lg bg-[#F4F0EA]/40 p-3"
                  >
                    <RowHeader
                      title={`Tier ${i + 1}`}
                      onRemove={
                        tiers.length > 1 ? () => removeTier(i) : undefined
                      }
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        label="From (NPR)"
                        type="number"
                        min="1"
                        step="any"
                        value={tier.min_amount}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateTier(i, "min_amount", e.target.value)
                        }
                      />

                      <Input
                        label="To (optional)"
                        type="number"
                        min="1"
                        step="any"
                        placeholder="No upper limit"
                        value={tier.max_amount}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateTier(i, "max_amount", e.target.value)
                        }
                      />

                      <Input
                        label="Stamps"
                        type="number"
                        min="1"
                        step="1"
                        value={tier.stamps_awarded}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateTier(i, "stamps_awarded", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addTier}
                  disabled={isSubmitting}
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add tier</span>
                </Button>
              </div>
            )}

            <div className="pt-2 border-t border-blush-100">
              <Input
                label="Stamps required to earn reward"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 10"
                error={errors.stamps_required?.message}
                disabled={isSubmitting}
                {...register("stamps_required")}
              />
              <p className="mt-1 text-xs text-ink-soft">
                Total stamps a customer must accumulate across qualifying
                purchases to complete this reward.
              </p>
            </div>
          </div>
        )}

        {earningType === "quantity" &&
          (loadingProducts ? (
            <div className="flex items-center gap-2 py-2 text-sm text-ink-soft">
              <Spinner size="sm" />
              <span>Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={faBox}
              title="No active products"
              description="Per-product programs use items from your catalog."
              action={
                <Link to="/merchant/products">
                  <Button type="button" variant="secondary" size="sm">
                    Go to products
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded-lg bg-[#F4F0EA]/40 p-3"
                >
                  <RowHeader
                    title={`Rule ${i + 1}`}
                    onRemove={
                      rules.length > 1 ? () => removeRule(i) : undefined
                    }
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      label="Product"
                      className="sm:col-span-2"
                      value={rule.product_id}
                      onChange={(e) =>
                        updateRule(i, "product_id", e.target.value)
                      }
                      disabled={isSubmitting}
                    >
                      <option value="">Choose a product</option>

                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (NPR {Number(p.price).toFixed(2)})
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={rule.quantity_required}
                      disabled={isSubmitting}
                      onChange={(e) =>
                        updateRule(i, "quantity_required", e.target.value)
                      }
                    />
                  </div>

                  {/* Per-product reward details only matter when vouchers are on */}
                  {issuesVoucher && (
                    <RewardFields
                      rewardType={rule.reward_type}
                      disabled={isSubmitting}
                      field={(n) => ({
                        value: rule[n] ?? "",
                        onChange: (e) => updateRule(i, n, e.target.value),
                      })}
                    />
                  )}
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={addRule}
                disabled={isSubmitting || products.length <= rules.length}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add product rule</span>
              </Button>
            </div>
          ))}
      </Section>

      {/* Voucher Issuance (before Reward, since it controls whether Reward shows) */}

      <Section
        title="Voucher issuance"
        description="Control whether completed rewards automatically create digital vouchers."
      >
        <label className="flex items-start gap-3 rounded-xl border border-blush-200 bg-white p-4 cursor-pointer hover:border-brand-800/40 transition">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-blush-200 text-brand-800 focus:ring-brand-800"
            disabled={isSubmitting}
            {...register("issues_voucher")}
          />
          <div>
            <span className="text-sm font-bold text-ink">
              Automatically issue vouchers
            </span>
            <p className="mt-0.5 text-xs text-ink-soft leading-relaxed">
              When customers complete a reward, automatically generate a voucher
              they can redeem. When disabled, customers can still complete the
              loyalty requirement, but no voucher is generated.
            </p>
          </div>
        </label>
      </Section>

      {/* Reward (visit and purchase only, and only when vouchers are on) */}

      {earningType !== "quantity" && issuesVoucher && (
        <Section title="Reward">
          <RewardFields
            field={register}
            rewardType={rewardType}
            errors={errors}
            disabled={isSubmitting}
          />
        </Section>
      )}

      {/* Error */}

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Actions */}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="soft"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Create
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
    </form>
  );
};

export default LoyaltyProgramForm;
