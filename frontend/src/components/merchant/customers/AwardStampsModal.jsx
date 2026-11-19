import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Button, Input, Spinner } from "../../ui";
import { customerService } from "../../../services/customerService";
import { loyaltyProgramService } from "../../../services/loyaltyProgramService";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const fieldClass =
  "w-full rounded-lg border border-blush-200 bg-white px-3 py-2 text-sm text-ink transition focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/10 disabled:opacity-60";

const Field = ({ label, htmlFor, hint, children }) => (
  <div>
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-ink"
    >
      {label}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
  </div>
);

const AwardStampsModalContent = ({
  customer,
  initialCardId = null,
  onClose,
  onSuccess,
}) => {
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
  const [loadingProgram, setLoadingProgram] = useState(Boolean(defaultCard));

  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awardResult, setAwardResult] = useState(null);

  const idempotencyKeyRef = useRef(generateUUID());

  const programId = activeCards.find(
    (c) => String(c.stamp_card_id) === String(selectedCardId),
  )?.program_id;

  useEffect(() => {
    if (!programId) return;
    let ignore = false;

    loyaltyProgramService
      .getProgramDetails(programId)
      .then((res) => {
        if (ignore) return;
        const prog = res.data;
        setProgramDetails(prog);

        const version =
          prog.versions?.find((v) => v.status === "active") ||
          prog.versions?.[0];
        const rules =
          version?.earning_rule?.product_rules ||
          version?.earningRule?.productRules ||
          [];
        setSelectedProductId(rules.length ? String(rules[0].product_id) : "");
      })
      .catch((err) => {
        if (!ignore)
          console.error("Failed to load program details for stamp award:", err);
      })
      .finally(() => !ignore && setLoadingProgram(false));

    return () => {
      ignore = true;
    };
  }, [programId]);

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

  const resetForm = () => {
    setAwardResult(null);
    setPurchaseAmount("");
    setQuantity(1);
    idempotencyKeyRef.current = generateUUID();
  };

  const handleAward = async (e) => {
    e.preventDefault();
    if (!selectedCardId) return toast.error("Select a stamp card.");

    const payload = {
      stamp_card_id: Number(selectedCardId),
      idempotency_key: idempotencyKeyRef.current,
    };

    if (earningType === "purchase") {
      if (!purchaseAmount || Number(purchaseAmount) <= 0)
        return toast.error("Enter a valid purchase amount.");
      payload.purchase_amount = Number(purchaseAmount);
    } else if (earningType === "quantity") {
      if (!selectedProductId) return toast.error("Select a product.");
      if (!quantity || Number(quantity) < 1)
        return toast.error("Quantity must be at least 1.");
      payload.product_id = Number(selectedProductId);
      payload.quantity = Number(quantity);
    }

    setIsSubmitting(true);
    try {
      const response = await customerService.awardStamps(payload);
      toast.success(response.message || "Stamps awarded.");
      setAwardResult(response);
      idempotencyKeyRef.current = generateUUID();
      onSuccess?.(response);
    } catch (err) {
      console.error("Failed to award stamps:", err);
      toast.error(
        err.response?.data?.message || "Couldn't award stamps. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = awardResult?.quantity_progress;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="award-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-blush-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="award-modal-title"
              className="font-display text-lg font-bold text-brand-900"
            >
              Award stamps
            </h2>
            <p className="mt-0.5 text-sm text-ink-soft">
              {customer.name} · {customer.customer_code}
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

        {awardResult ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-[#F4F0EA]/50 p-4">
              <p className="font-display text-base font-bold text-brand-900">
                {awardResult.stamps_awarded} stamp(s) awarded
              </p>
              <p className="mt-0.5 text-sm text-ink-soft">
                Total stamps: {awardResult.total_stamps}
              </p>
            </div>

            {progress && (
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Purchased today</dt>
                  <dd className="font-medium text-ink">
                    {progress.today_quantity}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Required for reward</dt>
                  <dd className="font-medium text-ink">
                    {progress.quantity_required}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Remaining</dt>
                  <dd className="font-medium text-ink">
                    {progress.remaining_quantity === 0
                      ? "Voucher issued"
                      : progress.remaining_quantity}
                  </dd>
                </div>
              </dl>
            )}

            {awardResult.vouchers_issued > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ink">
                  {awardResult.vouchers_issued} reward voucher(s) issued
                </p>
                {awardResult.vouchers?.map((v) => (
                  <div
                    key={v.id || v.code}
                    className="flex items-center justify-between rounded-lg border border-blush-200 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-ink">
                      {v.reward_title}
                    </span>
                    <span className="font-mono text-xs text-ink-soft">
                      {v.code}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="soft"
                size="sm"
                onClick={resetForm}
              >
                Award again
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAward} className="mt-5 space-y-3" noValidate>
            {activeCards.length === 0 ? (
              <p className="py-4 text-center text-sm text-red-600">
                This customer isn't enrolled in an active program. Enroll them
                first.
              </p>
            ) : (
              <>
                <Field label="Loyalty program" htmlFor="select-stamp-card">
                  <select
                    id="select-stamp-card"
                    value={selectedCardId}
                    onChange={(e) => handleCardChange(e.target.value)}
                    disabled={isSubmitting || loadingProgram}
                    className={fieldClass}
                  >
                    {activeCards.map((card) => (
                      <option
                        key={card.stamp_card_id}
                        value={card.stamp_card_id}
                      >
                        {card.program_name} ({card.stamps_earned} stamps)
                      </option>
                    ))}
                  </select>
                </Field>

                {loadingProgram ? (
                  <div className="flex items-center gap-2 py-2 text-sm text-ink-soft">
                    <Spinner size="sm" />
                    <span>Loading program rules…</span>
                  </div>
                ) : (
                  <>
                    {earningType === "visit" && (
                      <p className="text-sm text-ink-soft">
                        This visit awards {earningRule?.stamps_awarded || 1}{" "}
                        stamp(s).
                      </p>
                    )}

                    {earningType === "purchase" && (
                      <Input
                        label="Bill amount (NPR)"
                        type="number"
                        step="any"
                        min="1"
                        placeholder="1500"
                        hint="The minimum spend or matching tier is applied automatically."
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        disabled={isSubmitting}
                      />
                    )}

                    {earningType === "quantity" && (
                      <>
                        <Field label="Product" htmlFor="award-product-id">
                          <select
                            id="award-product-id"
                            value={selectedProductId}
                            onChange={(e) =>
                              setSelectedProductId(e.target.value)
                            }
                            disabled={isSubmitting}
                            className={fieldClass}
                          >
                            {productRules.map((pr) => (
                              <option key={pr.product_id} value={pr.product_id}>
                                {pr.product?.name ||
                                  `Product #${pr.product_id}`}{" "}
                                ({pr.quantity_required} for{" "}
                                {pr.reward?.title || "reward"})
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Input
                          label="Quantity purchased"
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          hint="Vouchers are issued automatically when the requirement is met."
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </>
                    )}
                  </>
                )}

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
                    disabled={isSubmitting || loadingProgram || !selectedCardId}
                  >
                    Award
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
