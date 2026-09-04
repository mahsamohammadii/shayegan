"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { getMe, refreshAccessToken, logoutUser } from "@/lib/api/auth"
import { registerUnauthorizedHandler } from "@/lib/api/client"

const LoginContext = createContext()

export const LoginProvider = ({ children }) => {
  /** null = not logged in, object = logged-in user info */
  const [user, setUser] = useState(null)
  /** true while the initial silent auth check is running */
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Handle unauthorized events (when auto-refresh fails on 401)
  const handleUnauthorized = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    }
    setUser(null);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  /**
   * Restore session on mount via httpOnly cookies.
   */
  useEffect(() => {
    const restoreSession = async () => {
      // 1. Instant hydration from cached user info (UI responsiveness)
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('user');
          }
        }
      }

      // 2. Validate session with backend using cookies
      try {
        const userData = await getMe();
        if (userData) {
          setUser(userData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        // If getMe failed (e.g. 401 expired access cookie), attempt silent refresh
        try {
          await refreshAccessToken();
          const userData = await getMe();
          if (userData) {
            setUser(userData);
            if (typeof window !== 'undefined') {
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        } catch (refreshErr) {
          // Both getMe and refresh failed -> user is not logged in / session expired
          handleUnauthorized();
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    restoreSession();
  }, [handleUnauthorized]);

  /**
   * Called by Login component after verifyOtp succeeds.
   * Cookies are automatically set by the backend response.
   */
  const login = useCallback((userData) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken'); // Ensure old tokens are purged
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
    }
  }, []);

  /**
   * Clears cookies on server and local state.
   */
  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Even if server request fails, clear local state
    } finally {
      handleUnauthorized();
    }
  }, [handleUnauthorized]);

  /**
   * Backwards compatible helper for components checking login status.
   * Returns true if logged in (or session valid), or null if unauthenticated.
   */
  const getValidToken = useCallback(async () => {
    if (!user) {
      try {
        const userData = await getMe();
        if (userData) {
          setUser(userData);
          return true;
        }
      } catch {
        return null;
      }
      return null;
    }
    return true;
  }, [user]);

  const isLoggedIn = Boolean(user);

  return (
    <LoginContext.Provider
      value={{
        user,
        isLoggedIn,
        isAuthLoading,
        login,
        logout,
        getValidToken,
        // Legacy aliases
        accessToken: isLoggedIn ? "cookie-session" : null,
        log: isLoggedIn,
        toggleLog: () => {},
        toggleLog2: logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};

export const useLogin = () => useContext(LoginContext);