import { Link } from "react-router-dom";
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

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="border-t border-blush-200 bg-blush-100">
      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:gap-12">
          {/* Brand - matches Navbar logo */}
          <div className="sm:col-span-2 md:col-span-1">
            <Logo to="/" size="md" />

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
                  <Button
                    to="/merchant/profile"
                    variant="primary"
                    size="sm"
                  >
                    Go to Dashboard
                  </Button>
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
                    <Button
                      to="/merchant/register"
                      variant="primary"
                      size="sm"
                    >
                      Get Started
                    </Button>
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
