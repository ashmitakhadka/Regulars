import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const links = [
  { href: "/", label: "Home" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#businesses", label: "For Businesses" },
  { href: "#customers", label: "For Customers" },
];

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-800";

function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 fill-brand-800"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

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
        {/* Logo */}
        <Link
          to="/"
          onClick={close}
          className={`flex shrink-0 items-center gap-2 ${focus}`}
        >
          <StarIcon />
          <span className="font-display text-2xl font-extrabold tracking-tight text-brand-900">
            Regulars<span className="text-brand-800">.</span>
          </span>
        </Link>

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
            <Link
              to="/merchant/profile"
              className={`rounded-lg bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900 sm:text-base ${focus}`}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/merchant/login"
                className={`hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-900 transition hover:bg-blush-100 sm:inline-flex ${focus}`}
              >
                Log In
              </Link>

              <Link
                to="/merchant/register"
                className={`inline-flex items-center justify-center rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900 sm:px-5 sm:text-base ${focus}`}
              >
                Get Started
              </Link>
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
                <Link
                  to="/merchant/login"
                  onClick={close}
                  className={`block rounded-lg px-4 py-3 text-base font-semibold text-brand-900 hover:bg-blush-100 ${focus}`}
                >
                  Log In
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};
