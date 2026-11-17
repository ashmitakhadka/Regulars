import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPen,
  faLock,
  faCheck,
  faCircleExclamation,
  faStar,
  faGift,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { Spinner, ErrorState, Button } from "../../components/ui";
import { rewardProgramService } from "../../services/rewardProgramService";

// Validation schema for basic program information only
const editProgramSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Program name is required.")
    .max(255, "Program name cannot exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional()
    .or(z.literal("")),
});

export const EditRewardProgram = () => {
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
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchProgram = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await rewardProgramService.getProgramDetails(id);
      const data = response.data;
      setProgram(data);

      // Prepopulate form
      reset({
        name: data.name || "",
        description: data.description || "",
      });
    } catch (err) {
      console.error("Failed to load program for editing:", err);
      if (err.response?.status === 404) {
        setError("Reward program not found.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to load program for editing. Please try again.";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      };

      const response = await rewardProgramService.updateProgram(id, payload);
      toast.success(response.message || "Reward program updated successfully.");
      navigate(`/merchant/reward-programs/${id}`, { replace: true });
    } catch (err) {
      console.error("Update program failed:", err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted fields.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to update reward program. Please try again.";
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isArchived = program?.status === "archived";
  const activeVersion =
    program?.versions?.find((v) => v.status === "active") ||
    program?.versions?.[0] ||
    null;
  const earningRule = activeVersion?.earning_rule || activeVersion?.earningRule;
  const reward = activeVersion?.reward;

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to={id ? `/merchant/reward-programs/${id}` : "/merchant/reward-programs"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#23140C]/60 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Program Details</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-sm font-medium text-[#23140C]/60">
              Loading program information...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Cannot Edit Program"
              message={error}
              action={
                <Button to="/merchant/reward-programs" variant="primary" size="sm">
                  Return to Reward Programs
                </Button>
              }
            />
          </div>
        )}

        {/* Archived Warning State (Cannot edit archived programs per business rule) */}
        {!loading && !error && isArchived && (
          <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5 text-base text-amber-700"
              />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Archived Programs Cannot Be Edited
                </h3>
                <p className="mt-1 text-xs text-amber-800">
                  This reward program is archived. In accordance with system policy,
                  archived programs are permanently preserved for audit records and
                  cannot be modified.
                </p>
                <div className="mt-4">
                  <Button
                    to={`/merchant/reward-programs/${id}`}
                    variant="secondary"
                    size="sm"
                  >
                    View Program Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {!loading && !error && program && !isArchived && (
          <div className="max-w-3xl">
            {/* Header */}
            <header className="border-b border-[#F4F0EA] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
                  <FontAwesomeIcon icon={faPen} className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[#23140C] sm:text-3xl">
                    Edit Reward Program
                  </h1>
                  <p className="mt-0.5 text-xs text-[#23140C]/60 sm:text-sm">
                    Update the program name and description. Earning rules and reward policies remain locked to protect customer history.
                  </p>
                </div>
              </div>
            </header>

            <form onSubmit={handleSubmit(handleUpdate)} className="mt-8 space-y-6" noValidate>
              {/* Editable Section: Basic Information */}
              <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
                <h2 className="font-display text-base font-bold text-[#23140C] sm:text-lg">
                  Basic Information
                </h2>
                <p className="mt-0.5 text-xs text-[#23140C]/50">
                  Customers will see this name on their digital loyalty card.
                </p>

                <div className="mt-5 space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#23140C]"
                    >
                      Program Name <span className="text-[#A51D27]">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...register("name")}
                      disabled={isSubmitting}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#23140C] placeholder:text-[#23140C]/35 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                        errors.name
                          ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                          : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#23140C]"
                    >
                      Description{" "}
                      <span className="text-xs font-normal text-[#23140C]/40">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      {...register("description")}
                      disabled={isSubmitting}
                      className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-[#23140C] placeholder:text-[#23140C]/35 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                        errors.description
                          ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                          : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Locked Section: Earning Rules & Rewards Notice */}
              <section className="rounded-2xl border border-[#F4F0EA] bg-[#F4F0EA]/50 p-6 sm:p-7">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#23140C]/70">
                  <FontAwesomeIcon icon={faLock} className="text-[#A51D27]" />
                  <span>Earning Rules & Reward Terms (Read-Only)</span>
                </div>
                <p className="mt-1 text-xs text-[#23140C]/60">
                  Per system policy, earning rules and rewards cannot be modified directly once created to protect active customer stamp cards and historical versions.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-xl bg-white p-3.5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-[#23140C]">
                      <FontAwesomeIcon icon={faStar} className="text-[#A51D27]" />
                      <span>Earning Rules</span>
                    </div>
                    <p className="mt-1 text-[#23140C]/70">
                      <strong>{earningRule?.stamps_awarded || 1} stamp(s)</strong> per{" "}
                      {earningRule?.threshold}{" "}
                      {earningRule?.earning_type === "visit"
                        ? "visit(s)"
                        : earningRule?.earning_type === "purchase"
                        ? "spend"
                        : "item(s)"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3.5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-[#23140C]">
                      <FontAwesomeIcon icon={faGift} className="text-[#A51D27]" />
                      <span>Reward Output</span>
                    </div>
                    <p className="mt-1 text-[#23140C]/70 line-clamp-1">
                      <strong>{reward?.title || "Reward"}</strong> (Valid for{" "}
                      {reward?.voucher_validity_days || 30} days)
                    </p>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/merchant/reward-programs/${id}`)}
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
                  <FontAwesomeIcon icon={faCheck} />
                  <span>{isSubmitting ? "Saving Changes..." : "Save Changes"}</span>
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditRewardProgram;
