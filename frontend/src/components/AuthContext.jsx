import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("xaoc_token") || "");
  const [tempToken, setTempToken] = useState(localStorage.getItem("xaoc_temp_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Invalid session");
        })
        .then((data) => setUser(data))
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (authToken, userData) => {
    localStorage.setItem("xaoc_token", authToken);
    localStorage.removeItem("xaoc_temp_token");
    setToken(authToken);
    setTempToken("");
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("xaoc_token");
    localStorage.removeItem("xaoc_temp_token");
    setToken("");
    setTempToken("");
    setUser(null);
  };

  const setRegistrationTempToken = (tToken) => {
    localStorage.setItem("xaoc_temp_token", tToken);
    setTempToken(tToken);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        token,
        tempToken,
        loading,
        login,
        logout,
        setRegistrationTempToken,
        isAdmin: user?.role === "admin",
        needsSetup: !!user?.needsSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
