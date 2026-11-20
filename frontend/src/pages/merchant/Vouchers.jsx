import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTicket,
  faCheck,
  faCircleExclamation,
  faClock,
  faUser,
  faRotateLeft,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { Button } from "../../components/ui";
import { voucherService } from "../../services/voucherService";

export const Vouchers = () => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'not_found' | 'expired' | 'already_redeemed' | 'other'
  const [lastRedeemed, setLastRedeemed] = useState(null);
  const [sessionRedemptions, setSessionRedemptions] = useState([]);

  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    // Automatically uppercase and strip whitespace
    const cleaned = e.target.value.toUpperCase().replace(/\s+/g, "");
    setCode(cleaned);
    if (errorMessage) {
      setErrorMessage(null);
      setErrorType(null);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setErrorMessage("Please enter a voucher code.");
      setErrorType("validation");
      return;
    }

    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);
    setErrorMessage(null);
    setErrorType(null);

    try {
      const response = await voucherService.redeemVoucher(trimmedCode);
      const voucherData = response.data;

      toast.success(response.message || "Voucher redeemed successfully!");
      setLastRedeemed(voucherData);
      setSessionRedemptions((prev) => [voucherData, ...prev]);
      setCode("");
    } catch (err) {
      console.error("Voucher redemption error:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || "";

      if (status === 404) {
        setErrorType("not_found");
        setErrorMessage("Voucher not found. Please verify the code and try again.");
      } else if (status === 422) {
        if (serverMsg.toLowerCase().includes("expired")) {
          setErrorType("expired");
          setErrorMessage("This voucher has expired and cannot be redeemed.");
        } else if (
          serverMsg.toLowerCase().includes("already") ||
          serverMsg.toLowerCase().includes("inactive")
        ) {
          setErrorType("already_redeemed");
          setErrorMessage("This voucher has already been redeemed or is inactive.");
        } else {
          setErrorType("other");
          setErrorMessage(serverMsg || "Unable to redeem voucher.");
        }
      } else {
        setErrorType("other");
        setErrorMessage(
          serverMsg || "A network error occurred. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setLastRedeemed(null);
    setCode("");
    setErrorMessage(null);
    setErrorType(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    try {
      return new Date(dateString).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatRewardType = (type, value) => {
    switch (type) {
      case "free_item":
        return "Free Item";
      case "discount_percentage":
        return `${value}% Off`;
      case "fixed_discount":
        return `Rs. ${value} Off`;
      default:
        return type || "Reward";
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header */}
        <header className="border-b border-[#F4F0EA] pb-6">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold uppercase tracking-wider text-[#23140C]/60">
              Merchant Portal
            </span>
            <span className="text-[#23140C]/30">•</span>
            <span className="text-[13px] font-semibold text-[#A51D27]">
              Checkout & Verification
            </span>
          </div>
          <h1 className="mt-1 font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
            Voucher Redemption
          </h1>
          <p className="mt-1 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
            Validate and redeem customer loyalty reward vouchers presented during checkout.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-5xl">
          {/* Left Column: Redemption Form / Result Card */}
          <section
            aria-label="Redemption Form"
            className="lg:col-span-7 space-y-6"
          >
            {/* If a voucher was just redeemed, display the clear success confirmation */}
            {lastRedeemed ? (
              <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(35,20,12,0.06)] border-t-4 border-emerald-500">
                <div className="bg-emerald-50/70 p-6 sm:p-7 text-center border-b border-emerald-100">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
                    <FontAwesomeIcon icon={faCheck} className="h-7 w-7" />
                  </div>
                  <h2 className="mt-3 font-display text-[22px] font-bold text-emerald-950">
                    Voucher Redeemed Successfully!
                  </h2>
                  <p className="mt-1 text-[13.5px] text-emerald-900 font-medium">
                    This reward has been verified and marked as redeemed.
                  </p>
                </div>

                <div className="p-6 sm:p-7 space-y-4">
                  {/* Voucher Summary Table */}
                  <div className="rounded-xl border border-[#F4F0EA] bg-[#F4F0EA]/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-2.5">
                      <span className="text-[13px] font-semibold text-[#23140C]/60">
                        Voucher Code
                      </span>
                      <span className="font-mono text-[16px] font-bold tracking-wide text-[#A51D27]">
                        {lastRedeemed.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-2.5">
                      <span className="text-[13px] font-semibold text-[#23140C]/60">
                        Reward Title
                      </span>
                      <span className="text-[15px] font-bold text-[#23140C]">
                        {lastRedeemed.reward_title}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-2.5">
                      <span className="text-[13px] font-semibold text-[#23140C]/60">
                        Benefit Type
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[12px] font-bold text-emerald-800">
                        {formatRewardType(
                          lastRedeemed.reward_type,
                          lastRedeemed.reward_value,
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#23140C]/60">
                        Redeemed Time
                      </span>
                      <span className="text-[13px] font-medium text-[#23140C]">
                        {formatDate(lastRedeemed.redeemed_at)}
                      </span>
                    </div>
                  </div>

                  {/* Action to scan/enter next */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="w-full justify-center"
                      onClick={handleResetForNext}
                    >
                      <FontAwesomeIcon icon={faRotateLeft} />
                      <span>Redeem Another Voucher</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Single-purpose Voucher Input Card */
              <div className="rounded-2xl bg-white p-6 sm:p-7 shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
                <div className="flex items-center gap-3 border-b border-[#F4F0EA] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#A51D27]">
                    <FontAwesomeIcon icon={faTicket} className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-[18px] font-bold text-[#23140C]">
                      Enter Voucher Code
                    </h2>
                    <p className="text-[13px] text-[#23140C]/70">
                      Type or scan the customer's 12-character alphanumeric code.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRedeem} className="mt-6 space-y-5" noValidate>
                  {/* Code Input */}
                  <div>
                    <label
                      htmlFor="voucher-code"
                      className="mb-1.5 block text-[14px] font-semibold text-[#23140C]"
                    >
                      Voucher Code <span className="text-[#A51D27]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        ref={inputRef}
                        id="voucher-code"
                        type="text"
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                        value={code}
                        onChange={handleInputChange}
                        placeholder="e.g. UOLCAEHC4EGK"
                        disabled={isSubmitting}
                        className={`w-full rounded-xl border bg-white px-4 py-3 text-[18px] font-mono font-bold tracking-wider text-[#23140C] placeholder:text-[#23140C]/30 placeholder:font-normal placeholder:tracking-normal transition focus:outline-none focus:ring-2 disabled:bg-[#F4F0EA]/50 uppercase ${
                          errorMessage
                            ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
                            : "border-[#F4F0EA] focus:border-[#A51D27] focus:ring-[#A51D27]/20"
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-[#23140C]/65">
                      Voucher codes are case-insensitive and formatted automatically.
                    </p>
                  </div>

                  {/* Error Notification Alert */}
                  {errorMessage && (
                    <div
                      className={`flex items-start gap-3 rounded-xl p-3.5 text-[13.5px] border ${
                        errorType === "expired"
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : errorType === "already_redeemed"
                          ? "border-blue-200 bg-blue-50 text-blue-900"
                          : "border-red-200 bg-red-50 text-red-900"
                      }`}
                      role="alert"
                    >
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className={`mt-0.5 text-[16px] shrink-0 ${
                          errorType === "expired"
                            ? "text-amber-600"
                            : errorType === "already_redeemed"
                            ? "text-blue-600"
                            : "text-red-600"
                        }`}
                      />
                      <div>
                        <p className="font-bold">
                          {errorType === "expired"
                            ? "Expired Voucher"
                            : errorType === "already_redeemed"
                            ? "Already Redeemed"
                            : errorType === "not_found"
                            ? "Invalid Voucher Code"
                            : "Redemption Error"}
                        </p>
                        <p className="mt-0.5 leading-snug">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full justify-center text-[15px] py-3"
                      loading={isSubmitting}
                      disabled={isSubmitting || !code.trim()}
                    >
                      <FontAwesomeIcon icon={faCheck} />
                      <span>{isSubmitting ? "Verifying..." : "Redeem Voucher"}</span>
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </section>

          {/* Right Column: Information & Current Session History */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Quick Checkout Guide Card */}
            <div className="rounded-2xl bg-[#F4F0EA]/60 p-6 space-y-3">
              <h3 className="font-display text-[16px] font-bold text-[#23140C] flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} className="text-[#A51D27]" />
                <span>Cashier Checklist</span>
              </h3>
              <ul className="space-y-2 text-[13px] text-[#23140C]/80 leading-relaxed list-disc list-inside">
                <li>Ask customer to show their digital voucher code from their wallet.</li>
                <li>Verify that the customer has not yet received the item/discount.</li>
                <li>Redeem the voucher immediately before completing billing.</li>
                <li>Once redeemed, a voucher cannot be reused or reactivated.</li>
              </ul>
            </div>

            {/* Session Redemption History */}
            <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-3">
                <h3 className="font-display text-[15px] font-bold text-[#23140C] flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-[#A51D27] text-xs" />
                  <span>Session Redemptions</span>
                </h3>
                <span className="rounded-full bg-[#A51D27]/10 px-2 py-0.5 text-xs font-bold text-[#A51D27]">
                  {sessionRedemptions.length}
                </span>
              </div>

              {sessionRedemptions.length > 0 ? (
                <div className="divide-y divide-[#F4F0EA] max-h-[300px] overflow-y-auto pr-1">
                  {sessionRedemptions.map((item, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[13.5px] text-[#23140C]">
                          {item.reward_title}
                        </span>
                        <span className="text-[11.5px] text-[#23140C]/50 font-medium">
                          {formatDate(item.redeemed_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-mono text-[#A51D27] font-semibold">
                          {item.code}
                        </span>
                        <span className="text-[#23140C]/60 flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                          <span>Cust #{item.customer_id}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] italic text-[#23140C]/55 py-2">
                  No vouchers redeemed during this session yet.
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Vouchers;
