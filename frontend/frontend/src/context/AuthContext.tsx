import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
//import { clearKey } from '../lib/schnorrClient';

interface UserProfile {
  username: string;
  createdAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  checkSession: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      //tell Server to delete the HttpOnly cookie
      await authApi.logout();
    } catch (err) {
      console.error("Logout API failed", err);
    }


    //clear cookie
    //document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";//expires in the past //but this line actually would never run because httpOnly: true
    
    //clearKey(); //clear local storage key  // BRO no, the user needs the local browser key to sign in again
    setUser(null);
    //force reload to ensure cookie is deleted from browser memory
    window.location.href = '/login';
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

//custom hook for easy access
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}