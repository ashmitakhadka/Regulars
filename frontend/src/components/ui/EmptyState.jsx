import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@fortawesome/free-solid-svg-icons";

export const EmptyState = ({
  icon = faInbox,
  title = "No items yet",
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center ${className}`.trim()}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blush-100 text-xl text-brand-800">
        <FontAwesomeIcon icon={icon} aria-hidden="true" />
      </div>

      <h3 className="font-display text-lg font-bold text-brand-900">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;

