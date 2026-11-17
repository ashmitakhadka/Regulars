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
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../ui";

// Validation Schema matching Laravel backend rules exactly
const loyaltyProgramSchema = z.object({
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

  earning_type: z.enum(["visit", "purchase", "quantity"], {
    errorMap: () => ({ message: "Please select an earning type." }),
  }),
  threshold: z.coerce
    .number({ invalid_type_error: "Threshold must be a valid number." })
    .positive("Threshold must be greater than 0."),
  stamps_awarded: z.coerce
    .number({ invalid_type_error: "Stamps awarded must be a whole number." })
    .int("Stamps awarded must be an integer.")
    .min(1, "At least 1 stamp must be awarded."),
  daily_stamp_limit: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Daily stamp limit must be a number." })
      .int("Daily limit must be a whole number.")
      .min(1, "Daily limit must be at least 1.")
      .nullable()
      .optional(),
  ),

  reward_title: z
    .string()
    .trim()
    .min(1, "Reward title is required.")
    .max(255, "Reward title cannot exceed 255 characters."),
  reward_description: z
    .string()
    .trim()
    .max(1000, "Reward description cannot exceed 1000 characters.")
    .optional()
    .or(z.literal("")),
  reward_type: z
    .string()
    .trim()
    .min(1, "Reward type is required.")
    .max(50, "Reward type cannot exceed 50 characters."),
  reward_value: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.coerce
      .number({ invalid_type_error: "Reward value must be a number." })
      .min(0, "Reward value cannot be negative.")
      .nullable()
      .optional(),
  ),
  voucher_validity_days: z.coerce
    .number({ invalid_type_error: "Validity days must be a whole number." })
    .int("Validity days must be a whole number.")
    .min(1, "Voucher validity must be at least 1 day."),
});

