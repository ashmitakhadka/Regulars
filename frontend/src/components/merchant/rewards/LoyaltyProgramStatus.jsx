export const LoyaltyProgramStatus = ({ status, className = "" }) => {
  const normalizedStatus = (status || "inactive").toLowerCase();

  const configs = {
    active: {
      label: "Active",
      classes: "bg-emerald-50 text-emerald-800",
    },
    inactive: {
      label: "Inactive",
      classes: "bg-[#F4F0EA] text-[#23140C]",
    },
    archived: {
      label: "Archived",
      classes: "bg-neutral-100 text-neutral-700",
    },
  };

  const config = configs[normalizedStatus] || configs.inactive;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12.5px] font-semibold leading-none ${config.classes} ${className}`.trim()}
    >
      {config.label}
    </span>
  );
};

export default LoyaltyProgramStatus;
