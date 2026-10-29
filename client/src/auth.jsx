import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getToken, setToken, getMe, loginUser, registerUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken())); // only need to check if we have a token

  useEffect(() => {
    if (!getToken()) return;
    getMe()
      .then(data => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // api.js fires this when the server says our token is no longer valid
  useEffect(() => {
    const onSignedOut = () => setUser(null);
    window.addEventListener('rr:signed-out', onSignedOut);
    return () => window.removeEventListener('rr:signed-out', onSignedOut);
  }, []);

  const finish = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email, password) => finish(await loginUser(email, password)), [finish]);
  const register = useCallback(async (email, password) => finish(await registerUser(email, password)), [finish]);
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
