import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStamp,
  faXmark,
  faCheck,
  faBox,
  faGift,
  faBarcode,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import { Button, Spinner } from "../../ui";
import { customerService } from "../../../services/customerService";
import { loyaltyProgramService } from "../../../services/loyaltyProgramService";

// Helper to generate UUID v4
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const AwardStampsModalContent = ({
  customer,
  initialCardId = null,
  onClose,
  onSuccess,
}) => {
  // Filter active cards
  const activeCards = (customer?.programs || []).filter(
    (c) => c.status === "active",
  );
  const defaultCard = initialCardId
    ? activeCards.find((c) => c.stamp_card_id === Number(initialCardId))
    : activeCards[0];

  const [selectedCardId, setSelectedCardId] = useState(
    defaultCard ? String(defaultCard.stamp_card_id) : "",
  );
  const [programDetails, setProgramDetails] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(false);

  // Form inputs based on earning type
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardResult, setAwardResult] = useState(null);

  // Idempotency key per operation attempt
  const idempotencyKeyRef = useRef(generateUUID());

  // Whenever selected card changes, fetch program details
  useEffect(() => {
    if (!selectedCardId) return;

    const card = activeCards.find(
      (c) => String(c.stamp_card_id) === String(selectedCardId),
    );
    if (!card) return;

    let ignore = false;
    loyaltyProgramService
      .getProgramDetails(card.program_id)
      .then((res) => {
        if (ignore) return;
        const prog = res.data;
        setProgramDetails(prog);

        const version =
          prog.versions?.find((v) => v.status === "active") ||
          prog.versions?.[0];
        const prs =
          version?.earning_rule?.product_rules ||
          version?.earningRule?.productRules ||
          [];
        if (prs.length > 0) {
          setSelectedProductId(String(prs[0].product_id));
        } else {
          setSelectedProductId("");
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load program details for stamp award:", err);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoadingProgram(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCardId, activeCards]);

  const activeVersion =
    programDetails?.versions?.find((v) => v.status === "active") ||
    programDetails?.versions?.[0] ||
    null;
  const earningRule =
    activeVersion?.earning_rule || activeVersion?.earningRule || null;
  const earningType = earningRule?.earning_type || "visit";
  const productRules =
    earningRule?.product_rules || earningRule?.productRules || [];

  const handleCardChange = (cardId) => {
    setSelectedCardId(cardId);
    setProgramDetails(null);
    setLoadingProgram(true);
  };

  const handleAward = async (e) => {
    e.preventDefault();
    if (!selectedCardId) {
      toast.error("Please select a stamp card.");
      return;
    }

    const payload = {
      stamp_card_id: Number(selectedCardId),
      idempotency_key: idempotencyKeyRef.current,
    };

    if (earningType === "purchase") {
      if (!purchaseAmount || Number(purchaseAmount) <= 0) {
        toast.error("Please enter a valid purchase amount.");
        return;
      }
      payload.purchase_amount = Number(purchaseAmount);
    } else if (earningType === "quantity") {
      if (!selectedProductId) {
        toast.error("Please select a product.");
        return;
      }
      if (!quantity || Number(quantity) < 1) {
        toast.error("Quantity must be at least 1.");
        return;
      }
      payload.product_id = Number(selectedProductId);
      payload.quantity = Number(quantity);
    }

    setIsSubmitting(true);
    try {
      const response = await customerService.awardStamps(payload);
      toast.success(response.message || "Stamps awarded successfully!");
      setAwardResult(response);

      // Generate a fresh key for subsequent operations
      idempotencyKeyRef.current = generateUUID();

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error("Failed to award stamps:", err);
      const message =
        err.response?.data?.message ||
        "Unable to award stamps. Please check the requirements.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23140C]/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
              <FontAwesomeIcon icon={faStamp} className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="award-modal-title"
                className="font-display text-[18px] font-bold text-[#23140C]"
              >
                Award Stamps
              </h2>
              <p className="text-[13px] text-[#23140C]/70">
                Customer: <strong className="text-[#23140C]">{customer.name}</strong>{" "}
                ({customer.customer_code})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#23140C]/50 hover:bg-[#F4F0EA] hover:text-[#23140C] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* If stamps were already awarded in this session: show result summary */}
        {awardResult ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <FontAwesomeIcon icon={faCheck} className="h-6 w-6" />
              </div>
              <h3 className="font-display text-[18px] font-bold text-emerald-950">
                {awardResult.stamps_awarded} Stamp(s) Awarded!
              </h3>
              <p className="text-[13.5px] text-emerald-900">
                Total stamps now:{" "}
                <strong className="text-[15px] font-bold">
                  {awardResult.total_stamps}
                </strong>
              </p>
            </div>

            {/* Quantity Progress Feedback */}
            {awardResult.quantity_progress && (
              <div className="rounded-xl border border-[#F4F0EA] bg-[#F4F0EA]/60 p-4 space-y-2 text-[13.5px]">
                <div className="flex items-center gap-2 font-bold text-[#23140C]">
                  <FontAwesomeIcon icon={faBox} className="text-[#A51D27]" />
                  <span>Quantity Progress</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#23140C]/80">
                  <p>
                    Purchased today:{" "}
                    <strong>
                      {awardResult.quantity_progress.today_quantity} item(s)
                    </strong>
                  </p>
                  <p>
                    Required for reward:{" "}
                    <strong>
                      {awardResult.quantity_progress.quantity_required} item(s)
                    </strong>
                  </p>
                  <p className="col-span-2">
                    Remaining for next voucher:{" "}
                    <strong className="text-[#A51D27]">
                      {awardResult.quantity_progress.remaining_quantity === 0
                        ? "Completed! Voucher Generated."
                        : `${awardResult.quantity_progress.remaining_quantity} item(s)`}
                    </strong>
                  </p>
                </div>
              </div>
            )}

            {/* Newly Issued Vouchers */}
            {awardResult.vouchers_issued > 0 && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <FontAwesomeIcon icon={faGift} className="text-[#A51D27]" />
                  <span>
                    🎉 {awardResult.vouchers_issued} Reward Voucher(s) Issued!
                  </span>
                </div>
                <div className="space-y-1.5">
                  {awardResult.vouchers?.map((v) => (
                    <div
                      key={v.id || v.code}
                      className="flex items-center justify-between rounded-lg bg-white p-2.5 text-[13px] shadow-xs"
                    >
                      <div>
                        <p className="font-bold text-[#23140C]">{v.reward_title}</p>
                        <p className="font-mono text-xs font-semibold text-[#A51D27]">
                          Code: {v.code}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-[#F4F0EA] pt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setAwardResult(null);
                  setPurchaseAmount("");
                  setQuantity(1);
                  idempotencyKeyRef.current = generateUUID();
                }}
              >
                Award Again
              </Button>

              <Button type="button" variant="primary" size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Stamp Award Form */
          <form onSubmit={handleAward} className="mt-5 space-y-4">
            {activeCards.length === 0 ? (
              <p className="text-[13.5px] text-red-600 py-4 text-center">
                This customer is not currently enrolled in any active loyalty programs.
                Please enroll them first.
              </p>
            ) : (
              <>
                {/* Stamp Card Selector */}
                <div>
                  <label
                    htmlFor="select-stamp-card"
                    className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                  >
                    Select Active Loyalty Program Card <span className="text-[#A51D27]">*</span>
                  </label>
                  <select
                    id="select-stamp-card"
                    value={selectedCardId}
                    onChange={(e) => handleCardChange(e.target.value)}
                    disabled={isSubmitting || loadingProgram}
                    className="w-full rounded-xl border border-[#F4F0EA] bg-white px-4 py-2.5 text-[14px] text-[#23140C] focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                  >
                    {activeCards.map((card) => (
                      <option
                        key={card.stamp_card_id}
                        value={card.stamp_card_id}
                      >
                        {card.program_name} ({card.stamps_earned} stamps currently)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Earning Mode Form Fields */}
                {loadingProgram ? (
                  <div className="flex items-center gap-2 py-4 text-[13.5px] text-[#23140C]/70">
                    <Spinner size="sm" />
                    <span>Loading program rules...</span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#F4F0EA]/50 p-4 space-y-3">
                    {/* Earning Type Badge */}
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#23140C]">
                      <FontAwesomeIcon
                        icon={
                          earningType === "visit"
                            ? faBarcode
                            : earningType === "purchase"
                            ? faLayerGroup
                            : faBox
                        }
                        className="text-[#A51D27]"
                      />
                      <span className="capitalize">
                        Rule: {earningType === "visit"
                          ? "Per Visit"
                          : earningType === "purchase"
                          ? "Purchase Amount"
                          : "Product Quantity"}
                      </span>
                    </div>

                    {/* 1. Visit-based Form */}
                    {earningType === "visit" && (
                      <p className="text-[13px] text-[#23140C]/75 leading-relaxed">
                        Recording this counter visit will award{" "}
                        <strong className="text-[#A51D27]">
                          {earningRule?.stamps_awarded || 1} stamp(s)
                        </strong>{" "}
                        to the customer's card.
                      </p>
                    )}

                    {/* 2. Purchase-based Form */}
                    {earningType === "purchase" && (
                      <div>
                        <label
                          htmlFor="purchase-amount"
                          className="mb-1 block text-[13.5px] font-semibold text-[#23140C]"
                        >
                          Customer Purchase Bill (NPR) <span className="text-[#A51D27]">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#23140C]/50">
                            Rs.
                          </span>
                          <input
                            id="purchase-amount"
                            type="number"
                            step="any"
                            min="1"
                            value={purchaseAmount}
                            onChange={(e) => setPurchaseAmount(e.target.value)}
                            placeholder="e.g. 1500"
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-[#F4F0EA] bg-white pl-12 pr-4 py-2 text-[14px] text-[#23140C] focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                          />
                        </div>
                        <p className="mt-1 text-[12px] text-[#23140C]/70">
                          The backend will automatically match the minimum spend threshold or qualifying tier.
                        </p>
                      </div>
                    )}

                    {/* 3. Quantity-based Form */}
                    {earningType === "quantity" && (
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="award-product-id"
                            className="mb-1 block text-[13.5px] font-semibold text-[#23140C]"
                          >
                            Purchased Catalog Product <span className="text-[#A51D27]">*</span>
                          </label>
                          <select
                            id="award-product-id"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-[#F4F0EA] bg-white px-3.5 py-2 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                          >
                            {productRules.map((pr) => (
                              <option key={pr.product_id} value={pr.product_id}>
                                {pr.product?.name || `Product #${pr.product_id}`} (Requires{" "}
                                {pr.quantity_required} for {pr.reward?.title || "Reward"})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="award-quantity"
                            className="mb-1 block text-[13.5px] font-semibold text-[#23140C]"
                          >
                            Quantity Purchased <span className="text-[#A51D27]">*</span>
                          </label>
                          <input
                            id="award-quantity"
                            type="number"
                            min="1"
                            max="100"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-xl border border-[#F4F0EA] bg-white px-3.5 py-2 text-[13.5px] text-[#23140C] focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
                          />
                          <p className="mt-1 text-[12px] text-[#23140C]/70">
                            Stamps are added to this product's counter. When requirements are reached, reward vouchers issue automatically.
                          </p>
                        </div>
                      </div>
                    )}
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
                    disabled={isSubmitting || loadingProgram || !selectedCardId}
                  >
                    <FontAwesomeIcon icon={faStamp} />
                    <span>{isSubmitting ? "Awarding..." : "Confirm & Award Stamps"}</span>
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export const AwardStampsModal = ({
  isOpen,
  customer,
  initialCardId = null,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !customer) return null;

  return (
    <AwardStampsModalContent
      key={`${customer.id}-${initialCardId || "default"}`}
      customer={customer}
      initialCardId={initialCardId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default AwardStampsModal;
