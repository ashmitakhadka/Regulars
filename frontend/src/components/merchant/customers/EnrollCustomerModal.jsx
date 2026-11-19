import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button, Input, Spinner } from "../../ui";
import { customerService } from "../../../services/customerService";
import { loyaltyProgramService } from "../../../services/loyaltyProgramService";
import { enrollCustomerSchema } from "../../../schema/enrollCustomerSchema";

const EMPTY = {
  identifier_type: "customer_code",
  identifier: "",
  loyalty_program_id: "",
};

const fieldClass =
  "w-full rounded-lg border border-blush-200 bg-white px-3 py-2 text-sm text-ink transition focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:opacity-60";

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
    resolver: zodResolver(enrollCustomerSchema),
    defaultValues: EMPTY,
  });

  const isCode = watch("identifier_type") === "customer_code";

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;

    reset(EMPTY);
    setLoadingPrograms(true);

    loyaltyProgramService
      .getAllPrograms()
      .then((res) => {
        if (ignore) return;
        const active = (res.data || []).filter((p) => p.status === "active");
        setPrograms(active);
        reset({ ...EMPTY, loyalty_program_id: active[0]?.id ?? "" });
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load programs for enrollment:", err);
        toast.error("Couldn't load active loyalty programs.");
      })
      .finally(() => !ignore && setLoadingPrograms(false));

    return () => {
      ignore = true;
    };
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const enroll = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await customerService.enrollCustomer({
        loyalty_program_id: Number(data.loyalty_program_id),
        identifier_type: data.identifier_type,
        identifier: data.identifier.trim(),
      });
      toast.success(response.message || "Customer enrolled.");
      onEnrolled(response.data);
      onClose();
    } catch (err) {
      console.error("Customer enrollment error:", err);
      const status = err.response?.status;
      const validation = err.response?.data?.errors;

      if (status === 404) {
        toast.error("Customer not found. Check the code or phone number.");
      } else if (status === 409) {
        toast.error("This customer is already enrolled in that program.");
      } else if (status === 422 && validation) {
        toast.error(Object.values(validation).flat().join(" "));
      } else {
        toast.error(
          err.response?.data?.message ||
            "Couldn't enroll the customer. Try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-blush-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="enroll-modal-title"
              className="font-display text-lg font-bold text-brand-900"
            >
              Enroll customer
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              Add an existing customer to an active loyalty program.
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Close"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit(enroll)}
          className="mt-5 space-y-3"
          noValidate
        >
          <div>
            <label
              htmlFor="identifier_type"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Find customer by
            </label>
            <select
              id="identifier_type"
              disabled={isSubmitting}
              className={fieldClass}
              {...register("identifier_type")}
            >
              <option value="customer_code">Customer code</option>
              <option value="phone">Phone number</option>
            </select>
          </div>

          <Input
            label={isCode ? "Customer code" : "Phone number"}
            placeholder={isCode ? "RG-TEST001" : "9841000000"}
            error={errors.identifier?.message}
            disabled={isSubmitting}
            {...register("identifier")}
          />

          <div>
            <label
              htmlFor="loyalty_program_id"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Loyalty program
            </label>

            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-2 text-sm text-ink-soft">
                <Spinner size="sm" />
                <span>Loading programs…</span>
              </div>
            ) : programs.length === 0 ? (
              <p className="text-sm text-red-600">
                No active programs. Create or activate one first.
              </p>
            ) : (
              <select
                id="loyalty_program_id"
                disabled={isSubmitting}
                className={fieldClass}
                {...register("loyalty_program_id")}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {errors.loyalty_program_id && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.loyalty_program_id.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="soft"
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
              Enroll
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnrollCustomerModal;
