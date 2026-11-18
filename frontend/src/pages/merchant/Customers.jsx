import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserPlus,
  faSearch,
  faRotateRight,
  faStamp,
  faArrowRight,
  faFire,
  faIdCard,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { EnrollCustomerModal } from "../../components/merchant/customers/EnrollCustomerModal";
import { AwardStampsModal } from "../../components/merchant/customers/AwardStampsModal";
import { Button, EmptyState, ErrorState, Spinner } from "../../components/ui";
import { customerService } from "../../services/customerService";

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [awardingCustomer, setAwardingCustomer] = useState(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerService.getCustomers({
        search: searchQuery.trim() || undefined,
      });
      setCustomers(response.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load customer records. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    customerService
      .getCustomers({ search: searchQuery.trim() || undefined })
      .then((res) => {
        if (!ignore) {
          setCustomers(res.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load customers:", err);
          setError(
            err.response?.data?.message ||
              "Unable to load customer records. Please check your connection.",
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [searchQuery]);

  const handleEnrolled = () => {
    loadCustomers();
  };

  const handleAwardSuccess = () => {
    loadCustomers();
  };

  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Merchant Sidebar */}
      <MerchantSidebar />

      {/* Main Content Area */}
      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-[#F4F0EA] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold uppercase tracking-wider text-[#23140C]/60">
                Merchant Portal
              </span>
              <span className="text-[#23140C]/30">•</span>
              <span className="text-[13px] font-semibold text-[#A51D27]">
                Customer Management
              </span>
            </div>
            <h1 className="mt-1 font-display text-[26px] sm:text-[28px] font-bold tracking-tight text-[#23140C]">
              Customers
            </h1>
            <p className="mt-1 text-[13.5px] sm:text-[14px] text-[#23140C]/75">
              View customer loyalty progress, streaks, and award visit, purchase or product stamps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadCustomers}
              disabled={loading}
              title="Refresh customers"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={loading ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEnrollOpen(true)}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              <span>Enroll Customer</span>
            </Button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#F4F0EA] pb-5">
          <div className="relative w-full max-w-md">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#23140C]/40"
            />
            <input
              type="text"
              placeholder="Search by name, customer code (e.g. RG-TEST), or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#F4F0EA] bg-white pl-10 pr-4 py-2 text-[14px] text-[#23140C] placeholder:text-[#23140C]/40 transition focus:border-[#A51D27] focus:outline-none focus:ring-2 focus:ring-[#A51D27]/20"
            />
          </div>

          <p className="text-[13.5px] text-[#23140C]/75 font-semibold">
            {customers.length} Enrolled Customer(s)
          </p>
        </div>

        {/* Content States */}
        <section className="mt-8" aria-label="Customers directory">
          {/* 1. Loading State */}
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl bg-[#F4F0EA]/40 p-8">
              <Spinner size="md" />
              <p className="text-[14px] font-medium text-[#23140C]/75">
                Loading your customers...
              </p>
            </div>
          )}

          {/* 2. Error State */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <ErrorState
                title="Could not load customers"
                message={error}
                onRetry={loadCustomers}
              />
            </div>
          )}

          {/* 3. Empty State (Zero Customers) */}
          {!loading && !error && customers.length === 0 && !searchQuery.trim() && (
            <div className="rounded-2xl bg-[#F4F0EA]/40 p-8">
              <EmptyState
                icon={faUsers}
                title="No customers enrolled yet"
                description="Customers will appear here when they join via your QR code, or you can manually enroll an existing customer."
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsEnrollOpen(true)}
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Enroll First Customer</span>
                  </Button>
                }
              />
            </div>
          )}

          {/* 4. Empty Search State */}
          {!loading && !error && customers.length === 0 && searchQuery.trim() && (
            <div className="rounded-2xl bg-[#F4F0EA]/30 p-8">
              <EmptyState
                icon={faSearch}
                title="No customers match your search"
                description={`No customers found for "${searchQuery}". Check the code or phone number.`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                }
              />
            </div>
          )}

          {/* 5. Customers List (Table on sm+, Cards on mobile) */}
          {!loading && !error && customers.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="border-b border-[#F4F0EA] bg-[#F4F0EA]/60 text-[13px] font-bold uppercase tracking-wider text-[#23140C]/70">
                    <tr>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Contact</th>
                      <th className="py-3.5 px-6">Enrolled Programs</th>
                      <th className="py-3.5 px-6">Streak</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F0EA]">
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-[#F4F0EA]/25 transition-colors"
                      >
                        {/* Name & Code */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-[#23140C] text-[15px]">
                            <Link
                              to={`/merchant/customers/${c.id}`}
                              className="hover:text-[#A51D27] transition"
                            >
                              {c.name}
                            </Link>
                          </div>
                          <span className="mt-0.5 inline-flex items-center gap-1 font-mono text-[12px] text-[#A51D27] font-semibold">
                            <FontAwesomeIcon icon={faIdCard} className="text-xs" />
                            {c.customer_code}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-6 text-[13.5px] text-[#23140C]/80">
                          {c.phone ? (
                            <p className="flex items-center gap-1.5 font-medium">
                              <FontAwesomeIcon
                                icon={faPhone}
                                className="text-xs text-[#23140C]/50"
                              />
                              <span>{c.phone}</span>
                            </p>
                          ) : (
                            <p className="italic text-[#23140C]/50">No phone</p>
                          )}
                          <p className="text-[12.5px] text-[#23140C]/60 truncate max-w-[180px]">
                            {c.email}
                          </p>
                        </td>

                        {/* Enrolled Programs */}
                        <td className="py-4 px-6">
                          {c.programs && c.programs.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {c.programs.map((p) => (
                                <span
                                  key={p.stamp_card_id}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F0EA] px-2.5 py-1 text-[12.5px] font-semibold text-[#23140C]"
                                >
                                  <span>{p.program_name}</span>
                                  <span className="rounded-full bg-[#A51D27] text-white px-1.5 py-0.2 text-[10px] font-bold">
                                    {p.stamps_earned} ⭐️
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[13px] italic text-[#23140C]/50">
                              No active cards
                            </span>
                          )}
                        </td>

                        {/* Streak */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-1.5 font-bold text-[#A51D27] text-[13.5px]">
                            <FontAwesomeIcon icon={faFire} />
                            <span>{c.current_streak || 0} visits</span>
                          </div>
                          <p className="text-[12px] text-[#23140C]/60">
                            Longest: {c.longest_streak || 0}
                          </p>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.programs && c.programs.length > 0 && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setAwardingCustomer(c)}
                                title="Award stamps to customer"
                              >
                                <FontAwesomeIcon icon={faStamp} />
                                <span>Award</span>
                              </Button>
                            )}

                            <Link
                              to={`/merchant/customers/${c.id}`}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-[#23140C]/75 hover:bg-[#F4F0EA] hover:text-[#23140C] transition"
                            >
                              <span>Details</span>
                              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden divide-y divide-[#F4F0EA]">
                {customers.map((c) => (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/merchant/customers/${c.id}`}
                          className="font-bold text-[#23140C] text-[15px]"
                        >
                          {c.name}
                        </Link>
                        <p className="font-mono text-xs text-[#A51D27] font-semibold">
                          {c.customer_code}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 font-bold text-[#A51D27] text-[13px]">
                          <FontAwesomeIcon icon={faFire} />
                          <span>{c.current_streak || 0} visits</span>
                        </span>
                      </div>
                    </div>

                    {c.programs && c.programs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.programs.map((p) => (
                          <span
                            key={p.stamp_card_id}
                            className="rounded-lg bg-[#F4F0EA] px-2 py-0.5 text-xs font-semibold text-[#23140C]"
                          >
                            {p.program_name}: <strong>{p.stamps_earned}★</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-[#F4F0EA] pt-2.5">
                      <Link
                        to={`/merchant/customers/${c.id}`}
                        className="text-xs font-semibold text-[#23140C]/70 hover:underline"
                      >
                        View Activity
                      </Link>

                      {c.programs && c.programs.length > 0 && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setAwardingCustomer(c)}
                        >
                          <FontAwesomeIcon icon={faStamp} />
                          <span>Award Stamps</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Enroll Customer Modal */}
        <EnrollCustomerModal
          isOpen={isEnrollOpen}
          onClose={() => setIsEnrollOpen(false)}
          onEnrolled={handleEnrolled}
        />

        {/* Award Stamps Modal */}
        <AwardStampsModal
          isOpen={Boolean(awardingCustomer)}
          customer={awardingCustomer}
          onClose={() => setAwardingCustomer(null)}
          onSuccess={handleAwardSuccess}
        />
      </main>
    </div>
  );
};

export default Customers;
