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

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "*", element: <Navigate to="/" replace /> },
  { path: "/merchant/register", element: <MerchantRegistration /> },
  { path: "/merchant/login", element: <MerchantLogin /> },
]);

const App = () => {
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
