import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../ui";

export const DeleteProductModal = ({
  isOpen,
  product,
  onConfirm,
  onClose,
  isDeleting = false,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-product-title"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="delete-product-title"
              className="font-display text-[18px] font-bold text-[#23140C]"
            >
              Delete Product?
            </h3>
            <p className="mt-0.5 text-[13.5px] font-semibold text-[#A51D27]">
              {product.name}
            </p>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="mt-4 rounded-xl border border-red-200/80 bg-red-50/70 p-4 text-[13.5px] text-red-950">
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="mt-0.5 text-red-700 shrink-0"
            />
            <div className="space-y-1 leading-relaxed">
              <p className="font-semibold text-red-950">
                Are you sure you want to remove this product?
              </p>
              <p className="text-[13px] text-red-900/90">
                This action is permanent. Products actively linked to quantity-based loyalty programs cannot be deleted.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#23140C]/75">
          If you no longer offer this item, consider setting its status to <strong>Inactive</strong> instead of deleting it.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3 border-t border-[#F4F0EA] pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            loading={isDeleting}
            disabled={isDeleting}
            className="w-full sm:w-auto !bg-red-700 hover:!bg-red-800 text-white"
          >
            <FontAwesomeIcon icon={faTrash} />
            <span>{isDeleting ? "Deleting..." : "Delete Product"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;

