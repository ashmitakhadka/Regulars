import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faUserPlus,
  faSearch,
  faStamp,
  faArrowRight,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { EnrollCustomerModal } from "../../components/merchant/customers/EnrollCustomerModal";
import { AwardStampsModal } from "../../components/merchant/customers/AwardStampsModal";
import { Button, EmptyState, ErrorState, Spinner } from "../../components/ui";
import { customerService } from "../../services/customerService";

const LOAD_ERROR =
  "Unable to load customer records. Please check your connection.";

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [awardingCustomer, setAwardingCustomer] = useState(null);

  const query = searchQuery.trim();

  const reload = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let ignore = false;

    customerService
      .getCustomers({ search: query || undefined })
      .then((res) => {
        if (ignore) return;
        setCustomers(res.data || []);
        setError(null);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load customers:", err);
        setError(err.response?.data?.message || LOAD_ERROR);
      })
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true;
    };
  }, [query, reloadKey]);

  const hasPrograms = (c) => c.programs?.length > 0;

  const AwardButton = ({ customer, label = "Award" }) =>
    hasPrograms(customer) && (
      <Button
        variant="primary"
        size="xs"
        onClick={() => setAwardingCustomer(customer)}
        title="Award stamps to customer"
      >
        <span>{label}</span>
      </Button>
    );

  const DetailsButton = ({ customer }) => (
    <Button
      to={`/merchant/customers/${customer.id}`}
      variant="secondary"
      size="xs"
    >
      Details
    </Button>
  );
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      <MerchantSidebar />

      <main className="w-full flex-1 p-5 sm:p-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[#23140C] sm:text-[28px]">
            Customers
          </h1>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsEnrollOpen(true)}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>Enroll </span>
          </Button>
        </header>

        {/* Search */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#23140C]/40"
            />
            <input
              type="text"
              placeholder="Search by name, code or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#F4F0EA] bg-white py-2 pl-10 pr-4 text-sm text-[#23140C] placeholder:text-[#23140C]/40 transition focus:border-[#23140C]/40 focus:outline-none focus:ring-2 focus:ring-[#23140C]/10"
            />
          </div>

          <p className="text-sm text-[#23140C]/60">
            {customers.length}{" "}
            {customers.length === 1 ? "customer" : "customers"}
          </p>
        </div>

        <section className="mt-6" aria-label="Customers directory">
          {loading && (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
              <Spinner size="md" />
              <p className="text-sm text-[#23140C]/60">Loading customers…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-red-50/40 p-6">
              <ErrorState
                title="Couldn't load customers"
                message={error}
                onRetry={reload}
              />
            </div>
          )}

          {!loading && !error && customers.length === 0 && !query && (
            <div className="rounded-xl bg-[#F4F0EA]/40 p-8">
              <EmptyState
                icon={faUsers}
                title="No customers yet"
                description="Customers appear here when they join with your QR code, or you can enroll one yourself."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEnrollOpen(true)}
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Enroll customer</span>
                  </Button>
                }
              />
            </div>
          )}

          {!loading && !error && customers.length === 0 && query && (
            <div className="rounded-xl bg-[#F4F0EA]/30 p-8">
              <EmptyState
                icon={faSearch}
                title="No matching customers"
                description={`Nothing found for "${query}". Check the code or phone number.`}
                action={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                }
              />
            </div>
          )}

          {!loading && !error && customers.length > 0 && (
            <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(35,20,12,0.06)]">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="text-sm font-semibold text-[#23140C]">
                    <tr>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3">Programs</th>
                      <th className="px-5 py-3">Streak</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#F4F0EA]">
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-[#F4F0EA]/25"
                      >
                        <td className="px-5 py-3.5">
                          <Link
                            to={`/merchant/customers/${c.id}`}
                            className="font-semibold text-xs text-[#23140C] hover:underline"
                          >
                            {c.name}
                          </Link>
                          <p className="font-mono text-xs text-[#23140C]/60">
                            {c.customer_code}
                          </p>
                        </td>

                        <td className="px-5 py-3.5 text-[#23140C]/80">
                          <p>
                            {c.phone || (
                              <span className="text-[#23140C]/40">
                                No phone
                              </span>
                            )}
                          </p>
                          <p className="max-w-[180px] truncate text-xs text-[#23140C]/60">
                            {c.email}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          {hasPrograms(c) ? (
                            <div className="flex max-w-xs flex-wrap items-center gap-1.5">
                              {c.programs.slice(0, 2).map((p) => (
                                <span
                                  key={p.stamp_card_id}
                                  className="max-w-[120px] truncate rounded-md  px-2 py-0.5 text-xs font-medium text-[#23140C]/80"
                                >
                                  {p.program_name}
                                </span>
                              ))}

                              {c.programs.length > 2 && (
                                <span
                                  title={c.programs
                                    .slice(2)
                                    .map((p) => p.program_name)
                                    .join(", ")}
                                  className="text-xs font-medium text-[#23140C]/60"
                                >
                                  +{c.programs.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#23140C]/40">
                              No active cards
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[#23140C]/80">
                            <FontAwesomeIcon
                              icon={faFire}
                              className="text-[#A51D27]"
                            />
                            {c.current_streak || 0} visits
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <AwardButton customer={c} />
                            <DetailsButton customer={c} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-[#F4F0EA] sm:hidden">
                {customers.map((c) => (
                  <div key={c.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/merchant/customers/${c.id}`}
                          className="font-semibold text-[#23140C]"
                        >
                          {c.name}
                        </Link>
                        <p className="font-mono text-xs text-[#23140C]/60">
                          {c.customer_code}
                        </p>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[#23140C]/80">
                        <FontAwesomeIcon
                          icon={faFire}
                          className="text-[#A51D27]"
                        />
                        {c.current_streak || 0} visits
                      </span>
                    </div>

                    {hasPrograms(c) && (
                      <div className="flex flex-wrap gap-1.5">
                        {c.programs.map((p) => (
                          <span
                            key={p.stamp_card_id}
                            className="rounded-md px-2 py-0.5 text-xs font-medium text-[#23140C]"
                          >
                            {p.program_name}: {p.stamps_earned}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-[#F4F0EA] pt-3">
                      <DetailsButton customer={c} />
                      <AwardButton customer={c} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <EnrollCustomerModal
          isOpen={isEnrollOpen}
          onClose={() => setIsEnrollOpen(false)}
          onEnrolled={reload}
        />

        <AwardStampsModal
          isOpen={Boolean(awardingCustomer)}
          customer={awardingCustomer}
          onClose={() => setAwardingCustomer(null)}
          onSuccess={reload}
        />
      </main>
    </div>
  );
};

export default Customers;
