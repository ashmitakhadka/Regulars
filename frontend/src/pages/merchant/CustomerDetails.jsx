import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faPhone,
  faEnvelope,
  faIdCard,
  faFire,
  faStamp,
  faTicket,
  faCheckCircle,
  faRotateRight,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { AwardStampsModal } from "../../components/merchant/customers/AwardStampsModal";
import { Button, ErrorState, Spinner } from "../../components/ui";
import { customerService } from "../../services/customerService";

export const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Award modal state
  const [awardingCardId, setAwardingCardId] = useState(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const [detailsRes, activityRes] = await Promise.all([
        customerService.getCustomerDetails(id),
        customerService.getCustomerActivity(id),
      ]);

      setCustomer(detailsRes.data);
      setActivities(activityRes.data?.activities || []);
    } catch (err) {
      console.error("Failed to load customer details:", err);
      if (err.response?.status === 404) {
        setError("Customer not found or not enrolled in your loyalty programs.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load customer information. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    if (!id) return;

    Promise.all([
      customerService.getCustomerDetails(id),
      customerService.getCustomerActivity(id),
    ])
      .then(([detailsRes, activityRes]) => {
        if (!ignore) {
          setCustomer(detailsRes.data);
          setActivities(activityRes.data?.activities || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load customer details:", err);
          if (err.response?.status === 404) {
            setError("Customer not found or not enrolled in your loyalty programs.");
          } else {
            setError(
              err.response?.data?.message ||
                "Unable to load customer information. Please try again.",
            );
          }
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const handleOpenAward = (cardId = null) => {
    setAwardingCardId(cardId);
    setIsAwardModalOpen(true);
  };

  const handleAwardSuccess = () => {
    loadData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/merchant/customers"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-[#23140C]/75 hover:text-[#A51D27] transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Customers</span>
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
            <Spinner size="md" />
            <p className="text-[14px] font-medium text-[#23140C]/75">
              Loading customer record...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
            <ErrorState
              title="Customer Not Found"
              message={error}
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={loadData}>
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>Try Again</span>
                  </Button>
                  <Button to="/merchant/customers" variant="primary" size="sm">
                    Return to Customer List
                  </Button>
                </div>
              }
            />
          </div>
        )}

        {/* Success View */}
        {!loading && !error && customer && (
          <div className="space-y-6">
            {/* 1. Customer Overview Banner */}
            <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F4F0EA] text-[#23140C]">
                    <FontAwesomeIcon icon={faUser} className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-display text-[24px] sm:text-[26px] font-bold text-[#23140C]">
                        {customer.name}
                      </h1>
                      <span className="rounded-full bg-[#A51D27]/10 px-2.5 py-0.5 text-xs font-bold text-[#A51D27]">
                        {customer.customer_code}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[13.5px] text-[#23140C]/75">
                      {customer.phone && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <FontAwesomeIcon icon={faPhone} className="text-[#23140C]/50 text-xs" />
                          <span>{customer.phone}</span>
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <FontAwesomeIcon icon={faEnvelope} className="text-[#23140C]/50 text-xs" />
                          <span>{customer.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl bg-[#F4F0EA]/70 p-3.5">
                  <div className="flex items-center gap-2 font-bold text-[#A51D27]">
                    <FontAwesomeIcon icon={faFire} className="text-lg" />
                    <div>
                      <p className="text-[15px] font-bold leading-none">
                        {customer.current_streak || 0} visits
                      </p>
                      <p className="text-[11px] font-medium text-[#23140C]/60">
                        Current Streak
                      </p>
                    </div>
                  </div>

                  <div className="h-8 w-px bg-[#23140C]/10" />

                  <div>
                    <p className="text-[15px] font-bold text-[#23140C] leading-none">
                      {customer.longest_streak || 0}
                    </p>
                    <p className="text-[11px] font-medium text-[#23140C]/60">
                      Best Streak
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Active Stamp Cards */}
            <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#F4F0EA] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
                    <FontAwesomeIcon icon={faIdCard} className="h-4 w-4 text-[#A51D27]" />
                  </div>
                  <div>
                    <h2 className="font-display text-[17px] font-bold text-[#23140C]">
                      Enrolled Loyalty Programs
                    </h2>
                    <p className="text-[13px] text-[#23140C]/75">
                      Active digital stamp cards for this customer
                    </p>
                  </div>
                </div>

                {customer.programs && customer.programs.length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenAward()}
                  >
                    <FontAwesomeIcon icon={faStamp} />
                    <span>Award Stamps</span>
                  </Button>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {customer.programs && customer.programs.length > 0 ? (
                  customer.programs.map((card) => (
                    <div
                      key={card.stamp_card_id}
                      className="flex flex-col justify-between rounded-xl border border-[#F4F0EA] bg-[#F4F0EA]/40 p-4 space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[#23140C] text-[15px]">
                            {card.program_name}
                          </h3>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                            {card.status}
                          </span>
                        </div>

                        <p className="mt-2 text-[20px] font-bold text-[#A51D27]">
                          {card.stamps_earned}{" "}
                          <span className="text-[13px] font-semibold text-[#23140C]/75">
                            stamps earned
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#F4F0EA] pt-2.5">
                        <span className="text-[11.5px] text-[#23140C]/60">
                          Started: {formatDate(card.started_at)}
                        </span>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenAward(card.stamp_card_id)}
                        >
                          <FontAwesomeIcon icon={faStamp} className="text-xs" />
                          <span>Award</span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13.5px] italic text-[#23140C]/60">
                    No active loyalty programs for this customer.
                  </p>
                )}
              </div>
            </section>

            {/* 3. Chronological Customer Activity History */}
            <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(35,20,12,0.06)] sm:p-7">
              <div className="flex items-center gap-2.5 border-b border-[#F4F0EA] pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F4F0EA] text-[#23140C]">
                  <FontAwesomeIcon icon={faClock} className="h-4 w-4 text-[#A51D27]" />
                </div>
                <div>
                  <h2 className="font-display text-[17px] font-bold text-[#23140C]">
                    Customer Activity Log
                  </h2>
                  <p className="text-[13px] text-[#23140C]/75">
                    Chronological history of stamps earned and reward vouchers
                  </p>
                </div>
              </div>

              {activities.length > 0 ? (
                <div className="mt-5 divide-y divide-[#F4F0EA]">
                  {activities.map((act, idx) => {
                    const isStamp = act.type === "stamp_earned";
                    const isVoucherIssue = act.type === "voucher_issued";

                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                              isStamp
                                ? "bg-red-100 text-[#A51D27]"
                                : isVoucherIssue
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={
                                isStamp
                                  ? faStamp
                                  : isVoucherIssue
                                  ? faTicket
                                  : faCheckCircle
                              }
                            />
                          </div>

                          <div>
                            <p className="text-[14px] font-bold text-[#23140C]">
                              {act.description}
                            </p>
                            <p className="text-[12.5px] text-[#23140C]/60">
                              {act.program_name && (
                                <span>Program: {act.program_name} • </span>
                              )}
                              {act.voucher_code && (
                                <span className="font-mono text-[#A51D27] font-semibold">
                                  Code: {act.voucher_code} •{" "}
                                </span>
                              )}
                              {act.redeemed_by && (
                                <span>Redeemed by {act.redeemed_by} • </span>
                              )}
                              <span>{formatDate(act.occurred_at)}</span>
                            </p>
                          </div>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              isStamp
                                ? "bg-red-50 text-[#A51D27] border border-red-200"
                                : isVoucherIssue
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {isStamp
                              ? `+${act.stamps_awarded} Stamp`
                              : isVoucherIssue
                              ? "Voucher Issued"
                              : "Redeemed"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 text-[13.5px] italic text-[#23140C]/60 py-4 text-center">
                  No activity recorded for this customer yet.
                </p>
              )}
            </section>
          </div>
        )}

        {/* Award Stamps Modal */}
        {customer && (
          <AwardStampsModal
            isOpen={isAwardModalOpen}
            customer={customer}
            initialCardId={awardingCardId}
            onClose={() => setIsAwardModalOpen(false)}
            onSuccess={handleAwardSuccess}
          />
        )}
      </main>
    </div>
  );
};

export default CustomerDetails;
