import { Link } from "react-router-dom";
import { Spinner } from "./Spinner";

const variants = {
  primary:
    "bg-brand-800 text-white shadow-sm hover:bg-brand-900 active:bg-brand-950 focus-visible:outline-brand-800",
  secondary:
    "bg-blush-100 text-brand-900 hover:bg-blush-200 active:bg-blush-300 focus-visible:outline-brand-800",
  outline:
    "border-2 border-brand-800 text-brand-800 hover:bg-blush-100 active:bg-blush-200 focus-visible:outline-brand-800",
  ghost:
    "text-brand-900 hover:bg-blush-100 active:bg-blush-200 focus-visible:outline-brand-800",
  onDark:
    "bg-white text-brand-900 shadow-sm hover:bg-blush-100 active:bg-blush-200 focus-visible:outline-white",
  onDarkOutline:
    "border-2 border-white/80 text-white hover:bg-white/10 active:bg-white/20 focus-visible:outline-white",
};

const sizes = {
  sm: "min-h-[44px] px-4 py-2 text-sm",
  md: "min-h-[44px] px-5 py-2.5 text-sm sm:text-base",
  lg: "min-h-[48px] px-7 py-3.5 text-base font-bold",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  to,
  href,
  type = "button",
  className = "",
  onClick,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2";
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;
  const widthClass = fullWidth ? "w-full" : "";
  const combinedClasses = `${baseClasses} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const content = (
    <>
      {loading && <Spinner size="sm" />}
      {children}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} onClick={onClick} className={combinedClasses} {...props}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a href={href} onClick={onClick} className={combinedClasses} {...props}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={combinedClasses}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;

