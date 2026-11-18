import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet,
  faTicket,
  faUser,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { Logo } from "../components/ui/Logo";
import { useCustomerAuth } from "../auth/CustomerAuthContext";

const navItems = [
  { to: "/wallet", label: "Wallet", icon: faWallet },
  { to: "/vouchers", label: "Vouchers", icon: faTicket },
  { to: "/profile", label: "Profile", icon: faUser },
];

export const CustomerLayout = () => {
  const { customer, logout } = useCustomerAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white text-ink flex flex-col antialiased">
      {/* Top Header (Desktop & Mobile) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-blush-200">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo size="sm" to="/wallet" />

          {/* Desktop Navigation Links & User Actions */}
          <div className="flex items-center gap-6">
            <nav className="hidden sm:flex items-center gap-6" aria-label="Customer navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "text-brand-800 border-b-2 border-brand-800"
                        : "text-ink hover:text-brand-800"
                    }`
                  }
                >
                  <FontAwesomeIcon icon={item.icon} className="text-sm" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Customer Code / Name & Logout Action */}
            <div className="flex items-center gap-3">
              {customer && (
                <span
                  title={customer.name}
                  className="hidden sm:inline-block rounded-md bg-blush-100 px-2.5 py-1 text-xs font-mono font-bold text-brand-900 truncate max-w-[150px]"
                >
                  {customer.customer_code || customer.name}
                </span>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-ink-soft hover:bg-blush-100 hover:text-brand-900 transition focus-visible:outline-brand-800"
                title="Log out"
              >
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 sm:py-8 pb-24 sm:pb-10">
        <Outlet />
      </main>

      {/* Bottom Tab Bar (Mobile only) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-blush-200 sm:hidden shadow-[0_-2px_10px_rgba(43,17,20,0.04)]"
      >
        <div className="grid h-16 grid-cols-3 max-w-md mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center min-h-[44px] transition ${
                  isActive
                    ? "text-brand-800 font-bold"
                    : "text-ink-soft hover:text-ink font-medium"
                }`
              }
            >
              <FontAwesomeIcon icon={item.icon} className="text-lg mb-1" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CustomerLayout;
