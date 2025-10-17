import { createContext, useContext, useEffect, useState } from "react";
import { AuthAPI } from "../api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const local = localStorage.getItem("tregu_auth");
    return local ? JSON.parse(local) : { access: null, refresh: null, user: null };
  });

  const setAuthPersist = (val) => {
    setAuth(val);
    localStorage.setItem("tregu_auth", JSON.stringify(val));
  };

  const login = async (email, password) => {
    const tokens = await AuthAPI.login(email, password);
    const me = await AuthAPI.me(tokens.access_token);
    setAuthPersist({ access: tokens.access_token, refresh: tokens.refresh_token, user: me });
  };

  const register = async (email, password, role) => {
    await AuthAPI.register(email, password, role);
    await login(email, password);
  };

  const logout = async () => {
    if (auth.access) {
      try { await AuthAPI.logout(auth.access); } catch {}
    }
    setAuthPersist({ access: null, refresh: null, user: null });
  };

  return (
    <AuthCtx.Provider value={{ auth, login, register, logout, setAuthPersist }}>
      {children}
    </AuthCtx.Provider>
  );
}
