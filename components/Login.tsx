import React, { useState, useEffect, useRef } from "react";
import {
  LoginCredentials,
  TonConnectLoginCredentials,
  Web3WalletCredentials,
} from "../types";
import RnDLogo from "./icons/RnDLogo";
import Web3WalletModal from "./Web3WalletModal";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onLoginWith2FA?: (
    credentials: LoginCredentials & { token: string }
  ) => Promise<void>;
  onTonConnectLogin: (credentials: Web3WalletCredentials) => Promise<void>;
  onSwitchToSignUp: () => void;
  isLoading?: boolean;
  error?: string | null | { message?: string; requires2FA?: boolean };
  clearError?: () => void;
  requires2FAFromGlobal?: boolean;
  clear2FARequired?: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLogin,
  onLoginWith2FA,
  onTonConnectLogin,
  onSwitchToSignUp,
  isLoading = false,
  error,
  clearError,
  requires2FAFromGlobal,
  clear2FARequired,
}) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginCredentials>>({});
  const [isWeb3ModalOpen, setIsWeb3ModalOpen] = useState(false);

  // 2FA state - use ref to track if we've detected 2FA requirement + force render trigger
  const [requires2FA, setRequires2FA] = useState(false);
  const twoFARequirementRef = useRef(false);
  const [forceRender, setForceRender] = useState(0); // Force re-render trigger
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Debug: Log component mount/unmount
  useEffect(() => {
    console.log("[Login] Component mounted/render");
    return () => {
      console.log("[Login] Component cleanup/unmounting");
    };
  }, []);

  // Debug: Log when requires2FA changes
  useEffect(() => {
    console.log("[Login] requires2FA state changed:", requires2FA);
    console.log(
      "[Login] twoFARequirementRef.current:",
      twoFARequirementRef.current
    );
    if (requires2FA) {
      console.log("[Login] ✅ 2FA form should be visible now");
      twoFARequirementRef.current = true;
    } else if (twoFARequirementRef.current) {
      console.log(
        "[Login] ⚠️ WARNING: requires2FA is false but ref is true! State was reset!"
      );
    }
  }, [requires2FA]);

  // Check global requires2FA flag and sync local state
  useEffect(() => {
    if (requires2FAFromGlobal) {
      console.log(
        "[Login] Detected requires2FA from global state, setting state"
      );
      twoFARequirementRef.current = true;
      setRequires2FA(true);
      setTwoFactorError(null);
    }
  }, [requires2FAFromGlobal]);

  // Preserve requires2FA state if error prop changes but we already detected 2FA requirement
  // Also check on every render to restore state if it was reset
  useEffect(() => {
    // If we previously detected 2FA requirement but state was reset, restore it IMMEDIATELY
    if (twoFARequirementRef.current && !requires2FA) {
      console.log(
        "[Login] ⚠️ STATE RESET DETECTED! Restoring requires2FA state immediately"
      );
      console.log(
        "[Login] Ref value:",
        twoFARequirementRef.current,
        "State value:",
        requires2FA
      );
      // Use setTimeout to ensure this runs after any other state updates
      setTimeout(() => {
        if (twoFARequirementRef.current && !requires2FA) {
          setRequires2FA(true);
          setForceRender((prev) => prev + 1);
          console.log("[Login] ✅ State restored");
        }
      }, 0);
    }
  }, [error, requires2FA]); // Check when error or state changes

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();

    if (logoRef.current) {
      tl.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );
    }

    if (formRef.current) {
      tl.fromTo(
        formRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        "-=0.4"
      );
    }
  }, []);

  const validateField = (
    field: keyof LoginCredentials,
    value: string
  ): string | null => {
    // Trim value before validation
    const trimmedValue = value.trim();

    switch (field) {
      case "email":
        if (!trimmedValue) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue))
          return "Please enter a valid email";
        return null;
      case "password":
        if (!trimmedValue) return "Password is required";
        if (trimmedValue.length < 6)
          return "Password must be at least 6 characters";
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    console.log("abc handleInputChange", field, value);
    // Don't trim while typing, only on blur
    setCredentials((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof LoginCredentials) => {
    // Get the actual value from DOM element, not from state
    const inputElement = document.getElementById(field) as HTMLInputElement;
    if (!inputElement) {
      console.log(`Login ${field}: Input element not found`);
      return;
    }

    const originalValue = inputElement.value; // Get actual DOM value
    const trimmedValue = originalValue.trim();

    console.log(`Login ${field} blur:`, {
      original: `"${originalValue}"`,
      trimmed: `"${trimmedValue}"`,
      changed: originalValue !== trimmedValue,
      originalLength: originalValue.length,
      trimmedLength: trimmedValue.length,
    });

    if (trimmedValue !== originalValue) {
      console.log(
        `Login ${field}: Updating state from "${originalValue}" to "${trimmedValue}"`
      );

      // Force update state and trigger re-render
      setCredentials((prev) => {
        const newData = { ...prev, [field]: trimmedValue };
        console.log(`Login ${field}: New state:`, newData);
        return newData;
      });

      // Also force update the input element directly
      const inputElement = document.getElementById(field) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = trimmedValue;
        console.log(
          `Login ${field}: Directly updated input element to:`,
          trimmedValue
        );
      }
    } else {
      console.log(`Login ${field}: No change needed`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If in 2FA step, handle 2FA submission
    if (requires2FA) {
      if (!twoFactorToken || twoFactorToken.length < 6) {
        setTwoFactorError("Please enter a valid 6-digit code");
        return;
      }

      setTwoFactorError(null);

      if (!onLoginWith2FA) {
        setTwoFactorError("2FA login not supported");
        return;
      }

      try {
        await onLoginWith2FA({
          ...credentials,
          rememberMe,
          token: twoFactorToken.trim(),
        });
        // Reset 2FA state on success
        setRequires2FA(false);
        twoFARequirementRef.current = false;
        setForceRender((prev) => prev + 1);
        setTwoFactorToken("");
        clear2FARequired?.();
      } catch (err: any) {
        // Check if error is requires2FA object
        if (err?.requires2FA) {
          setTwoFactorError(err.message || "Invalid 2FA token");
        } else {
          setTwoFactorError(
            typeof err === "string" ? err : err?.message || "2FA login failed"
          );
        }
      }
      return;
    }

    // Trim all fields before validation and submission
    const trimmedCredentials: LoginCredentials = {
      email: credentials.email.trim(),
      password: credentials.password.trim(),
    };

    // Validate all fields
    const errors: Partial<Record<string, string>> = {};
    if (!trimmedCredentials.email || !trimmedCredentials.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedCredentials.email)) {
      errors.email = "Please enter a valid email";
    }

    if (
      !trimmedCredentials.password ||
      trimmedCredentials.password.length < 6
    ) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Don't reset form or credentials when submitting
    // Keep form state intact to avoid unnecessary re-render

    try {
      await onLogin({ ...trimmedCredentials, rememberMe });
      // If login succeeds, navigation will be handled by LoginPage
      // Don't reset form or clear credentials here
    } catch (err: any) {
      // Log error để debug
      console.log("[Login] Login error caught:", err);
      console.log("[Login] Error type:", typeof err);
      console.log("[Login] Error.requires2FA:", err?.requires2FA);
      console.log("[Login] Full error object:", JSON.stringify(err, null, 2));

      // Check if error indicates 2FA is required
      // Check both direct property and nested property
      const is2FARequired =
        err?.requires2FA === true ||
        (typeof err === "object" && err?.requires2FA === true);

      console.log("[Login] is2FARequired:", is2FARequired);

      if (is2FARequired) {
        console.log("[Login] 🔐 2FA REQUIRED - Setting requires2FA to true");

        // CRITICAL: Set ref FIRST (persists across re-renders)
        twoFARequirementRef.current = true;
        console.log("[Login] ✅ Ref set to true:", twoFARequirementRef.current);

        // Force a re-render to ensure UI updates immediately
        setForceRender((prev) => {
          console.log("[Login] Force render trigger:", prev, "→", prev + 1);
          return prev + 1;
        });

        // Then set state - use functional update to avoid stale closures
        setRequires2FA((prev) => {
          console.log(
            "[Login] setRequires2FA callback - prev:",
            prev,
            "→ new: true"
          );
          if (!prev) {
            console.log("[Login] ⚠️ State was false, setting to true now");
          }
          return true;
        });

        setTwoFactorError(null);

        // Verify state is set correctly
        console.log("[Login] ✅ State update queued");
        console.log("[Login] ✅ Ref value:", twoFARequirementRef.current);
        console.log("[Login] ✅ Force render triggered to ensure UI updates");

        // Note: Don't call clearError() here as it may trigger re-render
        // Error will be handled by the component's error prop logic
        // Parent error state is already null in authSlice when requires2FA is detected

        // Don't re-throw error since we're handling it
        return;
      }
      // Other errors are handled by the parent component và sẽ hiển thị thông qua error prop
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div ref={logoRef} className="flex justify-center mb-6">
            <RnDLogo size={80} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {requires2FA || twoFARequirementRef.current
              ? "Verify Your Identity"
              : "Sign in to your account"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            {requires2FA || twoFARequirementRef.current
              ? "Enter your 2FA code to complete login"
              : "Access the RnD Game Marketplace"}
          </p>
        </div>

        <form
          ref={formRef}
          className="mt-8 space-y-6 bg-gray-800 p-8 rounded-xl border border-gray-700"
          onSubmit={handleSubmit}
        >
          {/* Only show error if NOT in 2FA mode OR if it's a 2FA-specific error */}
          {(error || twoFactorError) &&
            !(requires2FA || twoFARequirementRef.current) && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                {typeof error === "string"
                  ? error
                  : error?.message || "An error occurred"}
              </div>
            )}

          {/* Show 2FA error separately - also use ref check */}
          {(requires2FA || twoFARequirementRef.current) && twoFactorError && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {twoFactorError}
            </div>
          )}

          {/* 2FA Banner - use same condition as form to ensure consistency */}
          {(requires2FA || twoFARequirementRef.current) && (
            <div className="bg-blue-900/20 border border-blue-500 text-blue-400 px-4 py-3 rounded-lg animate-fade-in">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">
                    Two-Factor Authentication Required
                  </p>
                  <p className="text-sm">
                    Please enter the 6-digit code from your authenticator app
                    (Google Authenticator, Authy, etc.) or use a backup code.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Force render 2FA form if ref indicates it was detected */}
            {requires2FA || twoFARequirementRef.current ? (
              // 2FA Input Section
              <div className="space-y-4">
                {/* Display email for context */}
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Logging in as:</p>
                  <p className="text-sm font-medium text-white">
                    {credentials.email}
                  </p>
                </div>

                {/* 2FA Code Input */}
                <div>
                  <label
                    htmlFor="twoFactorToken"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    2FA Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="twoFactorToken"
                    name="twoFactorToken"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                    maxLength={8}
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      twoFactorError ? "border-red-500" : "border-gray-600"
                    } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors text-center text-2xl tracking-widest font-mono`}
                    placeholder="000000"
                    value={twoFactorToken}
                    onChange={(e) => {
                      // Only allow digits, limit to 8 characters (for backup codes)
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 8);
                      setTwoFactorToken(value);
                      setTwoFactorError(null);
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {twoFactorToken.length === 6
                        ? "✓ 6-digit code entered"
                        : twoFactorToken.length === 8
                        ? "✓ Backup code entered"
                        : "Enter 6-digit code or 8-character backup code"}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRequires2FA(false);
                        twoFARequirementRef.current = false;
                        setForceRender((prev) => prev + 1);
                        setTwoFactorToken("");
                        setTwoFactorError(null);
                        clearError?.();
                        clear2FARequired?.();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      disabled={isLoading}
                    >
                      ← Back to login
                    </button>
                  </div>
                  {twoFactorError && (
                    <p className="mt-2 text-xs text-red-400">
                      {twoFactorError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              // Normal login inputs
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="email"
                    required
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      fieldErrors.email ? "border-red-500" : "border-gray-600"
                    } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => handleBlur("email")}
                    disabled={isLoading}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-400">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`appearance-none relative block w-full px-3 py-3 border ${
                      fieldErrors.password
                        ? "border-red-500"
                        : "border-gray-600"
                    } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    onBlur={() => handleBlur("password")}
                    disabled={isLoading}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-400">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {!(requires2FA || twoFARequirementRef.current) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 text-indigo-400 focus:ring-2 focus:ring-indigo-400/50 border-gray-500 rounded-sm bg-gray-800/50 transition-all duration-200 cursor-pointer hover:border-indigo-400/50 hover:bg-gray-800"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-300 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  disabled={isLoading}
                  className="font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          {/* Submit Button - Always visible */}
          <div>
            <button
              type="submit"
              disabled={
                isLoading ||
                ((requires2FA || twoFARequirementRef.current) &&
                  twoFactorToken.length < 6 &&
                  twoFactorToken.length !== 8)
              }
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                requires2FA || twoFARequirementRef.current ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Signing in..."
                )
              ) : requires2FA || twoFARequirementRef.current ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Verify 2FA Code
                </span>
              ) : (
                "Sign in"
              )}
            </button>

            {/* Helper text for 2FA */}
            {(requires2FA || twoFARequirementRef.current) && (
              <p className="mt-2 text-center text-xs text-gray-400">
                Enter the code from your authenticator app to complete login
              </p>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="font-medium text-indigo-400 hover:text-indigo-300"
                disabled={isLoading}
              >
                Sign up here
              </button>
            </p>
          </div>
        </form>

        {/* Web3 Wallet Login */}
        <div className="mt-6">
          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">or</span>
            </div>
          </div>

          {/* Web3 Wallet Button */}
          <button
            onClick={() => setIsWeb3ModalOpen(true)}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <div className="flex items-center">
              {/* Web3 Icon */}
              <svg
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Login with Web3 Wallet
            </div>
          </button>
        </div>

        {/* Web3 Wallet Modal */}
        <Web3WalletModal
          isOpen={isWeb3ModalOpen}
          onClose={() => setIsWeb3ModalOpen(false)}
          onWeb3Login={onTonConnectLogin}
          isLoading={isLoading}
          error={typeof error === "string" ? error : error?.message || null}
        />
      </div>
    </div>
  );
};

export default Login;
