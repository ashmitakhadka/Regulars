import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";

import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { AwardStampsModal } from "../../components/merchant/customers/AwardStampsModal";
import { BackButton, Button, ErrorState, Spinner } from "../../components/ui";
import { customerService } from "../../services/customerService";

const LIST_PATH = "/merchant/customers";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const errorMessage = (err) =>
  err.response?.status === 404
    ? "Customer not found or not enrolled in your loyalty programs."
    : err.response?.data?.message ||
      "Unable to load customer information. Please try again.";

const ACTIVITY_STYLES = {
  voucher_issued: { label: "Issued" },
  voucher_redeemed: { label: "Redeemed" },
  default: { label: "Voucher" },
};

const Card = ({ className = "", children }) => (
  <section
    className={`rounded-xl bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(35,20,12,0.05)] ${className}`}
  >
    {children}
  </section>
);

export const CustomerDetails = () => {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activityFilter, setActivityFilter] = useState("all");
  const [visibleActivityCount, setVisibleActivityCount] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [awardingCardId, setAwardingCardId] = useState(null);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (!id) return;

    let ignore = false;

    Promise.all([
      customerService.getCustomerDetails(id),
      customerService.getCustomerActivity(id),
    ])
      .then(([detailsRes, activityRes]) => {
        if (ignore) return;

        setCustomer(detailsRes.data);
        setActivities(activityRes.data?.activities || []);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;

        console.error("Failed to load customer details:", err);
        setError(errorMessage(err));
      })
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const openAward = (cardId = null) => {
    setAwardingCardId(cardId);
    setIsAwardModalOpen(true);
  };

  const hasPrograms = customer?.programs?.length > 0;

  const filteredActivities = activities.filter((act) => {
    if (activityFilter === "stamps") return act.type === "stamp_earned";
    if (activityFilter === "vouchers") return act.type !== "stamp_earned";
    return true;
  });

  const visibleActivities = filteredActivities.slice(0, visibleActivityCount);

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 bg-white p-4 sm:p-7 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-7">
          {loading && (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-[#23140C]/60">Loading customer…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-white p-8 shadow-[0_2px_12px_rgba(35,20,12,0.05)]">
              <ErrorState
                title="Customer not available"
                message={error}
                action={
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={reload}>
                      Try again
                    </Button>
                    <Button to={LIST_PATH} variant="primary" size="sm">
                      Back to customers
                    </Button>
                  </div>
                }
              />
            </div>
          )}

          {!loading && !error && customer && (
            <div className="space-y-7">
              {/* Customer Header */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 -ml-20">
                  <div className="flex items-center gap-3">
                    <BackButton size="xs" to={LIST_PATH} iconOnly />

                    <h1 className="font-display text-xl font-bold text-[#23140C] sm:text-2xl">
                      {customer.name}
                    </h1>
                  </div>

                  {customer.phone && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#23140C]/65">
                      <FontAwesomeIcon
                        icon={faPhone}
                        className="text-[#23140C]/40"
                      />
                      {customer.phone}
                    </span>
                  )}

                  {customer.email && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#23140C]/65">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="text-[#23140C]/40"
                      />
                      {customer.email}
                    </span>
                  )}
                </div>

                {hasPrograms && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openAward()}
                  >
                    Award stamps
                  </Button>
                )}
              </div>
              {/* Enrolled Loyalty Programs */}
              <Card>
                <div className="mb-5">
                  <h2 className="font-display text-base font-bold text-[#23140C]">
                    Enrolled loyalty programs
                  </h2>
                </div>

                {hasPrograms ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {customer.programs.map((card) => (
                      <button
                        key={card.stamp_card_id}
                        type="button"
                        onClick={() => openAward(card.stamp_card_id)}
                        className="flex items-center justify-between gap-4 rounded-lg bg-[#F4F0EC]/50 p-4 text-left transition-colors hover:bg-[#F4F0EA]"
                      >
                        <div className="min-w-0 space-y-1">
                          <h3 className="truncate text-sm font-semibold text-[#23140C]">
                            {card.program_name}
                          </h3>

                          <p className="text-xs text-[#23140C]/55">
                            Joined {formatDate(card.started_at)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-lg font-bold text-[#A51D27]">
                            {card.stamps_earned}
                          </span>
                          <span className="block text-[11px] font-medium text-[#23140C]/45">
                            stamps
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-[#23140C]/60">
                    This customer is not enrolled in any loyalty program.
                  </p>
                )}
              </Card>

              {/* Recent Activity */}
              <Card>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-md font-bold text-[#23140C]">
                      Recent activity
                    </h2>
                    <p className="mt-1 text-sm text-[#23140C]/50">
                      Customer's stamps and voucher history.
                    </p>
                  </div>

                  {activities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: "all", label: "All" },
                        { id: "stamps", label: "Stamps" },
                        { id: "vouchers", label: "Vouchers" },
                      ].map((tab) => (
                        <Button
                          key={tab.id}
                          type="button"
                          variant="soft"
                          size="xs"
                          onClick={() => {
                            setActivityFilter(tab.id);
                            setVisibleActivityCount(5);
                          }}
                          className={
                            activityFilter === tab.id
                              ? "bg-[#A51D27]/10 text-[#A51D27]"
                              : ""
                          }
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {filteredActivities.length > 0 ? (
                  <>
                    <ul className="divide-y divide-[#23140C]/[0.06]">
                      {visibleActivities.map((act, idx) => {
                        const style =
                          ACTIVITY_STYLES[act.type] || ACTIVITY_STYLES.default;

                        const subDetails = [
                          act.program_name,
                          act.voucher_code && `Code: ${act.voucher_code}`,
                          act.redeemed_by && `By ${act.redeemed_by}`,
                        ].filter(Boolean);

                        return (
                          <li
                            key={
                              act.id ?? `${act.type}-${act.occurred_at}-${idx}`
                            }
                            className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#23140C]">
                                {act.description}
                              </p>

                              {subDetails.length > 0 && (
                                <p className="mt-1 truncate text-xs text-[#23140C]/50">
                                  {subDetails.join(" · ")}
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 text-right">
                              {act.type === "stamp_earned" ? (
                                <span className="text-sm font-bold text-[#A51D27]">
                                  +{act.stamps_awarded}
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-[#23140C]/60">
                                  {style.label}
                                </span>
                              )}

                              <p className="mt-1 text-[11px] text-[#23140C]/45">
                                {formatDate(act.occurred_at)}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* View More */}
                    {filteredActivities.length > visibleActivityCount && (
                      <div className="mt-5 flex w-full justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() =>
                            setVisibleActivityCount((prev) => prev + 5)
                          }
                          className="!bg-[#F4F0EA] !text-[#A51D27] hover:!bg-[#EDE5DC]"
                        >
                          View more
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="py-5 text-center text-sm text-[#23140C]/55">
                    {activities.length > 0
                      ? "No matching activity found."
                      : "No activity yet."}
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Award Stamps Modal */}
          {customer && (
            <AwardStampsModal
              isOpen={isAwardModalOpen}
              customer={customer}
              initialCardId={awardingCardId}
              onClose={() => setIsAwardModalOpen(false)}
              onSuccess={reload}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerDetails;
