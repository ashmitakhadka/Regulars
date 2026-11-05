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

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="border-t border-blush-200 bg-blush-100">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          {/* Brand - matches Navbar logo exactly */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 ${focus}`}
            >
              <StarIcon />
              <span className="font-display text-2xl font-extrabold tracking-tight text-brand-900">
                Regulars<span className="text-brand-800">.</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-soft">
              Digital loyalty cards for local businesses. Customers scan a QR
              code, collect stamps, and claim rewards right from their phone.
            </p>
          </div>

          {/* Navigation - matches Navbar links exactly */}
          <nav aria-label="Footer navigation">
            <h3 className="font-display text-base font-extrabold tracking-tight text-brand-900">
              Navigation
            </h3>
            <ul className="mt-4 space-y-3">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`text-sm font-semibold text-ink transition-colors hover:text-brand-800 sm:text-base ${focus}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Authentication & Actions - matches Navbar buttons & auth state */}
          <nav aria-label="Account and actions">
            <h3 className="font-display text-base font-extrabold tracking-tight text-brand-900">
              {user ? "Account" : "Get Started"}
            </h3>
            <ul className="mt-4 space-y-3">
              {user ? (
                <li>
                  <Link
                    to="/merchant/profile"
                    className={`inline-flex items-center justify-center rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900 ${focus}`}
                  >
                    Go to Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/merchant/login"
                      className={`text-sm font-semibold text-ink transition-colors hover:text-brand-800 sm:text-base ${focus}`}
                    >
                      Log In
                    </Link>
                  </li>
                  <li className="pt-1">
                    <Link
                      to="/merchant/register"
                      className={`inline-flex items-center justify-center rounded-lg bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-900 ${focus}`}
                    >
                      Get Started
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-blush-200 pt-6 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Regulars. All rights reserved.
          </p>
          <a
            href="#top"
            className={`font-semibold text-ink transition-colors hover:text-brand-800 ${focus}`}
          >
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
};
