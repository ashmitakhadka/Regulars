import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { Spinner, ErrorState, Button, BackButton } from "../../components/ui";
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

// Only name and description can be edited.
const editProgramSchema = z.object({
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
});

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// Plain-text summary of the locked earning rule.
const getEarnText = (rule) => {
  if (!rule) return "Not set";

  const threshold = Number(rule.threshold) || 0;
  const stamps = Number(rule.stamps_awarded) || 1;

  switch (rule.earning_type) {
    case "visit":
      return threshold > 1
        ? `Visit ${threshold} times to complete the card`
        : "One visit completes the card";
    case "purchase":
      if (rule.tiers?.length) return "Spend tiers";
      return threshold > 0
        ? `Spend NPR ${threshold.toLocaleString()}, earn ${plural(stamps, "stamp")}`
        : `Any purchase, earn ${plural(stamps, "stamp")}`;
    case "quantity": {
      const count = (rule.product_rules || rule.productRules || []).length;
      return `Buy items from ${plural(count, "product")}`;
    }
    default:
      return "Not set";
  }
};

// Plain-text summary of the locked reward.
const getRewardText = (version, rule) => {
  if (version?.issues_voucher === false) return "No voucher, stamps only";
  if (rule?.earning_type === "quantity") return "Set per product";

  const reward = version?.reward;
  if (!reward?.title) return "Not set";

  const days = Number(reward.voucher_validity_days) || 0;
  return days > 0 ? `${reward.title} (valid ${days} days)` : reward.title;
};

const inputClass = (hasError) =>
  `w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/45 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
    hasError
      ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
      : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
  }`;

export const EditLoyaltyProgram = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(editProgramSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    let ignore = false;

    loyaltyProgramService
      .getProgramDetails(id)
      .then((response) => {
        if (ignore) return;

        const data = response.data;
        setProgram(data);
        reset({
          name: data.name || "",
          description: data.description || "",
        });
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;

        console.error("Failed to load loyalty program for editing:", err);
        setError(
          err.response?.status === 404
            ? "Loyalty program not found."
            : err.response?.data?.message ||
                "Unable to load loyalty program for editing. Please try again.",
        );
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id, reset]);

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await loyaltyProgramService.updateProgram(id, {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      });

      toast.success(
        response.message || "Loyalty program updated successfully.",
      );
      navigate(`/merchant/loyalty-programs/${id}`, { replace: true });
    } catch (err) {
      console.error("Update loyalty program failed:", err);

      if (err.response?.status === 422 && err.response?.data?.errors) {
        const messages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(messages || "Please correct the highlighted fields.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Unable to update loyalty program. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isArchived = program?.status?.toLowerCase() === "archived";

  // Prefer the active version, otherwise the highest version number.
  const activeVersion =
    program?.versions?.find((v) => v.status === "active") ||
    [...(program?.versions || [])].sort(
      (a, b) => (b.version_number || 0) - (a.version_number || 0),
    )[0] ||
    null;
  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Back arrow button, top left */}
        <BackButton
          to={`/merchant/loyalty-programs/${id}`}
          size="xs"
          iconOnly
        />

        {loading && (
          <div className="mt-6 flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Spinner size="md" />
            <p className="text-[14px] text-[#23140C]/75">Loading program…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Cannot edit loyalty program"
              message={error}
              action={
                <Button
                  to="/merchant/loyalty-programs"
                  variant="primary"
                  size="sm"
                >
                  Return to loyalty programs
                </Button>
              }
            />
          </div>
        )}

        {!loading && !error && isArchived && (
          <div className="mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-[16px] font-bold text-amber-950">
              Archived programs can't be edited
            </h1>
            <p className="mt-1 text-[13.5px] leading-relaxed text-amber-900">
              This program is archived and kept as a record, so it can't be
              changed.
            </p>
          </div>
        )}

        {!loading && !error && program && !isArchived && (
          <div className="mx-auto mt-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(35,20,12,0.08)] sm:p-8">
            <h1 className="font-display text-[26px] font-bold tracking-tight text-[#23140C] sm:text-[28px]">
              Edit loyalty program
            </h1>
            <p className="mt-1 text-[14px] text-[#23140C]/70">
              You can change the name and description. Earning rules and rewards
              are locked to protect existing customer cards.
            </p>

            <form
              onSubmit={handleSubmit(handleUpdate)}
              className="mt-8 space-y-8"
              noValidate
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    disabled={isSubmitting}
                    className={inputClass(errors.name)}
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="mt-1 text-[13px] font-medium text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1.5 block text-[14.5px] font-semibold text-[#23140C]"
                  >
                    Description{" "}
                    <span className="text-[13px] font-normal text-[#23140C]/60">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    disabled={isSubmitting}
                    className={inputClass(errors.description)}
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="mt-1 text-[13px] font-medium text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Locked details, plain text only */}
              <section>
                <h2 className="text-[14.5px] font-semibold text-[#23140C]">
                  Locked details
                </h2>

                <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2 text-[14px]">
                  <dt className="text-[#23140C]/60">Earn</dt>
                  <dd className="text-[#23140C]">{getEarnText(earningRule)}</dd>

                  <dt className="text-[#23140C]/60">Reward</dt>
                  <dd className="text-[#23140C]">
                    {getRewardText(activeVersion, earningRule)}
                  </dd>
                </dl>
              </section>

              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="soft"
                  onClick={() => navigate(`/merchant/loyalty-programs/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting ? "Saving…" : "Save "}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditLoyaltyProgram;
