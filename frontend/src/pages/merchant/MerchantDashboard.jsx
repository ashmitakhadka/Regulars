import MerchantSidebar from "../../components/merchant/MerchantSidebar";
import { DashboardHeader } from "../../components/merchant/DashboardHeader";
import { DashboardStats } from "../../components/merchant/DashboardStats";
import { RewardProgramOverview } from "../../components/merchant/RewardProgramOverview";
import { RecentActivity } from "../../components/merchant/RecentActivity";

export const MerchantDashboard = () => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <MerchantSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8">
        <DashboardHeader />
        <DashboardStats />
        <RewardProgramOverview />
        <RecentActivity />
      </main>
    </div>
  );
};
