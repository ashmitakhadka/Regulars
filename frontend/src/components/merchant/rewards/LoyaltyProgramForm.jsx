import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faGift,
  faTag,
  faCheck,
  faInfoCircle,
  faPlus,
  faTrash,
  faBox,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Spinner } from "../../ui";
import { productService } from "../../../services/productService";

// Validation schema for basic program fields
const programBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Loyalty program name is required.")
    .max(255, "Loyalty program name cannot exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional()
    .or(z.literal("")),
  earning_type: z.enum(["visit", "purchase", "quantity"]),
  daily_stamp_limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Daily stamp limit must be a number." })
      .int("Daily limit must be a whole number.")
      .min(1, "Daily limit must be at least 1.")
      .nullable()
      .optional(),
  ),

  // Threshold and stamps for visit or simple purchase
  threshold: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Threshold must be a number." })
      .positive("Threshold must be greater than 0.")
      .nullable()
      .optional(),
  ),
  stamps_awarded: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Stamps awarded must be a whole number." })
      .int("Stamps awarded must be an integer.")
      .min(1, "At least 1 stamp must be awarded.")
      .nullable()
      .optional(),
  ),

  // Shared reward for visit and purchase programs
  reward_title: z.string().optional(),
  reward_description: z.string().optional(),
  reward_type: z.string().optional(),
  reward_value: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Reward value must be a number." })
      .min(0, "Reward value cannot be negative.")
      .nullable()
      .optional(),
  ),
  voucher_validity_days: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 30 : val),
    z.coerce
      .number({ invalid_type_error: "Validity days must be a whole number." })
      .int("Validity days must be a whole number.")
      .min(1, "Voucher validity must be at least 1 day.")
      .optional(),
  ),
});

