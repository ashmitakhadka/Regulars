import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxArchive,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../ui";

export const ArchiveConfirmation = ({
  isOpen,
  programName,
  onConfirm,
  onCancel,
  isArchiving = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        {/* Header with Icon */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
            <FontAwesomeIcon icon={faBoxArchive} className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="archive-modal-title"
              className="font-display text-[18px] font-bold text-[#23140C]"
            >
              Archive Loyalty Program
            </h3>
            <p className="mt-0.5 text-[13.5px] text-[#23140C]/75">
              {programName || "Selected loyalty program"}
            </p>
          </div>
        </div>

        {/* Informative Explanation */}
        <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-[13.5px] text-amber-950">
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="mt-0.5 text-amber-700"
            />
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-semibold text-amber-950">
                This loyalty program will be archived, not deleted.
              </p>
              <p className="text-amber-900/90 text-[13px]">
                All historical customer loyalty cards, transaction logs, and redeemed
                vouchers remain permanently protected in the system.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#23140C]/85">
          Once archived, customers can no longer earn stamps under this program,
          and the program <strong>cannot be edited or reactivated</strong>.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isArchiving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConfirm}
            loading={isArchiving}
            disabled={isArchiving}
            className="!bg-amber-800 hover:!bg-amber-900"
          >
            <FontAwesomeIcon icon={faBoxArchive} />
            <span>{isArchiving ? "Archiving..." : "Confirm Archive"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveConfirmation;
