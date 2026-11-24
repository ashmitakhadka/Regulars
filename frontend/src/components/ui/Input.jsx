import { useId, useState, forwardRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

export const Input = forwardRef(({
  label,
  labelClassName = "",
  hint,
  error,
  id,
  type = "text",
  className = "",
  disabled = false,
  required = false,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full text-left">
      {label && (
        <label
          htmlFor={inputId}
          className={`mb-2 block text-sm font-semibold text-[#23140C] ${labelClassName}`.trim()}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={`w-full min-h-[44px] rounded-lg border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-blush-50 disabled:opacity-60 ${
            isPassword ? "pr-11" : ""
          } ${
            error
              ? "border-red-500 focus:border-red-600 focus:ring-red-500/20"
              : "border-blush-200 focus:border-brand-800 focus:ring-brand-800/20"
          } ${className}`.trim()}
          {...props}
        />

        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition p-1 cursor-pointer focus:outline-none"
          >
            <FontAwesomeIcon
              icon={showPassword ? faEyeSlash : faEye}
              className="text-sm"
            />
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