export const LoyaltyProgramForm = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    watch,
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

  const selectedEarningType = watch("earning_type");
  const selectedRewardType = watch("reward_type");
  const watchedName = watch("name");
  const watchedRewardTitle = watch("reward_title");
  const watchedThreshold = watch("threshold");
  const watchedStamps = watch("stamps_awarded");

  const handleFormSubmit = (data) => {
    // Clean up empty strings to null
    const payload = {
      ...data,
      description: data.description ? data.description.trim() : null,
      reward_description: data.reward_description
        ? data.reward_description.trim()
        : null,
      daily_stamp_limit:
        data.daily_stamp_limit === "" || data.daily_stamp_limit === null
          ? null
          : Number(data.daily_stamp_limit),
      reward_value:
        data.reward_value === "" || data.reward_value === null
          ? null
          : Number(data.reward_value),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8" noValidate>
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
              placeholder="e.g. Coffee Lovers Club, VIP Salon Rewards"
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
              Description <span className="text-[13px] font-normal text-[#23140C]/60">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Describe how customers participate and why they should join..."
              {...register("description")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                errors.description
                  ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                  : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: Earning Rules */}
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
              Define how and when customers earn stamps toward their reward.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
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
                  hint: "Award stamps each time the customer visits your store",
                },
                {
                  value: "purchase",
                  label: "Spend Amount",
                  hint: "Award stamps when customer spends a threshold amount",
                },
                {
                  value: "quantity",
                  label: "Item Quantity",
                  hint: "Award stamps based on the quantity of items purchased",
                },
              ].map((opt) => {
                const isSelected = selectedEarningType === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-[#A51D27] bg-[#F4F0EA]/70 shadow-xs"
                        : "border-[#F4F0EA] bg-white hover:bg-[#F4F0EA]/30"
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
            {errors.earning_type && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.earning_type.message}
              </p>
            )}
          </div>

          {/* Threshold & Stamps Awarded Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Threshold */}
            <div>
              <label
                htmlFor="threshold"
                className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
              >
                Threshold <span className="text-[#A51D27]">*</span>
              </label>
              <input
                id="threshold"
                type="number"
                step="any"
                min="0.01"
                placeholder={
                  selectedEarningType === "purchase"
                    ? "e.g. 50"
                    : selectedEarningType === "quantity"
                    ? "e.g. 2"
                    : "e.g. 1"
                }
                {...register("threshold")}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.threshold
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
              <p className="mt-1.5 text-[13px] leading-normal text-[#23140C]/75">
                {selectedEarningType === "visit"
                  ? "Visits required per stamp cycle (usually 1)"
                  : selectedEarningType === "purchase"
                  ? "Minimum monetary spend per stamp"
                  : "Number of items required per stamp"}
              </p>
              {errors.threshold && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.threshold.message}
                </p>
              )}
            </div>

            {/* Stamps Awarded */}
            <div>
              <label
                htmlFor="stamps_awarded"
                className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
              >
                Stamps Awarded <span className="text-[#A51D27]">*</span>
              </label>
              <input
                id="stamps_awarded"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 1"
                {...register("stamps_awarded")}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.stamps_awarded
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
              <p className="mt-1.5 text-[13px] leading-normal text-[#23140C]/75">
                Stamps given once threshold is reached
              </p>
              {errors.stamps_awarded && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.stamps_awarded.message}
                </p>
              )}
            </div>

            {/* Daily Stamp Limit */}
            <div>
              <label
                htmlFor="daily_stamp_limit"
                className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
              >
                Daily Limit{" "}
                <span className="text-[13px] font-normal text-[#23140C]/60">(Optional)</span>
              </label>
              <input
                id="daily_stamp_limit"
                type="number"
                min="1"
                step="1"
                placeholder="Leave blank for no limit"
                {...register("daily_stamp_limit")}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.daily_stamp_limit
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
              <p className="mt-1.5 text-[13px] leading-normal text-[#23140C]/75">
                Max stamps one customer can earn per day
              </p>
              {errors.daily_stamp_limit && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.daily_stamp_limit.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Reward Information (Keep Reward intact) */}
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
              placeholder="e.g. Free Specialty Latte, 20% Off Next Treatment"
              {...register("reward_title")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                errors.reward_title
                  ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                  : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
              }`}
            />
            {errors.reward_title && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.reward_title.message}
              </p>
            )}
          </div>

          {/* Reward Description */}
          <div>
            <label
              htmlFor="reward_description"
              className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
            >
              Reward Description{" "}
              <span className="text-[13px] font-normal text-[#23140C]/60">(Optional)</span>
            </label>
            <textarea
              id="reward_description"
              rows={2}
              placeholder="e.g. Valid on any hot or iced drink. Cannot be combined with other offers."
              {...register("reward_description")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                errors.reward_description
                  ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                  : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
              }`}
            />
            {errors.reward_description && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.reward_description.message}
              </p>
            )}
          </div>

          {/* Reward Type, Value & Voucher Validity Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Reward Type */}
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
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.reward_type
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              >
                <option value="free_item">Free Item / Product</option>
                <option value="discount_percentage">Percentage Discount (%)</option>
                <option value="discount_fixed">Fixed Amount Discount ($)</option>
                <option value="custom">Custom Perk / Experience</option>
              </select>
              {errors.reward_type && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.reward_type.message}
                </p>
              )}
            </div>

            {/* Reward Value */}
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
                  selectedRewardType === "discount_percentage"
                    ? "e.g. 20"
                    : "e.g. 5"
                }
                {...register("reward_value")}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.reward_value
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
              <p className="mt-1.5 text-[13px] leading-normal text-[#23140C]/75">
                Numeric discount value or retail equivalent
              </p>
              {errors.reward_value && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.reward_value.message}
                </p>
              )}
            </div>

            {/* Voucher Validity Days */}
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
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.voucher_validity_days
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
              <p className="mt-1.5 text-[13px] leading-normal text-[#23140C]/75">
                Days customer has to redeem the voucher
              </p>
              {errors.voucher_validity_days && (
                <p className="mt-1 text-[13px] font-medium text-red-600">
                  {errors.voucher_validity_days.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Program Summary Preview */}
      <div className="rounded-2xl border border-[#F4F0EA] bg-[#F4F0EA]/60 p-5">
        <div className="flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5 text-base text-[#A51D27]" />
          <div>
            <h4 className="text-[14px] font-bold uppercase tracking-wider text-[#23140C]">
              Program Summary
            </h4>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#23140C]/85">
              Customers in <strong>{watchedName || "Your Program"}</strong> will earn{" "}
              <strong>{watchedStamps || 1} stamp(s)</strong> per qualifying{" "}
              <strong>{selectedEarningType}</strong> (threshold: {watchedThreshold || 1}).
              Upon completing their stamps, they receive <strong>{watchedRewardTitle || "their reward"}</strong>,
              valid for redemption within voucher validity period.
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
          <span>{isSubmitting ? "Creating Loyalty Program..." : "Save & Create Loyalty Program"}</span>
        </Button>
      </div>
    </form>
  );
};

export default LoyaltyProgramForm;

