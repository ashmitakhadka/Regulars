import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./ui/Button";
import { Logo } from "./ui/Logo";

const links = [
  { href: "/", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#businesses", label: "For Businesses" },
  { href: "#customers", label: "For Customers" },
];

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-800";

export const Navbar = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => e.key === "Escape" && setOpen(false);

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo with flame icon */}
        <Logo to="/" onClick={close} size="md" />

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-8 lg:flex xl:gap-10"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold text-ink transition-colors hover:text-brand-800 xl:text-base ${focus}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Authentication Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <Button to="/merchant/profile" variant="primary" size="md">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button
                to="/merchant/login"
                variant="ghost"
                size="md"
                className="hidden sm:inline-flex"
              >
                Log In
              </Button>

              <Button to="/merchant/register" variant="primary" size="md">
                Get Started
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-brand-900 transition hover:bg-blush-100 lg:hidden ${focus}`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="bg-white px-5 py-4 shadow-lg lg:hidden"
        >
          <ul className="mx-auto max-w-6xl space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={close}
                  className={`block rounded-lg px-4 py-3 text-base font-medium text-ink transition hover:bg-blush-100 hover:text-brand-800 ${focus}`}
                >
                  {link.label}
                </a>
              </li>
            ))}

            {!user && (
              <li className="border-t border-blush-200 pt-2 sm:hidden">
                <Button
                  to="/merchant/login"
                  onClick={close}
                  variant="ghost"
                  fullWidth
                  className="justify-start px-4 py-3"
                >
                  Log In
                </Button>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};
