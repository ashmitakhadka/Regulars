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
import { loyaltyProgramSchema } from "../../../schema/loyaltyProgramSchema";

/* ---------- helpers ---------- */

const num = (v) =>
  v === "" || v === null || v === undefined ? null : Number(v);

const text = (v) => (v?.trim() ? v.trim() : null);

const EARNING_TYPES = [
  {
    value: "visit",
    label: "Per visit",
  },
  {
    value: "purchase",
    label: "Per spend",
  },
  {
    value: "quantity",
    label: "Per product",
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
const RewardFields = ({ field, rewardType, disabled }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Reward title"
        placeholder="e.g. Free latte"
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
        disabled={disabled}
        {...field("reward_value")}
      />

      <Input
        label="Valid for (days)"
        type="number"
        min="1"
        step="1"
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

  const [purchaseMode, setPurchaseMode] = useState(
    initialValues.tiers?.length ? "tiers" : "simple",
  );

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
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loyaltyProgramSchema),
    defaultValues: {
      name: initialValues.name || "",
      description: initialValues.description || "",
      earning_type: initialValues.earning_type || "visit",
      threshold: initialValues.threshold ?? 1,
      stamps_awarded: initialValues.stamps_awarded ?? 1,
      daily_stamp_limit: initialValues.daily_stamp_limit ?? "",
      reward_title: initialValues.reward_title || "",
      reward_description: initialValues.reward_description || "",
      reward_type: initialValues.reward_type || "free_item",
      reward_value: initialValues.reward_value ?? "",
      voucher_validity_days: initialValues.voucher_validity_days ?? 30,
    },
  });

  const earningType = watch("earning_type");
  const rewardType = watch("reward_type");

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
    return false;
  };

  const rewardPayload = (src) => ({
    reward_title: src.reward_title.trim(),
    reward_description: text(src.reward_description),
    reward_type: src.reward_type || "free_item",
    reward_value: num(src.reward_value),
    voucher_validity_days: Number(src.voucher_validity_days) || 30,
  });

  const validateThreshold = (d, label) => {
    if (!d.threshold || Number(d.threshold) <= 0)
      return fail(`Enter a ${label} greater than 0.`);

    if (!d.stamps_awarded || Number(d.stamps_awarded) < 1)
      return fail("Stamps awarded must be at least 1.");

    return true;
  };

  const submit = (d) => {
    setError("");

    const payload = {
      name: d.name.trim(),
      description: text(d.description),
      earning_type: d.earning_type,
      daily_stamp_limit: num(d.daily_stamp_limit),
    };

    if (d.earning_type !== "quantity") {
      if (!d.reward_title?.trim()) {
        return fail("Enter a reward title.");
      }

      Object.assign(payload, rewardPayload(d));
    }

    if (d.earning_type === "visit") {
      if (!validateThreshold(d, "visit count")) return;

      payload.threshold = Number(d.threshold);
      payload.stamps_awarded = Number(d.stamps_awarded);
    }

    if (d.earning_type === "purchase") {
      if (purchaseMode === "simple") {
        if (!validateThreshold(d, "minimum spend")) return;

        payload.threshold = Number(d.threshold);
        payload.stamps_awarded = Number(d.stamps_awarded);
      } else {
        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i];
          const n = `Tier ${i + 1}`;

          if (!t.min_amount || Number(t.min_amount) <= 0)
            return fail(`${n}: minimum spend must be greater than 0.`);

          if (
            t.max_amount !== "" &&
            t.max_amount !== null &&
            Number(t.max_amount) <= Number(t.min_amount)
          ) {
            return fail(
              `${n}: maximum spend must be greater than minimum spend.`,
            );
          }

          if (!t.stamps_awarded || Number(t.stamps_awarded) < 1)
            return fail(`${n}: stamps awarded must be at least 1.`);
        }

        payload.tiers = tiers.map((t) => ({
          min_amount: Number(t.min_amount),
          max_amount: num(t.max_amount),
          stamps_awarded: Number(t.stamps_awarded),
        }));
      }
    }

    if (d.earning_type === "quantity") {
      if (!products.length) {
        return fail(
          "Add a product to your catalog before creating a per-product program.",
        );
      }

      const seen = new Set();

      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        const n = `Rule ${i + 1}`;

        if (!r.product_id) return fail(`${n}: choose a product.`);

        if (seen.has(Number(r.product_id))) {
          return fail(`${n}: each product can only be used once.`);
        }

        seen.add(Number(r.product_id));

        if (!r.quantity_required || Number(r.quantity_required) < 1)
          return fail(`${n}: quantity must be at least 1.`);

        if (!r.reward_title?.trim()) return fail(`${n}: enter a reward title.`);

        if (!r.voucher_validity_days || Number(r.voucher_validity_days) < 1)
          return fail(`${n}: validity must be at least 1 day.`);
      }

      payload.product_rules = rules.map((r) => ({
        product_id: Number(r.product_id),
        quantity_required: Number(r.quantity_required),
        ...rewardPayload(r),
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
            value={earningType}
            onChange={(e) =>
              setValue("earning_type", e.target.value, {
                shouldDirty: true,
              })
            }
            disabled={isSubmitting}
          >
            {EARNING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>

          <p className="text-xs text-ink-soft">{activeType?.hint}</p>

          <input type="hidden" {...register("earning_type")} />
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
              value={purchaseMode}
              onChange={(e) => setPurchaseMode(e.target.value)}
              disabled={isSubmitting}
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

                  <RewardFields
                    rewardType={rule.reward_type}
                    disabled={isSubmitting}
                    field={(n) => ({
                      value: rule[n] ?? "",
                      onChange: (e) => updateRule(i, n, e.target.value),
                    })}
                  />
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

      {/* Reward */}

      {earningType !== "quantity" && (
        <Section title="Reward">
          <RewardFields
            field={register}
            rewardType={rewardType}
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
