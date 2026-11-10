import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { AuthProvider } from "./auth/AuthContext";
import Home from "./pages/Home";
import { MerchantRegistration } from "./pages/merchantAuth/merchantRegister";
import { Toaster } from "react-hot-toast";
import { MerchantLogin } from "./pages/merchantAuth/merchantLogin";
import Login from "./pages/customer/Login";
import Verify from "./pages/customer/Verify";
import Join from "./pages/customer/Join";
import Wallet from "./pages/customer/Wallet";
import CardDetail from "./pages/customer/CardDetail";
import Vouchers from "./pages/customer/Vouchers";
import VoucherDetail from "./pages/customer/VoucherDetail";
import Profile from "./pages/customer/Profile";
import UIPreview from "./pages/UIPreview";
import CustomerLayout from "./layouts/CustomerLayout";
import { MerchantDashboard } from "./pages/merchant/MerchantDashboard";

const router = createBrowserRouter([
  // Landing Page
  { path: "/", element: <Home /> },

  // UI Component Preview
  { path: "/ui-preview", element: <UIPreview /> },

  // Customer Auth & Joining
  { path: "/login", element: <Login /> },
  { path: "/auth/verify", element: <Verify /> },
  { path: "/join/:merchantSlug", element: <Join /> },

  // Customer Protected / Layout Pages
  {
    element: <CustomerLayout />,
    children: [
      { path: "/wallet", element: <Wallet /> },
      { path: "/wallet/:cardId", element: <CardDetail /> },
      { path: "/vouchers", element: <Vouchers /> },
      { path: "/vouchers/:id", element: <VoucherDetail /> },
      { path: "/profile", element: <Profile /> },
    ],
  },

  // Fallback
  { path: "*", element: <Navigate to="/" replace /> },
  { path: "/merchant/register", element: <MerchantRegistration /> },
  { path: "/merchant/login", element: <MerchantLogin /> },

  //merchant
  { path: "/merchantdashboard", element: <MerchantDashboard /> },
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
