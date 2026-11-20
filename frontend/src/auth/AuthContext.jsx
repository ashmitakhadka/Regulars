import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  const clear = useCallback(() => {
    setUser(null);
    setMerchant(null);
  }, []);

  // Restore the merchant session when the application loads.
  useEffect(() => {
    api
      .get("/merchant/me")
      .then(({ data }) => {
        setUser(data.user);
        setMerchant(data.merchant);
      })
      .catch(() => {
        clear();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clear]);

  // Apply authenticated merchant details to the context.
  const applySession = ({ user, merchant }) => {
    setUser(user);
    setMerchant(merchant);
  };

  // Merchant login using Sanctum session authentication.
  const login = async (credentials) => {
    const backendUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, "");

    await api.get("/sanctum/csrf-cookie", {
      baseURL: backendUrl,
    });

    const { data } = await api.post("/login/merchant", credentials);
    applySession(data);
    return data;
  };

  // Merchant registration does not automatically log the merchant in.
  const register = async (payload) => {
    const { data } = await api.post("/register/merchant", payload);
    return data;
  };

  // Merchant logout.
  const logout = async () => {
    try {
      await api.post("/logout/merchant");
    } finally {
      clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        merchant,
        setMerchant,
        applySession,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

// Turns a Laravel 422/403 response into { field: message } + a general message.
// eslint-disable-next-line react-refresh/only-export-components
export function parseApiError(err) {
  const data = err.response?.data;
  const fields = {};

  Object.entries(data?.errors ?? {}).forEach(([key, value]) => {
    fields[key] = value[0];
  });

  return {
    fields,
    message: data?.message ?? "Something went wrong. Please try again.",
  };
}
