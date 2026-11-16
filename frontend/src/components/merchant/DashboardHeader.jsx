import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUserCircle } from "@fortawesome/free-solid-svg-icons";

export const DashboardHeader = () => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Welcome Message */}
      <div>
        <p className="text-sm font-medium text-ink-soft">Welcome back,</p>

        <h1 className="mt-1 font-display text-2xl font-extrabold text-brand-900 sm:text-3xl">
          Your Business
        </h1>

        <p className="mt-1 text-sm text-ink-soft">
          Here's what's happening with your loyalty program today.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4F0EA] text-[#23140C] transition hover:bg-[#EAE2D8]"
        >
          <FontAwesomeIcon icon={faBell} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#A51D27] text-white">
            <FontAwesomeIcon icon={faUserCircle} size="lg" />
          </div>

          <div>
            <p className="text-sm font-bold text-[#23140C]">Merchant</p>
            <p className="text-xs text-ink-soft">Business Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
};
