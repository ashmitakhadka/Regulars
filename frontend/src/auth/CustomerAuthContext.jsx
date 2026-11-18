import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import customerAuthService from "../services/customer/customerAuthService";

const CustomerAuthContext = createContext(null);

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("loading"); // 'loading' | 'authenticated' | 'unauthenticated' | 'forbidden'

  const clear = useCallback((status = "unauthenticated") => {
    setCustomer(null);
    setAuthStatus(status);
  }, []);

  // Restore active customer session on initial mount
  useEffect(() => {
    customerAuthService
      .me()
      .then((res) => {
        setCustomer(res.data);
        setAuthStatus("authenticated");
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) {
          // Merchant/admin is logged in
          clear("forbidden");
        } else {
          // 401 unauthenticated or network error
          clear("unauthenticated");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clear]);

  /**
   * Register a new customer and set session state directly from response data.
   */
  const register = async (payload) => {
    const res = await customerAuthService.register(payload);
    setCustomer(res.data);
    setAuthStatus("authenticated");
    return res;
  };

  /**
   * Log in customer and set session state directly from response data.
   */
  const login = async (credentials) => {
    const res = await customerAuthService.login(credentials);
    setCustomer(res.data);
    setAuthStatus("authenticated");
    return res;
  };

  /**
   * Log out customer and clear session state.
   */
  const logout = async () => {
    try {
      await customerAuthService.logout();
    } finally {
      clear("unauthenticated");
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        authStatus,
        register,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
};

export default CustomerAuthContext;
