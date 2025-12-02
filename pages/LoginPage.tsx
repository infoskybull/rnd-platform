import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import RnDLogo from "../components/icons/RnDLogo";
import { LoginCredentials, Web3WalletCredentials } from "../types";
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
    clearError,
    clearRequires2FA,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();

  // Authentication handlers using the useAuth hook - MUST be at top level
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      // Don't clear error here - let it be set by the login action
      // Error will be set in Redux state when login fails
      try {
        await login(credentials);
        // Navigation will be handled by useEffect when isAuthenticated and user are both available
        // No need to check user role here as it will be handled by useEffect
      } catch (err: any) {
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
        // Other errors are handled by the useAuth hook and set in Redux state
        // Don't throw here - let error be displayed from Redux state
        throw err;
      }
    },
    [login]
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
  // Only navigate when actually authenticated (not during login failure)
  useEffect(() => {
    console.log("LoginPage useEffect triggered:", {
      isAuthenticated,
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      hasRole: user?.role,
      error,
      isLoading,
    });
    // Only proceed if:
    // 1. We have both authentication status and user data
    // 2. User is actually authenticated (isAuthenticated is true)
    // 3. Not currently loading
    // 4. No error (to prevent navigation during failed login)
    if (isAuthenticated && user && user.role && !isLoading && !error) {
      // Navigate based on user role
      if (user.role === "admin") {
        navigate("/admin/accounts");
      } else if (user.role === "publisher") {
        navigate("/dashboard");
      } else if (user.role === "creator") {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate, isLoading, error]);

  // Memoize navigate callback to prevent re-renders
  // MUST be before any early returns to follow Rules of Hooks
  const handleSwitchToSignUp = useCallback(() => {
    navigate("/signup");
  }, [navigate]);

  // Memoize requires2FA boolean to prevent unnecessary re-renders
  // MUST be before any early returns to follow Rules of Hooks
  const requires2FAValue = useMemo(() => !!requires2FA, [requires2FA]);

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
        handleWeb3WalletLogin={handleWeb3WalletLogin}
        isLoading={isLoading}
        error={error}
        clearError={clearError}
        requires2FAFromGlobal={requires2FAValue}
        clear2FARequired={clearRequires2FA}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
    </>
  );
};

export default LoginPage;
