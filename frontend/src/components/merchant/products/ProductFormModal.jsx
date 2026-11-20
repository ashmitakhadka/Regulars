import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button, Input } from "../../ui";
import { productSchema } from "../../../schema/productSchema";

const EMPTY = { name: "", description: "", price: "", status: "active" };

const fieldClass =
  "w-full rounded-lg border border-blush-200 bg-white px-3 py-2 text-sm text-ink transition focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:opacity-60";

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
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!isOpen) return;
    reset(
      product
        ? {
            name: product.name || "",
            description: product.description || "",
            price: product.price !== undefined ? Number(product.price) : "",
            status: product.status || "active",
          }
        : EMPTY,
    );
  }, [isOpen, product, reset]);

  if (!isOpen) return null;

  const submit = (data) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: Number(data.price),
    };
    if (isEditing) payload.status = data.status || "active";
    onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="product-modal-title"
              className="font-display text-lg font-bold text-brand-900"
            >
              {isEditing ? "Edit product" : "Add product"}
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {isEditing
                ? "Update this item in your catalog."
                : "Add an item to use in per-product loyalty programs."}
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
          onSubmit={handleSubmit(submit)}
          className="mt-5 space-y-3"
          noValidate
        >
          <Input
            label="Product name"
            placeholder="e.g. Iced Americano"
            error={errors.name?.message}
            disabled={isSubmitting}
            {...register("name")}
          />

          <Input
            label="Price (NPR)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.price?.message}
            disabled={isSubmitting}
            {...register("price")}
          />

          <div>
            <label
              htmlFor="product-description"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Description{" "}
              <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <textarea
              id="product-description"
              rows={2}
              placeholder="e.g. Freshly baked daily"
              disabled={isSubmitting}
              className={fieldClass}
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {isEditing && (
            <div>
              <label
                htmlFor="product-status"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Status
              </label>
              <select
                id="product-status"
                disabled={isSubmitting}
                className={fieldClass}
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2  pt-2">
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
              disabled={isSubmitting}
            >
              {isEditing ? "Save changes" : "Add "}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
