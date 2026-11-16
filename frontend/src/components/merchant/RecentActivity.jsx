const activities = [
  {
    name: "Sarah Johnson",
    initials: "SJ",
    action: "earned a new stamp",
    detail: "Coffee Loyalty Card",
    time: "5 minutes ago",
    status: "Stamp added",
  },
  {
    name: "Michael Smith",
    initials: "MS",
    action: "redeemed a voucher",
    detail: "Free Coffee",
    time: "25 minutes ago",
    status: "Redeemed",
  },
  {
    name: "Emma Wilson",
    initials: "EW",
    action: "earned a new stamp",
    detail: "Coffee Loyalty Card",
    time: "1 hour ago",
    status: "Stamp added",
  },
  {
    name: "David Brown",
    initials: "DB",
    action: "completed a reward card",
    detail: "Free Coffee Voucher",
    time: "2 hours ago",
    status: "Completed",
  },
];

export const RecentActivity = () => {
  return (
    <section className="mt-10 rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(35,20,12,0.06)] sm:p-7">
      <div className="mb-7">
        <h2 className="font-display text-lg font-bold text-[#23140C]">
          Recent Activity
        </h2>
        <p className="mt-1 text-sm text-[#23140C]/50">
          Latest customer activity in your loyalty program.
        </p>
      </div>

      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F4F0EA] text-sm font-bold text-[#23140C]">
                {activity.initials}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#23140C]">
                  {activity.name}
                </p>
                <p className="mt-1 text-sm text-[#23140C]/55">
                  {activity.action} · {activity.detail}
                </p>
                <p className="mt-1 text-xs text-[#23140C]/40 sm:hidden">
                  {activity.time}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
              <span className="rounded-full bg-[#F4F0EA] px-3 py-1.5 text-xs font-semibold text-[#23140C]">
                {activity.status}
              </span>
              <span className="hidden text-xs text-[#23140C]/40 sm:block">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
