import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { TOKEN_KEY } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const clear = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setMerchant(null);
  }, []);

  // Restore the session on page load (only if a token is stored).
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    api
      .get("/merchant/me")
      .then(({ data }) => {
        setUser(data.user);
        setMerchant(data.merchant);
      })
      .catch(clear)
      .finally(() => setLoading(false));
  }, [clear]);

  const applySession = ({ token, user, merchant }) => {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    setMerchant(merchant);
  };

  const login = async (credentials) => {
    const { data } = await api.post("/merchant/login", credentials);
    applySession(data);
  };

  const register = async (payload) => {
    const { data } = await api.post("/merchant/register", payload);
    applySession(data);
  };

  const logout = async () => {
    try {
      await api.post("/merchant/logout");
    } finally {
      clear();
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, merchant, setMerchant, loading, login, register, logout }}
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
  Object.entries(data?.errors ?? {}).forEach(([k, v]) => (fields[k] = v[0]));
  return {
    fields,
    message: data?.message ?? "Something went wrong. Please try again.",
  };
}
