import { useEffect, useCallback } from "react";
import { LoginCredentials, SignUpData, Web3WalletCredentials } from "../types";
import { useTonConnect } from "./useTonConnect";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  initializeAuth,
  loginUser,
  loginWith2FA,
  web3WalletLogin,
  signupUser,
  logoutUser,
  refreshUser,
  clearError,
  setRequires2FA,
  clear2FAContext,
} from "../store/authSlice";

export const useAuth = () => {
  const { isConnected: isTonConnected, logout: tonLogout } = useTonConnect();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  // Initialize auth state from localStorage and verify tokens
  useEffect(() => {
    if (!authState.isInitialized && !isTonConnected) {
      dispatch(initializeAuth());
    }
  }, [dispatch, authState.isInitialized, isTonConnected]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        await dispatch(loginUser(credentials)).unwrap();
      } catch (error: any) {
        // Log error để debug
        console.log("[useAuth] Login error caught:", error);
        console.log("[useAuth] Error type:", typeof error);
        console.log(
          "[useAuth] Error keys:",
          error ? Object.keys(error) : "no keys"
        );
        console.log("[useAuth] Error.requires2FA:", error?.requires2FA);

        // Pass error through để component có thể handle
        throw error;
      }
    },
    [dispatch]
  );

  const loginWith2FAHandler = useCallback(
    async (
      credentials: LoginCredentials & { token: string }
    ): Promise<void> => {
      try {
        await dispatch(loginWith2FA(credentials)).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch]
  );

  const web3WalletLoginHandler = useCallback(
    async (credentials: Web3WalletCredentials): Promise<void> => {
      try {
        await dispatch(web3WalletLogin(credentials)).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch]
  );

  const signup = useCallback(
    async (data: SignUpData): Promise<void> => {
      try {
        await dispatch(signupUser(data)).unwrap();
      } catch (error) {
        throw error;
      }
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      console.log("Starting comprehensive auth logout...");

      // Step 1: Logout from TON Connect first
      if (isTonConnected) {
        console.log("Disconnecting from TON Connect...");
        try {
          await tonLogout();
          console.log("✅ TON Connect logout completed");
        } catch (tonError) {
          console.warn("TON Connect logout failed:", tonError);
          // Continue with auth logout even if TON logout fails
        }
      }

      // Step 2: Logout from auth system
      console.log("Logging out from auth system...");
      await dispatch(logoutUser()).unwrap();
      console.log("✅ Auth logout completed");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, [dispatch, isTonConnected, tonLogout]);

  const clearErrorHandler = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearRequires2FAHandler = useCallback(() => {
    dispatch(clear2FAContext());
  }, [dispatch]);

  const refreshUserHandler = useCallback(async (): Promise<void> => {
    try {
      await dispatch(refreshUser()).unwrap();
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, [dispatch]);

  return {
    ...authState,
    login,
    loginWith2FA: loginWith2FAHandler,
    web3WalletLogin: web3WalletLoginHandler,
    signup,
    logout,
    clearError: clearErrorHandler,
    clearRequires2FA: clearRequires2FAHandler,
    refreshUser: refreshUserHandler,
    isAuthenticated: !!authState.user,
  };
};

export default useAuth;
