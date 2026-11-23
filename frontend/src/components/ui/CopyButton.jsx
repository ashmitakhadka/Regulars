import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";

/**
 * Reusable accessible CopyButton component.
 * Features:
 * - Copies text to clipboard with fallback for non-supported contexts
 * - Announces copied state with an aria-live="polite" screen reader region
 * - 2-second timeout before resetting back to initial state
 * - Clear label and adaptable sizing
 */
export const CopyButton = ({
  text,
  label = "Copy code",
  copiedLabel = "Copied!",
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (!text) return;

    let successful = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        successful = true;
      }
    } catch {
      // Fallback
    }

    if (!successful) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.top = "-9999px";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        successful = document.execCommand("copy");
        document.body.removeChild(textArea);
      } catch {
        successful = false;
      }
    }

    if (successful) {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  return (
    <div className="relative inline-flex">
      <Button
        variant={copied ? "primary" : variant}
        size={size}
        onClick={handleCopy}
        className={className}
        aria-label={copied ? "Code copied to clipboard" : label}
      >
        <FontAwesomeIcon
          icon={copied ? faCheck : faCopy}
          className="text-xs shrink-0"
          aria-hidden="true"
        />
        <span>{copied ? copiedLabel : label}</span>
      </Button>

      {/* Screen reader live announcement */}
      <span className="sr-only" aria-live="polite" role="status">
        {copied ? "Code copied to clipboard" : ""}
      </span>
    </div>
  );
};

export default CopyButton;
