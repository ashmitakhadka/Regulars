import { createContext, useContext, useState, useEffect, useCallback } from "react";
import adminService from "../services/admin/adminService";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("loading"); // 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden'

  const clear = useCallback((status = "unauthenticated") => {
    setAdmin(null);
    setAuthStatus(status);
  }, []);

  // Restore admin session on mount
  useEffect(() => {
    adminService
      .me()
      .then((res) => {
        setAdmin(res.data);
        setAuthStatus("authenticated");
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) {
          // Logged in as non-admin role (e.g. merchant/customer)
          clear("forbidden");
        } else {
          // 401 unauthenticated
          clear("unauthenticated");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clear]);

  const login = async (credentials) => {
    const res = await adminService.login(credentials);
    setAdmin(res.data);
    setAuthStatus("authenticated");
    return res;
  };

  const logout = async () => {
    try {
      await adminService.logout();
    } finally {
      clear("unauthenticated");
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        loading,
        authStatus,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export default AdminAuthContext;
