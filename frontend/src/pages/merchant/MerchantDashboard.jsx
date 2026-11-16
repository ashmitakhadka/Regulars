import { MerchantSidebar } from "../../components/merchant/MerchantSidebar";
import { DashboardHeader } from "../../components/merchant/DashboardHeader";
import { DashboardStats } from "../../components/merchant/DashboardStats";
import { RewardProgramOverview } from "../../components/merchant/RewardProgramOverview";
import { RecentActivity } from "../../components/merchant/RecentActivity";

export const MerchantDashboard = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Sidebar */}
      <MerchantSidebar />

      {/* Main Content */}
      <main className="w-full flex-1 p-5 sm:p-8">
        <DashboardHeader />
        <DashboardStats />
        <RewardProgramOverview />
        <RecentActivity />
      </main>
    </div>
  );
};
