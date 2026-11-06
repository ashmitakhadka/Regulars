import { useId } from "react";

export const Input = ({
  label,
  hint,
  error,
  id,
  className = "",
  disabled = false,
  required = false,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-semibold text-ink"
        >
          {label}
          {required && <span className="ml-1 text-brand-800">*</span>}
        </label>
      )}

      <input
        id={inputId}
        disabled={disabled}
        required={required}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={`w-full min-h-[44px] rounded-lg border bg-white px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/60 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-blush-50 disabled:opacity-60 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
            : "border-blush-200 focus:border-brand-800 focus:ring-brand-800/20"
        } ${className}`.trim()}
        {...props}
      />

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default Input;

