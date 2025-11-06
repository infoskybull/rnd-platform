import React, { useState, useCallback, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Login from "../components/Login";
import RnDLogo from "../components/icons/RnDLogo";
import {
  LoginCredentials,
  TonConnectLoginCredentials,
  Web3WalletCredentials,
} from "../types";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const {
    user,
    isLoading,
    error,
    requires2FA,
    login,
    loginWith2FA,
    web3WalletLogin,
    signup,
    clearError,
    clearRequires2FA,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();

  // Authentication handlers using the useAuth hook - MUST be at top level
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      clearError(); // Clear any previous errors
      try {
        await login(credentials);
        // Navigation will be handled by useEffect when isAuthenticated and user are both available
        // No need to check user role here as it will be handled by useEffect
      } catch (err: any) {
        // Log error để debug
        console.log("[LoginPage] Login error caught:", err);
        console.log("[LoginPage] Error.requires2FA:", err?.requires2FA);

        // Check if error indicates 2FA is required - rethrow to let Login component handle it
        if (
          err?.requires2FA ||
          (typeof err === "object" && err?.requires2FA === true)
        ) {
          console.log(
            "[LoginPage] 2FA required, passing error to Login component"
          );
          // dispatch(setRequires2FA(true));
          // throw err; // Let Login component handle this
        }
        // Other errors are handled by the useAuth hook
        throw err;
      }
    },
    [login, clearError]
  );

  const handleLoginWith2FA = useCallback(
    async (credentials: LoginCredentials & { token: string }) => {
      clearError(); // Clear any previous errors
      try {
        await loginWith2FA(credentials);
        // Navigation will be handled by useEffect when isAuthenticated and user are both available
      } catch (err) {
        throw err;
      }
    },
    [loginWith2FA, clearError]
  );

  const handleWeb3WalletLogin = useCallback(
    async (credentials: Web3WalletCredentials) => {
      clearError(); // Clear any previous errors
      try {
        await web3WalletLogin(credentials);
        // Navigation will be handled by useEffect when isAuthenticated changes
        // No need to check user role here as it will be handled by useEffect
      } catch (err) {
        // Error is handled by the useAuth hook
        throw new Error("Failed to login");
      }
    },
    [web3WalletLogin, clearError]
  );

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    console.log("LoginPage useEffect triggered:", {
      isAuthenticated,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      hasRole: user?.role,
    });
    // Only proceed if we have both authentication status and user data
    if (user && user.role) {
      // Navigate based on user role
      if (user.role === "admin") {
        navigate("/admin/management");
      } else if (user.role === "publisher") {
        navigate("/dashboard/publisher/browse-games");
      } else if (user.role === "creator") {
        navigate("/dashboard/creator/your-projects");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading spinner while checking authentication
  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <RnDLogo size={60} />
          </div>
          <div className="text-lg">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Login
        onLogin={handleLogin}
        onLoginWith2FA={handleLoginWith2FA}
        onTonConnectLogin={handleWeb3WalletLogin}
        isLoading={isLoading}
        error={error}
        clearError={clearError}
        requires2FAFromGlobal={!!requires2FA}
        clear2FARequired={clearRequires2FA}
        onSwitchToSignUp={() => navigate("/signup")}
      />
    </>
  );
};

export default LoginPage;
