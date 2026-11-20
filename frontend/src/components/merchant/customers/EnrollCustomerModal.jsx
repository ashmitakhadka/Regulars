import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faXmark,
  faCheck,
  faIdCard,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Spinner } from "../../ui";
import { customerService } from "../../../services/customerService";
import { loyaltyProgramService } from "../../../services/loyaltyProgramService";

const enrollSchema = z.object({
  loyalty_program_id: z.coerce
    .number({ invalid_type_error: "Please select a loyalty program." })
    .min(1, "Please select an active loyalty program."),
  identifier_type: z.enum(["customer_code", "phone"]),
  identifier: z
    .string()
    .trim()
    .min(1, "Customer identifier is required."),
});

export const EnrollCustomerModal = ({ isOpen, onClose, onEnrolled }) => {
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      identifier_type: "customer_code",
      identifier: "",
      loyalty_program_id: "",
    },
  });

  const selectedType = watch("identifier_type");

  useEffect(() => {
    if (isOpen) {
      reset({
        identifier_type: "customer_code",
        identifier: "",
        loyalty_program_id: "",
      });

      setLoadingPrograms(true);
      loyaltyProgramService
        .getAllPrograms()
        .then((res) => {
          const activeOnly = (res.data || []).filter(
            (p) => p.status === "active",
          );
          setPrograms(activeOnly);
          if (activeOnly.length > 0) {
            reset((prev) => ({
              ...prev,
              loyalty_program_id: activeOnly[0].id,
            }));
          }
        })
        .catch((err) => {
          console.error("Failed to load programs for enrollment:", err);
          toast.error("Could not load active loyalty programs.");
        })
        .finally(() => {
          setLoadingPrograms(false);
        });
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleEnroll = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await customerService.enrollCustomer({
        loyalty_program_id: Number(data.loyalty_program_id),
        identifier_type: data.identifier_type,
        identifier: data.identifier.trim(),
      });

      toast.success(
        response.message || "Customer enrolled in program successfully!",
      );
      onEnrolled(response.data);
      onClose();
    } catch (err) {
      console.error("Customer enrollment error:", err);
      if (err.response?.status === 404) {
        toast.error("Customer not found. Please verify the code or phone.");
      } else if (err.response?.status === 409) {
        toast.error("Customer is already enrolled in this loyalty program.");
      } else if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Please correct the highlighted errors.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Unable to enroll customer. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="enroll-modal-title"
                className="font-display text-[18px] font-bold text-[#23140C]"
              >
                Enroll Customer
              </h2>
              <p className="text-[13px] text-[#23140C]/70">
                Register an existing customer into an active loyalty program.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#23140C]/50 hover:bg-[#F4F0EA] hover:text-[#23140C] transition"
            aria-label="Close dialog"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleEnroll)} className="mt-5 space-y-4" noValidate>
          {/* Identifier Type Selection */}
          <div>
            <label className="mb-2 block text-[14px] font-semibold text-[#23140C]">
              Identification Method <span className="text-[#A51D27]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-[13.5px] font-bold transition ${
                  selectedType === "customer_code"
                    ? "border-[#A51D27] bg-[#A51D27]/10 text-[#A51D27]"
                    : "border-[#F4F0EA] bg-white text-[#23140C] hover:border-[#A51D27]/40"
                }`}
              >
                <input
                  type="radio"
                  value="customer_code"
                  {...register("identifier_type")}
                  className="hidden"
                />
                <FontAwesomeIcon icon={faIdCard} />
                <span>Customer Code</span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-[13.5px] font-bold transition ${
                  selectedType === "phone"
                    ? "border-[#A51D27] bg-[#A51D27]/10 text-[#A51D27]"
                    : "border-[#F4F0EA] bg-white text-[#23140C] hover:border-[#A51D27]/40"
                }`}
              >
                <input
                  type="radio"
                  value="phone"
                  {...register("identifier_type")}
                  className="hidden"
                />
                <FontAwesomeIcon icon={faPhone} />
                <span>Phone Number</span>
              </label>
            </div>
          </div>

          {/* Identifier Value */}
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
            >
              {selectedType === "customer_code"
                ? "Customer Code"
                : "Customer Phone Number"}{" "}
              <span className="text-[#A51D27]">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              placeholder={
                selectedType === "customer_code"
                  ? "e.g. RG-TEST001"
                  : "e.g. 9841000000"
              }
              {...register("identifier")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                errors.identifier
                  ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                  : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
              }`}
            />
            {errors.identifier && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.identifier.message}
              </p>
            )}
          </div>

          {/* Program Selection */}
          <div>
            <label
              htmlFor="loyalty_program_id"
              className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
            >
              Select Active Loyalty Program <span className="text-[#A51D27]">*</span>
            </label>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-2 text-[13px] text-[#23140C]/70">
                <Spinner size="sm" />
                <span>Loading active programs...</span>
              </div>
            ) : programs.length === 0 ? (
              <p className="text-[13px] text-red-600">
                No active loyalty programs available. Please create or activate a program first.
              </p>
            ) : (
              <select
                id="loyalty_program_id"
                {...register("loyalty_program_id")}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {errors.loyalty_program_id && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.loyalty_program_id.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
              disabled={isSubmitting || programs.length === 0}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span>{isSubmitting ? "Enrolling..." : "Enroll Customer"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollCustomerModal;

