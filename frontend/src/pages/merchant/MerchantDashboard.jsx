import MerchantSidebar from "../../components/merchant/MerchantSidebar";

export const MerchantDashboard = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <MerchantSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-extrabold text-brand-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-ink-soft">
          Welcome back! Here's an overview of your business.
        </p>
      </main>
    </div>
  );
};
