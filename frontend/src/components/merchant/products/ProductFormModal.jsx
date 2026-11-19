import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faXmark,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../ui";

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(255, "Product name cannot exceed 255 characters."),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters.")
    .optional()
    .or(z.literal("")),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a valid number." })
    .min(0, "Price cannot be negative."),
  status: z.enum(["active", "inactive"]).optional(),
});

export const ProductFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  product = null,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (product) {
        reset({
          name: product.name || "",
          description: product.description || "",
          price: product.price !== undefined ? Number(product.price) : "",
          status: product.status || "active",
        });
      } else {
        reset({
          name: "",
          description: "",
          price: "",
          status: "active",
        });
      }
    }
  }, [isOpen, product, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = (data) => {
    const payload = {
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      price: Number(data.price),
    };

    if (isEditing) {
      payload.status = data.status || "active";
    }

    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
              <FontAwesomeIcon icon={faBox} className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="product-modal-title"
                className="font-display text-[18px] font-bold text-[#23140C]"
              >
                {isEditing ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-[13px] text-[#23140C]/70">
                {isEditing
                  ? "Update product details for your catalog."
                  : "Add an item to use in quantity-based loyalty programs."}
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4" noValidate>
          {/* Product Name */}
          <div>
            <label
              htmlFor="product-name"
              className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
            >
              Product Name <span className="text-[#A51D27]">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="e.g. Iced Americano, Chocolate Croissant"
              {...register("name")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
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

          {/* Price */}
          <div>
            <label
              htmlFor="product-price"
              className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
            >
              Price (NPR) <span className="text-[#A51D27]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#23140C]/60">
                Rs.
              </span>
              <input
                id="product-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("price")}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-white pl-12 pr-4 py-2.5 text-[14.5px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
                  errors.price
                    ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
                    : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                }`}
              />
            </div>
            {errors.price && (
              <p className="mt-1 text-[13px] font-medium text-red-600">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="product-description"
              className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
            >
              Description{" "}
              <span className="text-[13px] font-normal text-[#23140C]/60">
                (Optional)
              </span>
            </label>
            <textarea
              id="product-description"
              rows={3}
              placeholder="Brief details about the item (e.g. freshly baked daily)..."
              {...register("description")}
              disabled={isSubmitting}
              className={`w-full rounded-xl border bg-white px-4 py-2.5 text-[14px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 ${
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

          {/* Status (Only in Edit mode) */}
          {isEditing && (
            <div>
              <label
                htmlFor="product-status"
                className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
              >
                Status
              </label>
              <select
                id="product-status"
                {...register("status")}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14px] text-[#23140C] transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20 disabled:bg-[#F4F0EA]/50"
              >
                <option value="active">Active (Available for loyalty programs)</option>
                <option value="inactive">Inactive (Hidden from new programs)</option>
              </select>
            </div>
          )}

          {/* Footer Actions */}
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
              disabled={isSubmitting}
            >
              <FontAwesomeIcon icon={faCheck} />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Add Product"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;

