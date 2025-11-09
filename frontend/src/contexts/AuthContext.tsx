import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/api/client';

interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user info
      authApi.verifyToken(storedToken)
        .then((data) => authApi.getCurrentUser(storedToken))
        .then((userData) => setUser(userData))
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    setToken(data.access_token);
    localStorage.setItem('token', data.access_token);

    // Get user info
    const userData = await authApi.getCurrentUser(data.access_token);
    setUser(userData);
  };

  const register = async (email: string, username: string, password: string, fullName?: string) => {
    await authApi.register(email, username, password, fullName);
    // Auto-login after registration
    await login(username, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
