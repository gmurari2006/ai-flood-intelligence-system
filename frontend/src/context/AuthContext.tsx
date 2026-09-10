import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  setGuestRole: (role: UserRole) => void;
  isOfficer: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'ai_flood_auth_token';
const USER_STORAGE_KEY = 'ai_flood_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUserJson = sessionStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson) as User;
        setAuthState({
          user: parsedUser,
          token: storedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Default unauthenticated / public mode
        setAuthState({
          user: {
            id: 'guest',
            username: 'public_citizen',
            full_name: 'Public Citizen',
            role: 'PUBLIC_USER',
          },
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const login = (token: string, user: User) => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    setAuthState({
      user: {
        id: 'guest',
        username: 'public_citizen',
        full_name: 'Public Citizen',
        role: 'PUBLIC_USER',
      },
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const setGuestRole = async (role: UserRole) => {
    if (role === 'DISASTER_OFFICER' || role === 'SUPER_ADMIN') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'officer_rajesh',
            password: 'SecurePassword123!'
          })
        });
        if (response.ok) {
          const data = await response.json();
          const userObj: User = {
            id: 'officer-rajesh',
            username: 'officer_rajesh',
            full_name: 'Rajesh Verma (SDRF)',
            role: role,
          };
          sessionStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
          sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj));
          setAuthState({
            user: userObj,
            token: data.access_token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch (err) {
        console.warn('Auto-login for officer failed, falling back to client-only role:', err);
      }
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }

    setAuthState((prev) => ({
      ...prev,
      user: prev.user
        ? { ...prev.user, role }
        : { id: 'guest', username: 'guest', full_name: 'Guest User', role },
      token: role === 'PUBLIC_USER' ? null : prev.token,
      isAuthenticated: role !== 'PUBLIC_USER',
    }));
  };

  const isOfficer =
    authState.user?.role === 'DISASTER_OFFICER' || authState.user?.role === 'SUPER_ADMIN';
  const isAdmin = authState.user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        setGuestRole,
        isOfficer,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
