import React, { useState, useCallback, useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import SignUp from "../components/SignUp";
import RnDLogo from "../components/icons/RnDLogo";
import {
  LoginCredentials,
  SignUpData,
  TonConnectLoginCredentials,
  Web3WalletCredentials,
} from "../types";
import { useAuth } from "../hooks/useAuth";

const SignUpPage: React.FC = () => {
  const {
    user,
    isLoading,
    error,
    login,
    web3WalletLogin,
    signup,
    clearError,
    isAuthenticated,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get wallet info from URL parameters
  const walletType = searchParams.get("wallet");
  const walletAddress = searchParams.get("address");
  const walletMessage = searchParams.get("message");

  // Authentication handlers using the useAuth hook - MUST be at top level
  const handleSignUp = useCallback(
    async (data: SignUpData) => {
      clearError(); // Clear any previous errors
      try {
        await signup(data);
      } catch (err) {
        // Error is handled by the useAuth hook
        throw err;
      }
    },
    [signup, clearError]
  );

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role) {
      // Navigate based on user role
      if (user.role === "publisher") {
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
      <SignUp
        onSignUp={handleSignUp}
        isLoading={isLoading}
        error={error}
        onSwitchToLogin={() => navigate("/login")}
        walletInfo={{
          type: walletType,
          address: walletAddress,
          message: walletMessage,
        }}
      />
    </>
  );
};

export default SignUpPage;
