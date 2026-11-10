import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faStamp,
  faTicket,
  faFire,
} from "@fortawesome/free-solid-svg-icons";

const stats = [
  { label: "Total Customers", value: "248", icon: faUsers },
  { label: "Stamps Collected", value: "1,284", icon: faStamp },
  { label: "Vouchers Generated", value: "86", icon: faTicket },
  { label: "Active Streaks", value: "42", icon: faFire },
];

export const DashboardStats = () => {
  return (
    <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
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

          <h2 className="mt-7 font-display text-3xl font-bold text-[#23140C]">
            {stat.value}
          </h2>
        </div>
      ))}
    </section>
  );
};
