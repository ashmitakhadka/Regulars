import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faGift,
  faUsers,
  faQrcode,
  faTicket,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
  faSpinner,
  faBoxesStacked,
} from "@fortawesome/free-solid-svg-icons";

import { Logo } from "../ui";

const navigationItems = [
  { label: "Dashboard", path: "/merchant/dashboard", icon: faGauge },
  {
    label: "Loyalty Programs",
    path: "/merchant/loyalty-programs",
    icon: faGift,
  },
  { label: "Products", path: "/merchant/products", icon: faBoxesStacked },
  { label: "Customers", path: "/merchant/customers", icon: faUsers },
  { label: "QR Code", path: "/merchant/qr-code", icon: faQrcode },
  { label: "Vouchers", path: "/merchant/vouchers", icon: faTicket },
  { label: "Settings", path: "/merchant/settings", icon: faGear },
];

const NavLinks = ({ onNavigate }) =>
  navigationItems.map((item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === "/merchant/dashboard"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A51D27] ${
          isActive
            ? "bg-[#A51D27] text-white"
            : "text-[#23140C] hover:bg-[#F4F0EA]"
        }`
      }
    >
      <FontAwesomeIcon icon={item.icon} className="w-4" aria-hidden="true" />
      {item.label}
    </NavLink>
  ));

const LogoutButton = ({ onClick, isLoading, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#23140C] transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A51D27] ${className}`}
  >
    <FontAwesomeIcon
      icon={isLoading ? faSpinner : faRightFromBracket}
      className="w-4"
      spin={isLoading}
      aria-hidden="true"
    />
    {isLoading ? "Logging out..." : "Logout"}
  </button>
);

export const MerchantSidebar = () => {
  const { merchant } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }

  const closeMenu = () => setIsMenuOpen(false);

  // Close on Escape or outside click, and lock body scroll while open
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeMenu();
        toggleRef.current?.focus();
      }
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !toggleRef.current?.contains(e.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      const response = await api.post("/logout/merchant");
      toast.success(response.data.message || "Logged out successfully.");
      closeMenu();
      navigate("/merchant/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(
        error.response?.data?.message || "Unable to log out. Please try again.",
      );
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-[#F4F0EA] px-5 py-6 md:flex">
        <div className="mb-10">
          <Logo size="md" to="/merchant/dashboard" />
          <p className="mt-2 truncate text-xs font-semibold uppercase tracking-widest text-[#23140C]/50">
            {merchant?.businessName ?? "Merchant Panel"}
          </p>
        </div>

        <nav aria-label="Merchant navigation" className="flex-1 space-y-2">
          <NavLinks />
        </nav>

        <LogoutButton
          onClick={handleLogout}
          isLoading={isLoggingOut}
          className="hover:bg-white"
        />
      </aside>

      {/* Mobile Navigation */}
      <div className="sticky top-0 z-30 w-full bg-white md:hidden">
        <header className="flex items-center justify-between px-5 py-4 shadow-sm">
          <Logo size="md" to="/merchant/dashboard" />

          <button
            ref={toggleRef}
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="merchant-mobile-menu"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4F0EA] text-[#23140C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A51D27]"
          >
            <FontAwesomeIcon
              icon={isMenuOpen ? faXmark : faBars}
              aria-hidden="true"
            />
          </button>
        </header>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-[72px] -z-10 bg-black/30"
              aria-hidden="true"
            />

            <div
              id="merchant-mobile-menu"
              ref={menuRef}
              className="absolute left-0 top-full max-h-[calc(100vh-72px)] w-full overflow-y-auto rounded-b-2xl bg-white px-4 py-4 shadow-lg"
            >
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#23140C]/40">
                Merchant Menu
              </p>

              <nav
                aria-label="Merchant navigation"
                className="grid grid-cols-2 gap-2"
              >
                <NavLinks onNavigate={closeMenu} />
              </nav>

              <div className="mt-5 border-t border-[#F4F0EA] pt-4">
                <LogoutButton
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  className="w-full hover:bg-[#F4F0EA]"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MerchantSidebar;
