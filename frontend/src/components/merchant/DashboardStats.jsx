import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faStamp,
  faTicket,
  faFire,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../services/api";

const statsConfig = [
  { label: "Total Customers", key: "total_customers", icon: faUsers },
  { label: "Stamps Collected", key: "stamps_collected", icon: faStamp },
  { label: "Vouchers Generated", key: "vouchers_generated", icon: faTicket },
  { label: "Active Streaks", key: "active_streaks", icon: faFire },
];

export const DashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/merchant/dashboard");
        setStats(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load dashboard statistics.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return (
      <p className="mt-10 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <section
      className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy={loading}
    >
      {statsConfig.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(35,20,12,0.06)]"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#23140C]/55">
              {stat.label}
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F4F0EA] text-[#23140C]">
              <FontAwesomeIcon icon={stat.icon} />
            </div>
          </div>

          <div className="mt-7">
            {loading ? (
              <div
                className="h-9 w-16 animate-pulse rounded-md bg-[#F4F0EA]"
                aria-label="Loading statistic"
              />
            ) : (
              <h2 className="font-display text-3xl font-bold text-[#23140C]">
                {Number(stats[stat.key]).toLocaleString()}
              </h2>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};
