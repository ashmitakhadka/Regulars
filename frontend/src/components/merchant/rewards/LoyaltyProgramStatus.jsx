export const LoyaltyProgramStatus = ({ status, className = "" }) => {
  const normalizedStatus = (status || "inactive").toLowerCase();

  const configs = {
    active: {
      label: "Active",
      classes: "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold",
      dot: "bg-emerald-600",
    },
    inactive: {
      label: "Inactive",
      classes: "bg-amber-50 text-amber-900 border-amber-300 font-semibold",
      dot: "bg-amber-600",
    },
    archived: {
      label: "Archived",
      classes: "bg-neutral-100 text-neutral-800 border-neutral-300 font-semibold",
      dot: "bg-neutral-500",
    },
  };

  const config = configs[normalizedStatus] || configs.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] leading-none capitalize ${config.classes} ${className}`.trim()}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default LoyaltyProgramStatus;

