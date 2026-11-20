import { useEffect, useState } from "react";
import customerService from "../../services/customerService";

// Get initials from customer name
const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

// Convert timestamp into relative time
const getRelativeTime = (date) => {
  if (!date) return "";

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (Number.isNaN(seconds)) return "";

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return new Date(date).toLocaleDateString();
};

export const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await customerService.getAllCustomersRecentActivity();

        setActivities(response.data || []);
      } catch (err) {
        console.error("Failed to fetch recent activity:", err);
        setError("Unable to load recent activity.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, []);

  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(35,20,12,0.06)] sm:p-7">
      <h2 className="font-display text-lg font-bold text-[#23140C]">
        Recent Activity
      </h2>

      <p className="mt-1 text-sm text-[#23140C]/70">
        Latest customer activity in your loyalty program.
      </p>

      {loading ? (
        <p className="mt-6 py-8 text-center text-sm text-[#23140C]/60">
          Loading recent activity...
        </p>
      ) : error ? (
        <p className="mt-6 rounded-xl bg-[#F4F0EA]/60 px-4 py-8 text-center text-sm text-red-600">
          {error}
        </p>
      ) : activities.length === 0 ? (
        <p className="mt-6 rounded-xl bg-[#F4F0EA]/60 px-4 py-8 text-center text-sm text-[#23140C]/70">
          No activity yet. New stamps and redemptions will show up here.
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {activities.map((activity) => (
            <li key={activity.id} className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4F0EA] text-sm font-bold text-[#23140C]"
                aria-hidden="true"
              >
                {getInitials(activity.customer_name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#23140C]">
                  <span className="font-semibold">
                    {activity.customer_name}
                  </span>{" "}
                  {activity.action}
                </p>

                <p className="mt-0.5 truncate text-sm text-[#23140C]/70">
                  {activity.detail}
                </p>
              </div>

              <span className="shrink-0 text-xs text-[#23140C]/60">
                {getRelativeTime(activity.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default RecentActivity;
