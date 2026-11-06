import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire } from "@fortawesome/free-solid-svg-icons";

const sizes = {
  sm: {
    text: "text-xl",
    icon: "text-lg",
    gap: "gap-1.5",
  },
  md: {
    text: "text-2xl",
    icon: "text-xl",
    gap: "gap-2",
  },
  lg: {
    text: "text-3xl sm:text-4xl",
    icon: "text-2xl sm:text-3xl",
    gap: "gap-2.5",
  },
};

export const Logo = ({
  size = "md",
  light = false,
  to = "/",
  className = "",
  onClick,
}) => {
  const currentSize = sizes[size] || sizes.md;
  const textColor = light ? "text-white" : "text-brand-900";
  const iconColor = light ? "text-brand-500" : "text-brand-800";
  const dotColor = light ? "text-brand-500" : "text-brand-800";

  const content = (
    <span
      className={`inline-flex shrink-0 items-center ${currentSize.gap} ${className}`}
    >
      <FontAwesomeIcon
        icon={faFire}
        className={`${currentSize.icon} ${iconColor} transition-transform group-hover:scale-105`}
        aria-hidden="true"
      />
      <span
        className={`font-display ${currentSize.text} font-extrabold tracking-tight ${textColor}`}
      >
        Regulars<span className={dotColor}>.</span>
      </span>
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="group inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-800"
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;

