import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faGift,
  faUsers,
  faQrcode,
  faTicket,
  faBullhorn,
  faGear,
  faRightFromBracket,
  faBars,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { Logo } from "../ui";

const navigationItems = [
  { label: "Dashboard", path: "/merchant/dashboard", icon: faGauge },
  { label: "Reward Program", path: "/merchant/rewards", icon: faGift },
  { label: "Customers", path: "/merchant/customers", icon: faUsers },
  { label: "QR Code", path: "/merchant/qr-code", icon: faQrcode },
  { label: "Vouchers", path: "/merchant/vouchers", icon: faTicket },
  { label: "Promotions", path: "/merchant/promotions", icon: faBullhorn },
  { label: "Settings", path: "/merchant/settings", icon: faGear },
];

export const MerchantSidebar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationLinks = (mobile = false) =>
    navigationItems.map((item) => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === "/merchant/dashboard"}
        onClick={() => mobile && setIsMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
            isActive
              ? "bg-[#A51D27] text-white"
              : "text-[#23140C] hover:bg-[#F4F0EA]"
          }`
        }
      >
        <FontAwesomeIcon icon={item.icon} className="w-4" />
        {item.label}
      </NavLink>
    ));

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-[#F4F0EA] px-5 py-6 md:flex">
        <div className="mb-10">
          <Logo size="md" to="/merchant/dashboard" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#23140C]/50">
            Merchant Panel
          </p>
        </div>

        <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs text-[#23140C]/50">Business account</p>
          <h3 className="mt-1 font-display font-bold text-[#23140C]">
            Your Business
          </h3>
        </div>

        <nav className="flex-1 space-y-2">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-[#23140C]/40">
            Menu
          </p>
          {navigationLinks()}
        </nav>

        <button
          type="button"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#23140C] hover:bg-white"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
          Logout
        </button>
      </aside>

      {/* Mobile Navigation */}
      <div className="relative z-20 w-full bg-white md:hidden">
        <header className="flex items-center justify-between px-5 py-4 shadow-sm">
          <Logo size="md" to="/merchant/dashboard" />

          <button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F4F0EA] text-[#23140C]"
          >
            <FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
          </button>
        </header>

        {isMenuOpen && (
          <div className="absolute left-0 top-full w-full rounded-b-2xl bg-white px-4 py-4 shadow-lg">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#23140C]/40">
              Merchant Menu
            </p>

            <nav className="grid grid-cols-2 gap-2">
              {navigationLinks(true)}
            </nav>

            <div className="mt-5 border-t border-[#F4F0EA] pt-4">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#23140C] hover:bg-[#F4F0EA]"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
