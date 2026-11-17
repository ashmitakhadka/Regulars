export const RewardProgramStatus = ({ status, className = "" }) => {
  const normalizedStatus = (status || "inactive").toLowerCase();

  const configs = {
    active: {
      label: "Active",
      classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dot: "bg-emerald-500",
    },
    inactive: {
      label: "Inactive",
      classes: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500",
    },
    archived: {
      label: "Archived",
      classes: "bg-neutral-100 text-neutral-600 border-neutral-200",
      dot: "bg-neutral-400",
    },
  };

  const config = configs[normalizedStatus] || configs.inactive;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${config.classes} ${className}`.trim()}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  );
};

export default RewardProgramStatus;

