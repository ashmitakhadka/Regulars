import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";

export const ErrorState = ({
  title = "Something went wrong",
  message = "We couldn't load this information. Please try again.",
  onRetry,
  action,
  className = "",
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`.trim()}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-xl text-brand-800">
        <FontAwesomeIcon icon={faCircleExclamation} aria-hidden="true" />
      </div>

      <h3 className="font-display text-lg font-bold text-brand-900">
        {title}
      </h3>

      {message && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
          {message}
        </p>
      )}

      {onRetry && !action && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default ErrorState;

