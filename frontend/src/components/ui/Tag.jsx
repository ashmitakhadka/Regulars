const variants = {
  green: "bg-emerald-50 text-emerald-800 border-emerald-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-brand-900 border-red-200",
  cream: "bg-blush-100 text-brand-900 border-blush-200",
};

export const Tag = ({
  children,
  variant = "cream",
  className = "",
  ...props
}) => {
  const variantClass = variants[variant] || variants.cream;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

export default Tag;