export const LoyaltyProgramForm = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  // Products available in merchant catalog
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Purchase Mode: 'simple' (threshold) vs 'tiers' (tier-based)
  const [purchaseMode, setPurchaseMode] = useState(
    initialValues.tiers && initialValues.tiers.length > 0 ? "tiers" : "simple",
  );

  // Purchase Tiers State
  const [tiers, setTiers] = useState(
    initialValues.tiers && initialValues.tiers.length > 0
      ? initialValues.tiers
      : [
          { min_amount: 1000, max_amount: 1999, stamps_awarded: 1 },
          { min_amount: 2000, max_amount: 2999, stamps_awarded: 2 },
          { min_amount: 3000, max_amount: "", stamps_awarded: 3 },
        ],
  );

  // Quantity Product Rules State
  const [productRules, setProductRules] = useState(
    initialValues.product_rules && initialValues.product_rules.length > 0
      ? initialValues.product_rules
      : [
          {
            product_id: "",
            quantity_required: 3,
            reward_title: "Complimentary Item",
            reward_description: "",
            reward_type: "free_item",
            reward_value: "",
            voucher_validity_days: 30,
          },
        ],
  );

  const [customError, setCustomError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(programBaseSchema),
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

  const selectedEarningType = watch("earning_type");
  const selectedRewardType = watch("reward_type");
  const watchedName = watch("name");
  const watchedRewardTitle = watch("reward_title");
  const watchedThreshold = watch("threshold");
  const watchedStamps = watch("stamps_awarded");

  // Load products when quantity earning type is selected or on mount
  useEffect(() => {
    let ignore = false;
    setLoadingProducts(true);

    productService
      .getProducts()
      .then((res) => {
        if (!ignore) {
          const activeOnly = (res.data || []).filter(
            (p) => p.status === "active",
          );
          setProducts(activeOnly);

          // If product rules has no product_id selected and active products exist, default first rule
          if (activeOnly.length > 0) {
            setProductRules((prev) => {
              if (prev.length > 0 && !prev[0].product_id) {
                return [
                  {
                    ...prev[0],
                    product_id: activeOnly[0].id,
                    reward_title: `Free ${activeOnly[0].name}`,
                  },
                ];
              }
              return prev;
            });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch products for loyalty form:", err);
      })
      .finally(() => {
        if (!ignore) setLoadingProducts(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // --- Tier Management Handlers ---
  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier && lastTier.max_amount ? Number(lastTier.max_amount) + 1 : 1000;
    const nextStamps = lastTier ? Number(lastTier.stamps_awarded) + 1 : 1;

    setTiers([
      ...tiers,
      { min_amount: nextMin, max_amount: "", stamps_awarded: nextStamps },
    ]);
  };

  const handleRemoveTier = (index) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, idx) => idx !== index));
  };

  const handleTierChange = (index, field, value) => {
    setTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // --- Product Rules Management Handlers ---
  const handleAddProductRule = () => {
    // Find first product not yet in rules
    const usedIds = new Set(productRules.map((r) => Number(r.product_id)));
    const nextProduct = products.find((p) => !usedIds.has(p.id)) || products[0];

    setProductRules([
      ...productRules,
      {
        product_id: nextProduct ? nextProduct.id : "",
        quantity_required: 3,
        reward_title: nextProduct ? `Free ${nextProduct.name}` : "Complimentary Reward",
        reward_description: "",
        reward_type: "free_item",
        reward_value: "",
        voucher_validity_days: 30,
      },
    ]);
  };

  const handleRemoveProductRule = (index) => {
    if (productRules.length <= 1) return;
    setProductRules(productRules.filter((_, idx) => idx !== index));
  };

  const handleProductRuleChange = (index, field, value) => {
    setProductRules((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      // If user selected a new product, automatically default the reward title if empty or default
      if (field === "product_id") {
        const prod = products.find((p) => p.id === Number(value));
        if (prod && (!current.reward_title || current.reward_title.startsWith("Free ") || current.reward_title === "Complimentary Item")) {
          current.reward_title = `Free ${prod.name}`;
        }
      }

      updated[index] = current;
      return updated;
    });
  };

  // --- Main Form Submission Handler ---
  const handleFormSubmit = (data) => {
    setCustomError("");

    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      earning_type: data.earning_type,
      daily_stamp_limit:
        data.daily_stamp_limit !== "" && data.daily_stamp_limit !== null
          ? Number(data.daily_stamp_limit)
          : null,
    };

    // 1. Visit Program Payload
    if (data.earning_type === "visit") {
      if (!data.threshold || Number(data.threshold) <= 0) {
        setCustomError("Please enter a valid visit threshold greater than 0.");
        return;
      }
      if (!data.stamps_awarded || Number(data.stamps_awarded) < 1) {
        setCustomError("Stamps awarded must be at least 1.");
        return;
      }
      if (!data.reward_title?.trim()) {
        setCustomError("Please provide a reward title for your visit program.");
        return;
      }

      payload.threshold = Number(data.threshold);
      payload.stamps_awarded = Number(data.stamps_awarded);
      payload.reward_title = data.reward_title.trim();
      payload.reward_description = data.reward_description
        ? data.reward_description.trim()
        : null;
      payload.reward_type = data.reward_type || "free_item";
      payload.reward_value =
        data.reward_value !== "" && data.reward_value !== null
          ? Number(data.reward_value)
          : null;
      payload.voucher_validity_days = Number(data.voucher_validity_days) || 30;
    }

    // 2. Purchase Program Payload
    else if (data.earning_type === "purchase") {
      if (!data.reward_title?.trim()) {
        setCustomError("Please provide a reward title for your purchase program.");
        return;
      }

      payload.reward_title = data.reward_title.trim();
      payload.reward_description = data.reward_description
        ? data.reward_description.trim()
        : null;
      payload.reward_type = data.reward_type || "free_item";
      payload.reward_value =
        data.reward_value !== "" && data.reward_value !== null
          ? Number(data.reward_value)
          : null;
      payload.voucher_validity_days = Number(data.voucher_validity_days) || 30;

      if (purchaseMode === "simple") {
        if (!data.threshold || Number(data.threshold) <= 0) {
          setCustomError("Please enter a minimum purchase amount threshold.");
          return;
        }
        if (!data.stamps_awarded || Number(data.stamps_awarded) < 1) {
          setCustomError("Stamps awarded must be at least 1.");
          return;
        }

        payload.threshold = Number(data.threshold);
        payload.stamps_awarded = Number(data.stamps_awarded);
      } else {
        // Tier-based validation
        if (!tiers || tiers.length === 0) {
          setCustomError("Please add at least one purchase tier.");
          return;
        }

        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i];
          if (!t.min_amount || Number(t.min_amount) <= 0) {
            setCustomError(`Tier #${i + 1}: Minimum amount must be greater than 0.`);
            return;
          }
          if (t.max_amount !== "" && t.max_amount !== null) {
            if (Number(t.max_amount) <= Number(t.min_amount)) {
              setCustomError(
                `Tier #${i + 1}: Maximum amount must be strictly greater than minimum amount.`,
              );
              return;
            }
          }
          if (!t.stamps_awarded || Number(t.stamps_awarded) < 1) {
            setCustomError(`Tier #${i + 1}: Stamps awarded must be at least 1.`);
            return;
          }
        }

        payload.tiers = tiers.map((t) => ({
          min_amount: Number(t.min_amount),
          max_amount:
            t.max_amount !== "" && t.max_amount !== null
              ? Number(t.max_amount)
              : null,
          stamps_awarded: Number(t.stamps_awarded),
        }));
      }
    }

    // 3. Quantity Program Payload
    else if (data.earning_type === "quantity") {
      if (products.length === 0) {
        setCustomError(
          "You must have at least one product in your catalog to create a quantity-based program.",
        );
        return;
      }

      if (!productRules || productRules.length === 0) {
        setCustomError("Please add at least one product rule.");
        return;
      }

      const productIdsSeen = new Set();

      for (let i = 0; i < productRules.length; i++) {
        const rule = productRules[i];
        if (!rule.product_id) {
          setCustomError(`Product rule #${i + 1}: Please select a product.`);
          return;
        }
        if (productIdsSeen.has(Number(rule.product_id))) {
          setCustomError(
            `Product rule #${i + 1}: A product cannot be added more than once. Please remove duplicates.`,
          );
          return;
        }
        productIdsSeen.add(Number(rule.product_id));

        if (!rule.quantity_required || Number(rule.quantity_required) < 1) {
          setCustomError(
            `Product rule #${i + 1}: Required quantity must be at least 1.`,
          );
          return;
        }
        if (!rule.reward_title?.trim()) {
          setCustomError(
            `Product rule #${i + 1}: Please specify a reward title.`,
          );
          return;
        }
        if (!rule.voucher_validity_days || Number(rule.voucher_validity_days) < 1) {
          setCustomError(
            `Product rule #${i + 1}: Voucher validity must be at least 1 day.`,
          );
          return;
        }
      }

      payload.product_rules = productRules.map((rule) => ({
        product_id: Number(rule.product_id),
        quantity_required: Number(rule.quantity_required),
        reward_title: rule.reward_title.trim(),
        reward_description: rule.reward_description
          ? rule.reward_description.trim()
          : null,
        reward_type: rule.reward_type || "free_item",
        reward_value:
          rule.reward_value !== "" && rule.reward_value !== null
            ? Number(rule.reward_value)
            : null,
        voucher_validity_days: Number(rule.voucher_validity_days) || 30,
      }));
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" noValidate>
      {/* Custom Error Banner */}
      {customError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13.5px] text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600" />
            <span>Please resolve the following:</span>
          </div>
          <p className="mt-1 text-red-700">{customError}</p>
        </div>
      )}

      {/* SECTION 1: Basic Information */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#F4F0EA] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faTag} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-[#23140C]">
              1. Basic Information
            </h2>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#23140C]/80">
              Name your loyalty program and give customers a clear idea of what it offers.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {/* Program Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
            >
              Loyalty Program Name <span className="text-[#A51D27]">*</span>
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Coffee Lovers Club, VIP Dining Rewards"
              {...register("name")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                errors.name
                  ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                  : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
            >
              Description{" "}
              <span className="text-[13px] font-normal text-[#23140C]/60">
                (Optional)
              </span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe how customers participate and why they should join..."
              {...register("description")}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
            />
          </div>

          {/* Optional Daily Stamp Limit */}
          <div>
            <label
              htmlFor="daily_stamp_limit"
              className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
            >
              Daily Stamp Limit{" "}
              <span className="text-[13px] font-normal text-[#23140C]/60">
                (Optional)
              </span>
            </label>
            <input
              id="daily_stamp_limit"
              type="number"
              min="1"
              step="1"
              placeholder="Leave blank for no daily limit"
              {...register("daily_stamp_limit")}
              disabled={isSubmitting}
              className="w-full max-w-sm rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
            />
            <p className="mt-1 text-[13px] text-[#23140C]/75">
              Maximum stamps any single customer can earn per day across this program.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Earning Rules & Configuration */}
      <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
        <div className="flex items-center gap-3 border-b border-[#F4F0EA] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
            <FontAwesomeIcon icon={faStar} className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-[17px] font-bold text-[#23140C]">
              2. Earning Rules
            </h2>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#23140C]/80">
              Choose how customers earn stamps: by visit, by spend amount, or by purchasing specific products.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-6">
          {/* Earning Type Selection Cards */}
          <div>
            <label className="mb-2 block text-[14.5px] font-semibold text-[#23140C]">
              Earning Type <span className="text-[#A51D27]">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  value: "visit",
                  label: "Per Visit",
                  hint: "Award stamps each time the customer visits your counter",
                },
                {
                  value: "purchase",
                  label: "Purchase Amount",
                  hint: "Award stamps based on minimum spend or tiered brackets",
                },
                {
                  value: "quantity",
                  label: "Product Quantity",
                  hint: "Award rewards by tracking purchases of specific catalog items",
                },
              ].map((opt) => {
                const isSelected = selectedEarningType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-[#A51D27] bg-[#A51D27]/10 shadow-xs"
                        : "border-[#F4F0EA] bg-white hover:border-[#A51D27]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[#23140C]">
                        {opt.label}
                      </span>
                      <input
                        type="radio"
                        value={opt.value}
                        {...register("earning_type")}
                        className="h-4 w-4 text-[#A51D27] focus:ring-[#A51D27]"
                      />
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#23140C]/75">
                      {opt.hint}
                    </p>
                  </label>
                );
              })}
            </div>
          </div>

          {/* EARNING TYPE CONFIGURATION: VISIT */}
          {selectedEarningType === "visit" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-[#F4F0EA]/50 p-5">
              <div>
                <label
                  htmlFor="visit-threshold"
                  className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                >
                  Visits Required <span className="text-[#A51D27]">*</span>
                </label>
                <input
                  id="visit-threshold"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 1"
                  {...register("threshold")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                />
                <p className="mt-1 text-[13px] text-[#23140C]/75">
                  Qualifying visits per stamp cycle (usually 1).
                </p>
              </div>

              <div>
                <label
                  htmlFor="visit-stamps"
                  className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                >
                  Stamps Awarded Per Visit <span className="text-[#A51D27]">*</span>
                </label>
                <input
                  id="visit-stamps"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 1"
                  {...register("stamps_awarded")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                />
                <p className="mt-1 text-[13px] text-[#23140C]/75">
                  Number of stamps recorded when the merchant logs a qualifying visit.
                </p>
              </div>
            </div>
          )}

          {/* EARNING TYPE CONFIGURATION: PURCHASE */}
          {selectedEarningType === "purchase" && (
            <div className="space-y-5 rounded-xl bg-[#F4F0EA]/50 p-5">
              {/* Mode Toggle: Simple vs Tiers */}
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-semibold text-[#23140C]">
                  Calculation Method:
                </span>
                <div className="flex rounded-lg border border-[#F4F0EA] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("simple")}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition cursor-pointer ${
                      purchaseMode === "simple"
                        ? "bg-[#A51D27] text-white"
                        : "text-[#23140C]/75 hover:text-[#23140C]"
                    }`}
                  >
                    Simple Threshold
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurchaseMode("tiers")}
                    className={`rounded-md px-3 py-1.5 text-[13px] font-semibold transition cursor-pointer ${
                      purchaseMode === "tiers"
                        ? "bg-[#A51D27] text-white"
                        : "text-[#23140C]/75 hover:text-[#23140C]"
                    }`}
                  >
                    Tier-Based Brackets
                  </button>
                </div>
              </div>

              {/* Simple Purchase Threshold */}
              {purchaseMode === "simple" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="purchase-threshold"
                      className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                    >
                      Minimum Spend Amount (NPR) <span className="text-[#A51D27]">*</span>
                    </label>
                    <input
                      id="purchase-threshold"
                      type="number"
                      step="any"
                      min="1"
                      placeholder="e.g. 1000"
                      {...register("threshold")}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                    />
                    <p className="mt-1 text-[13px] text-[#23140C]/75">
                      Minimum bill amount customer must spend to earn stamps.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="purchase-stamps"
                      className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                    >
                      Stamps Awarded <span className="text-[#A51D27]">*</span>
                    </label>
                    <input
                      id="purchase-stamps"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="e.g. 1"
                      {...register("stamps_awarded")}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                    />
                    <p className="mt-1 text-[13px] text-[#23140C]/75">
                      Stamps given once the minimum spend is met.
                    </p>
                  </div>
                </div>
              ) : (
                /* Tier-based purchase configuration */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-bold text-[#23140C]">
                        Purchase Amount Tiers
                      </h4>
                      <p className="text-[13px] text-[#23140C]/75">
                        Award more stamps for higher spend brackets (e.g. NPR 1,000–1,999: 1 stamp, NPR 5,000+: 5 stamps).
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddTier}
                    >
                      <FontAwesomeIcon icon={faPlus} />
                      <span>Add Tier</span>
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {tiers.map((tier, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-3 rounded-xl border border-[#F4F0EA] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-[13px] font-bold text-[#A51D27] w-16">
                          Tier #{idx + 1}
                        </span>

                        <div className="flex-1 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                          <div>
                            <span className="block text-[12px] font-semibold text-[#23140C]/70 mb-1">
                              Min Spend (NPR) *
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={tier.min_amount}
                              onChange={(e) =>
                                handleTierChange(idx, "min_amount", e.target.value)
                              }
                              placeholder="1000"
                              className="w-full rounded-lg border border-[#F4F0EA] px-3 py-1.5 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="block text-[12px] font-semibold text-[#23140C]/70 mb-1">
                              Max Spend (Optional)
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={tier.max_amount}
                              onChange={(e) =>
                                handleTierChange(idx, "max_amount", e.target.value)
                              }
                              placeholder="Leave blank for +"
                              className="w-full rounded-lg border border-[#F4F0EA] px-3 py-1.5 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="block text-[12px] font-semibold text-[#23140C]/70 mb-1">
                              Stamps Awarded *
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={tier.stamps_awarded}
                              onChange={(e) =>
                                handleTierChange(idx, "stamps_awarded", e.target.value)
                              }
                              placeholder="1"
                              className="w-full rounded-lg border border-[#F4F0EA] px-3 py-1.5 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>
                        </div>

                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="text-[#23140C]/50 hover:text-red-700 transition p-2 cursor-pointer"
                            title="Remove tier"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EARNING TYPE CONFIGURATION: QUANTITY */}
          {selectedEarningType === "quantity" && (
            <div className="space-y-4 rounded-xl bg-[#F4F0EA]/50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-[15px] font-bold text-[#23140C]">
                    Product Rules & Rewards
                  </h4>
                  <p className="text-[13px] text-[#23140C]/75">
                    Select products from your catalog and specify the quantity required to unlock each reward.
                  </p>
                </div>

                {products.length > 0 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddProductRule}
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Add Product Rule</span>
                  </Button>
                )}
              </div>

              {/* Notice if no products exist in catalog */}
              {loadingProducts ? (
                <div className="flex items-center gap-2 py-4 text-[13.5px] text-[#23140C]/75">
                  <Spinner size="sm" />
                  <span>Loading products from catalog...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-[13.5px] text-amber-900">
                  <p className="font-bold">No active products found in your catalog</p>
                  <p className="mt-1 text-[13px] text-amber-800">
                    Quantity-based loyalty programs require items from your product catalog.
                  </p>
                  <div className="mt-3">
                    <Link
                      to="/merchant/products"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#A51D27] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#8E1821] transition"
                    >
                      <FontAwesomeIcon icon={faBox} />
                      <span>Go to Product Catalog</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* List of product rules */
                <div className="space-y-4">
                  {productRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#F4F0EA] bg-white p-4 space-y-3.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-2">
                        <span className="text-[13.5px] font-bold text-[#A51D27]">
                          Rule #{idx + 1}
                        </span>

                        {productRules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProductRule(idx)}
                            className="text-[#23140C]/40 hover:text-red-700 transition text-[13px] cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-1" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {/* Select Product */}
                        <div>
                          <label className="mb-1 block text-[13px] font-semibold text-[#23140C]">
                            Select Catalog Product <span className="text-[#A51D27]">*</span>
                          </label>
                          <select
                            value={rule.product_id}
                            onChange={(e) =>
                              handleProductRuleChange(idx, "product_id", e.target.value)
                            }
                            className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-2 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (NPR {Number(p.price).toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity Required */}
                        <div>
                          <label className="mb-1 block text-[13px] font-semibold text-[#23140C]">
                            Quantity Required <span className="text-[#A51D27]">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={rule.quantity_required}
                            onChange={(e) =>
                              handleProductRuleChange(
                                idx,
                                "quantity_required",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. 3"
                            className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-2 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Individual Reward for this product rule */}
                      <div className="rounded-lg bg-[#F4F0EA]/60 p-3.5 space-y-3">
                        <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#23140C]">
                          <FontAwesomeIcon icon={faGift} className="text-[#A51D27]" />
                          <span>Reward for Completing Quantity</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {/* Reward Title */}
                          <div className="sm:col-span-2">
                            <label className="mb-1 block text-[12px] font-semibold text-[#23140C]">
                              Reward Title <span className="text-[#A51D27]">*</span>
                            </label>
                            <input
                              type="text"
                              value={rule.reward_title}
                              onChange={(e) =>
                                handleProductRuleChange(
                                  idx,
                                  "reward_title",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. Free Hot Beverage"
                              className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-1.5 text-[13px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>

                          {/* Validity Days */}
                          <div>
                            <label className="mb-1 block text-[12px] font-semibold text-[#23140C]">
                              Voucher Validity (Days) *
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={rule.voucher_validity_days}
                              onChange={(e) =>
                                handleProductRuleChange(
                                  idx,
                                  "voucher_validity_days",
                                  e.target.value,
                                )
                              }
                              placeholder="30"
                              className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-1.5 text-[13px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Reward Type */}
                          <div>
                            <label className="mb-1 block text-[12px] font-semibold text-[#23140C]">
                              Reward Type *
                            </label>
                            <select
                              value={rule.reward_type}
                              onChange={(e) =>
                                handleProductRuleChange(
                                  idx,
                                  "reward_type",
                                  e.target.value,
                                )
                              }
                              className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-1.5 text-[13px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            >
                              <option value="free_item">Free Item / Product</option>
                              <option value="discount_percentage">Percentage Discount (%)</option>
                              <option value="discount_fixed">Fixed Amount Discount ($)</option>
                              <option value="custom">Custom Perk</option>
                            </select>
                          </div>

                          {/* Reward Description */}
                          <div>
                            <label className="mb-1 block text-[12px] font-semibold text-[#23140C]">
                              Reward Notes (Optional)
                            </label>
                            <input
                              type="text"
                              value={rule.reward_description || ""}
                              onChange={(e) =>
                                handleProductRuleChange(
                                  idx,
                                  "reward_description",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g. Valid on dine-in only"
                              className="w-full rounded-lg border border-[#F4F0EA] bg-white px-3 py-1.5 text-[13px] text-[#23140C] focus:border-[#A51D27] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: Shared Reward Information (Visit and Purchase Programs ONLY) */}
      {selectedEarningType !== "quantity" && (
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
          <div className="flex items-center gap-3 border-b border-[#F4F0EA] pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faGift} className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-[17px] font-bold text-[#23140C]">
                3. Reward Information
              </h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-[#23140C]/80">
                Specify what customers receive when their stamp card is completed.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {/* Reward Title */}
            <div>
              <label
                htmlFor="reward_title"
                className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
              >
                Reward Title <span className="text-[#A51D27]">*</span>
              </label>
              <input
                id="reward_title"
                type="text"
                placeholder="e.g. Free Specialty Latte, 20% Off Next Bill"
                {...register("reward_title")}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
              />
            </div>

            {/* Reward Description */}
            <div>
              <label
                htmlFor="reward_description"
                className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
              >
                Reward Description{" "}
                <span className="text-[13px] font-normal text-[#23140C]/60">
                  (Optional)
                </span>
              </label>
              <textarea
                id="reward_description"
                rows={2}
                placeholder="e.g. Valid on any hot or iced drink. Cannot be combined with other offers."
                {...register("reward_description")}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
              />
            </div>

            {/* Reward Type, Value & Validity Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="reward_type"
                  className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
                >
                  Reward Type <span className="text-[#A51D27]">*</span>
                </label>
                <select
                  id="reward_type"
                  {...register("reward_type")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
                >
                  <option value="free_item">Free Item / Product</option>
                  <option value="discount_percentage">Percentage Discount (%)</option>
                  <option value="discount_fixed">Fixed Amount Discount ($)</option>
                  <option value="custom">Custom Perk / Experience</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="reward_value"
                  className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
                >
                  Reward Value{" "}
                  <span className="text-[13px] font-normal text-[#23140C]/60">
                    {selectedRewardType === "discount_percentage"
                      ? "(e.g. 15 for 15%)"
                      : "(Optional)"}
                  </span>
                </label>
                <input
                  id="reward_value"
                  type="number"
                  step="any"
                  min="0"
                  placeholder={
                    selectedRewardType === "discount_percentage" ? "20" : "0"
                  }
                  {...register("reward_value")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
                />
              </div>

              <div>
                <label
                  htmlFor="voucher_validity_days"
                  className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
                >
                  Voucher Validity <span className="text-[#A51D27]">*</span>
                </label>
                <input
                  id="voucher_validity_days"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="30"
                  {...register("voucher_validity_days")}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Program Summary Preview */}
      <div className="rounded-2xl border border-[#F4F0EA] bg-[#F4F0EA]/60 p-5">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon
            icon={faInfoCircle}
            className="mt-0.5 text-base text-[#A51D27]"
          />
          <div>
            <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#23140C]">
              Configuration Summary
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#23140C]/85">
              Program <strong>{watchedName || "Untitled Loyalty Program"}</strong>{" "}
              {selectedEarningType === "visit" ? (
                <>
                  awards <strong>{watchedStamps || 1} stamp(s)</strong> per{" "}
                  <strong>{watchedThreshold || 1} qualifying visit(s)</strong>.
                  Customer receives <strong>{watchedRewardTitle || "reward voucher"}</strong> upon completion.
                </>
              ) : selectedEarningType === "purchase" ? (
                purchaseMode === "simple" ? (
                  <>
                    awards <strong>{watchedStamps || 1} stamp(s)</strong> when customer spends a minimum of{" "}
                    <strong>NPR {watchedThreshold || 1000}</strong>.
                    Customer unlocks <strong>{watchedRewardTitle || "reward voucher"}</strong>.
                  </>
                ) : (
                  <>
                    awards stamps based on <strong>{tiers.length} spend brackets</strong> (from NPR{" "}
                    {tiers[0]?.min_amount || 1000}). Customer unlocks{" "}
                    <strong>{watchedRewardTitle || "reward voucher"}</strong>.
                  </>
                )
              ) : (
                <>
                  tracks purchases for{" "}
                  <strong>{productRules.length} product(s)</strong>. Each product independently generates vouchers when its required quantity is met.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-5">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
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
          <FontAwesomeIcon icon={faCheck} />
          <span>
            {isSubmitting
              ? "Saving Loyalty Program..."
              : "Save & Create Loyalty Program"}
          </span>
        </Button>
      </div>
    </form>
  );
};

export default LoyaltyProgramForm;
