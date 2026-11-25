import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faStore,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { Logo, Button } from "../components/ui";
import { useAdminAuth } from "../auth/AdminAuthContext";

export const AdminLayout = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { to: "/admin", end: true, label: "Dashboard", icon: faChartLine },
    { to: "/admin/merchants", end: false, label: "Merchants", icon: faStore },
  ];

  return (
    <div className="min-h-screen bg-blush-50/40 text-ink flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-blush-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-xs uppercase font-extrabold tracking-wider bg-blush-100 text-brand-900 px-2 py-0.5 rounded">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-900 truncate max-w-[120px]">
            {admin?.name}
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 text-ink rounded-lg hover:bg-blush-100 transition-colors"
          >
            <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="w-5 h-5 text-ink" />
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-blush-100 px-4 py-4 space-y-3 z-20 shadow-md">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-900 text-white font-semibold shadow-xs"
                      : "text-ink hover:bg-blush-100/70"
                  }`
                }
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="w-4 h-4 shrink-0 text-current"
                />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="pt-3 border-t border-blush-100">
            <Button
              variant="outline"
              size="sm"
              loading={isLoggingOut}
              onClick={handleLogout}
              className="w-full justify-center text-xs"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 text-current" />
              Log Out
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-blush-100 shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-blush-100">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="text-[11px] uppercase font-extrabold tracking-wider bg-blush-100 text-brand-900 px-2 py-0.5 rounded">
              Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-900 text-white font-semibold shadow-xs"
                    : "text-ink hover:bg-blush-100/70"
                }`
              }
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="w-4 h-4 shrink-0 text-current"
              />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-blush-100">
          <div className="mb-3 px-1">
            <p className="text-xs text-ink-soft">Signed in as</p>
            <p className="text-sm font-bold text-brand-900 truncate">
              {admin?.name || "Admin"}
            </p>
            <p className="text-[11px] text-ink-soft truncate">{admin?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            loading={isLoggingOut}
            onClick={handleLogout}
            className="w-full justify-center text-xs"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 text-current" />
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
