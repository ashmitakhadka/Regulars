import { useEffect, useState } from "react";
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
import { loyaltyProgramService } from "../../services/loyaltyProgramService";

// Validation schema for basic program information only
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
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    let ignore = false;

    loyaltyProgramService
      .getProgramDetails(id)
      .then((response) => {
        if (!ignore) {
          const data = response.data;
          setProgram(data);
          reset({
            name: data.name || "",
            description: data.description || "",
          });
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load loyalty program for editing:", err);
          if (err.response?.status === 404) {
            setError("Loyalty program not found.");
          } else {
            setError(
              err.response?.data?.message ||
                "Unable to load loyalty program for editing. Please try again.",
            );
          }
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id, reset]);

  const handleUpdate = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
      };

      const response = await loyaltyProgramService.updateProgram(id, payload);
      toast.success(response.message || "Loyalty program updated successfully.");
      navigate(`/merchant/loyalty-programs/${id}`, { replace: true });
    } catch (err) {
      console.error("Update loyalty program failed:", err);
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted fields.");
      } else {
        const message =
          err.response?.data?.message ||
          "Unable to update loyalty program. Please try again.";
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
            to={id ? `/merchant/loyalty-programs/${id}` : "/merchant/loyalty-programs"}
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#23140C]/75 hover:text-[#A51D27] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Loyalty Program Details</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-[14px] font-medium text-[#23140C]/75">
              Loading loyalty program information...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Cannot Edit Loyalty Program"
              message={error}
              action={
                <Button to="/merchant/loyalty-programs" variant="primary" size="sm">
                  Return to Loyalty Programs
                </Button>
              }
            />
          </div>
        )}

        {/* Archived Warning State */}
        {!loading && !error && isArchived && (
          <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="mt-0.5 text-base text-amber-700"
              />
              <div>
                <h3 className="text-[15px] font-bold text-amber-950">
                  Archived Loyalty Programs Cannot Be Edited
                </h3>
                <p className="mt-1 text-[13.5px] text-amber-900 leading-relaxed">
                  This loyalty program is archived. In accordance with system policy,
                  archived programs are permanently preserved for audit records and
                  cannot be modified.
                </p>
                <div className="mt-4">
                  <Button
                    to={`/merchant/loyalty-programs/${id}`}
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
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
                  <FontAwesomeIcon icon={faPen} className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
                    Edit Loyalty Program
                  </h1>
                  <p className="mt-0.5 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
                    Update the program name and description. Earning rules and reward policies remain locked to protect customer loyalty cards and history.
                  </p>
                </div>
              </div>
            </header>

            <form onSubmit={handleSubmit(handleUpdate)} className="mt-8 space-y-6" noValidate>
              {/* Editable Section: Basic Information */}
              <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
                <h2 className="font-display text-[17px] font-bold text-[#23140C]">
                  Basic Information
                </h2>
                <p className="mt-0.5 text-[13.5px] text-[#23140C]/75">
                  Customers will see this name on their digital loyalty card.
                </p>

                <div className="mt-5 space-y-4">
                  {/* Name */}
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

              {/* Locked Section: Earning Rules & Rewards Notice */}
              <section className="rounded-2xl border border-[#F4F0EA] bg-[#F4F0EA]/60 p-6 sm:p-7">
                <div className="flex items-center gap-2 text-[13.5px] font-bold uppercase tracking-wider text-[#23140C]/80">
                  <FontAwesomeIcon icon={faLock} className="text-[#A51D27]" />
                  <span>Earning Rules & Reward Terms (Read-Only)</span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#23140C]/75">
                  Per system policy, earning rules and rewards cannot be modified directly once created to protect active customer loyalty cards and historical versions.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2 text-[13.5px]">
                  <div className="rounded-xl bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-[#23140C]">
                      <FontAwesomeIcon icon={faStar} className="text-[#A51D27]" />
                      <span>Earning Rules</span>
                    </div>
                    <p className="mt-1.5 text-[#23140C]/85">
                      <strong>{earningRule?.stamps_awarded || 1} stamp(s)</strong> per{" "}
                      {earningRule?.threshold}{" "}
                      {earningRule?.earning_type === "visit"
                        ? "visit(s)"
                        : earningRule?.earning_type === "purchase"
                        ? "spend"
                        : "item(s)"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-[#23140C]">
                      <FontAwesomeIcon icon={faGift} className="text-[#A51D27]" />
                      <span>Reward Output</span>
                    </div>
                    <p className="mt-1.5 text-[#23140C]/85 line-clamp-1">
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

export default EditLoyaltyProgram;

