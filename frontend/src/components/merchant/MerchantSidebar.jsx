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
  return (
    <aside className="flex min-h-screen w-64 flex-col bg-[#F4F0EA] px-5 py-6">
      {/* Logo */}
      <div className="mb-10">
        <Logo size="md" to="/merchant/dashboard" />
        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-[#23140C]/50">
          Merchant Panel
        </p>
      </div>

      {/* Business Information */}
      <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs text-[#23140C]/50">Business account</p>
        <h3 className="mt-1 font-display font-bold text-[#23140C]">
          Your Business
        </h3>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-[#23140C]/40">
          Menu
        </p>

        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/merchant/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-[#A51D27] text-white shadow-sm"
                  : "text-[#23140C] hover:bg-white"
              }`
            }
          >
            <FontAwesomeIcon icon={item.icon} className="w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        type="button"
        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-[#23140C] transition hover:bg-white"
      >
        <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
        Logout
      </button>
    </aside>
  );
};

export default MerchantSidebar;
