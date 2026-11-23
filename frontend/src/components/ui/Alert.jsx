import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

const variants = {
  success: {
    container: "bg-emerald-50 text-emerald-900 border-emerald-200",
    icon: faCircleCheck,
    iconColor: "text-emerald-700",
    role: "status",
  },
  error: {
    container: "bg-red-50 text-brand-900 border-red-200",
    icon: faCircleExclamation,
    iconColor: "text-brand-800",
    role: "alert",
  },
  info: {
    container: "bg-blush-100 text-brand-900 border-blush-200",
    icon: faCircleInfo,
    iconColor: "text-brand-800",
    role: "status",
  },
};

/**
 * Reusable inline Alert component for status and error feedback.
 * - role="alert" for error variant
 * - role="status" for success and info variants
 */
export const Alert = ({
  variant = "info",
  children,
  className = "",
  ...props
}) => {
  const config = variants[variant] || variants.info;

  return (
    <div
      role={config.role}
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${config.container} ${className}`.trim()}
      {...props}
    >
      <FontAwesomeIcon
        icon={config.icon}
        className={`mt-0.5 text-base shrink-0 ${config.iconColor}`}
        aria-hidden="true"
      />
      <div className="flex-1 leading-normal">{children}</div>
    </div>
  );
};

export default Alert;
