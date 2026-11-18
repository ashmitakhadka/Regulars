import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Card } from "./Card";
import { Button } from "./Button";

export const OptionCard = ({
  icon,
  title,
  text,
  buttonLabel,
  to,
  variant = "primary",
  className = "",
}) => {
  return (
    <Card
      className={`flex flex-col justify-between h-full text-left p-6 sm:p-8 rounded-2xl ${className}`.trim()}
    >
      <div>
        {icon && (
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blush-100 text-ink">
            <FontAwesomeIcon icon={icon} className="text-xl" />
          </div>
        )}
        <h3 className="font-display text-xl sm:text-2xl font-bold text-brand-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-ink-soft leading-relaxed mb-6">
          {text}
        </p>
      </div>

      <div>
        <Button to={to} variant={variant} fullWidth size="md">
          {buttonLabel}
        </Button>
      </div>
    </Card>
  );
};

export default OptionCard;
