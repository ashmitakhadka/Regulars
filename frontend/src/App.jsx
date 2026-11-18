import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./auth/AuthContext";
import { CustomerAuthProvider } from "./auth/CustomerAuthContext";
import { CustomerProtectedRoute } from "./components/customer/CustomerProtectedRoute";
import Home from "./pages/Home";
import { MerchantRegistration } from "./pages/merchantAuth/merchantRegister";
import { Toaster } from "react-hot-toast";
import { MerchantLogin } from "./pages/merchantAuth/merchantLogin";
import Login from "./pages/customer/Login";
import Register from "./pages/customer/Register";
import Join from "./pages/customer/Join";
import Wallet from "./pages/customer/Wallet";
import CardDetail from "./pages/customer/CardDetail";
import Vouchers from "./pages/customer/Vouchers";
import VoucherDetail from "./pages/customer/VoucherDetail";
import Profile from "./pages/customer/Profile";
import SignInChoice from "./pages/SignInChoice";
import SignUpChoice from "./pages/SignUpChoice";
import UIPreview from "./pages/UIPreview";
import CustomerLayout from "./layouts/CustomerLayout";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";
import { LoyaltyPrograms } from "./pages/merchant/LoyaltyPrograms";
import { CreateLoyaltyProgram } from "./pages/merchant/CreateLoyaltyProgram";
import { LoyaltyProgramDetails } from "./pages/merchant/LoyaltyProgramDetails";
import { EditLoyaltyProgram } from "./pages/merchant/EditLoyaltyProgram";
import MerchantQrCode from "./components/merchant/MerchantQrCode";

const MerchantProtectedRoute = ({ children }) => {
  const { user, merchant, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-[#23140C]">Loading your merchant workspace...</p>
      </div>
    );
  }

  if (!user || user.role !== "merchant" || !merchant) {
    return <Navigate to="/merchant/login" replace />;
  }

  return children;
};

// Customer routes subtree wrapper providing customer auth state
const CustomerRoot = () => (
  <CustomerAuthProvider>
    <Outlet />
  </CustomerAuthProvider>
);

const router = createBrowserRouter([
  // Landing Page
  { path: "/", element: <Home /> },

  // Auth Choice Pages
  { path: "/sign-in", element: <SignInChoice /> },
  { path: "/sign-up", element: <SignUpChoice /> },

  // UI Component Preview
  { path: "/ui-preview", element: <UIPreview /> },

  // Customer Routes (wrapped in CustomerAuthProvider)
  {
    element: <CustomerRoot />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/join/:merchantSlug", element: <Join /> },

      // Protected Customer Pages
      {
        element: (
          <CustomerProtectedRoute>
            <CustomerLayout />
          </CustomerProtectedRoute>
        ),
        children: [
          { path: "/wallet", element: <Wallet /> },
          { path: "/wallet/:cardId", element: <CardDetail /> },
          { path: "/vouchers", element: <Vouchers /> },
          { path: "/vouchers/:id", element: <VoucherDetail /> },
          { path: "/profile", element: <Profile /> },
        ],
      },
    ],
  },

  { path: "/merchant/register", element: <MerchantRegistration /> },
  { path: "/merchant/login", element: <MerchantLogin /> },

  {
    path: "/merchant/dashboard",
    element: (
      <MerchantProtectedRoute>
        <MerchantDashboard />
      </MerchantProtectedRoute>
    ),
  },

  // Merchant Loyalty Programs Routes
  {
    path: "/merchant/loyalty-programs",
    element: (
      <MerchantProtectedRoute>
        <LoyaltyPrograms />
      </MerchantProtectedRoute>
    ),
  },
  {
    path: "/merchant/loyalty-programs/create",
    element: (
      <MerchantProtectedRoute>
        <CreateLoyaltyProgram />
      </MerchantProtectedRoute>
    ),
  },
  {
    path: "/merchant/loyalty-programs/:id/edit",
    element: (
      <MerchantProtectedRoute>
        <EditLoyaltyProgram />
      </MerchantProtectedRoute>
    ),
  },
  {
    path: "/merchant/loyalty-programs/:id",
    element: (
      <MerchantProtectedRoute>
        <LoyaltyProgramDetails />
      </MerchantProtectedRoute>
    ),
  },

  // Legacy Aliases and Redirects for Backward Compatibility
  {
    path: "/merchant/reward-programs",
    element: <Navigate to="/merchant/loyalty-programs" replace />,
  },
  {
    path: "/merchant/reward-programs/create",
    element: <Navigate to="/merchant/loyalty-programs/create" replace />,
  },
  {
    path: "/merchant/reward-programs/:id/edit",
    element: (
      <MerchantProtectedRoute>
        <EditLoyaltyProgram />
      </MerchantProtectedRoute>
    ),
  },
  {
    path: "/merchant/reward-programs/:id",
    element: (
      <MerchantProtectedRoute>
        <LoyaltyProgramDetails />
      </MerchantProtectedRoute>
    ),
  },
  {
    path: "/merchant/rewards",
    element: <Navigate to="/merchant/loyalty-programs" replace />,
  },
  {
    path: "/merchant/qr-code",
    element: (
      <MerchantProtectedRoute>
        <MerchantQrCode />
      </MerchantProtectedRoute>
    ),
  },

  // Fallback (placed after explicit routes)
  { path: "*", element: <Navigate to="/" replace /> },
]);

export const App = () => {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster position="top-right" />
    </>
  );
};

export default App;
