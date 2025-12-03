import React, { useState, useEffect, useRef, memo } from "react";
import { LoginCredentials, Web3WalletCredentials } from "../types";
import { useNavigate } from "react-router-dom";
import CustomCheckbox from "./CustomCheckbox";

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onLoginWith2FA?: (
    credentials: LoginCredentials & { token: string }
  ) => Promise<void>;
  handleWeb3WalletLogin: (credentials: Web3WalletCredentials) => Promise<void>;
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
  handleWeb3WalletLogin,
  isLoading = false,
  error,
  clearError,
  requires2FAFromGlobal,
  clear2FARequired,
}) => {
  const navigate = useNavigate();
  // Use ref to preserve form values across re-renders
  // Try to restore from sessionStorage if available (only for failed login)
  const getInitialCredentials = (): LoginCredentials => {
    try {
      const saved = sessionStorage.getItem("login_credentials");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { email: parsed.email || "", password: parsed.password || "" };
      }
    } catch (e) {
      // Ignore errors
    }
    return { email: "", password: "" };
  };

  const credentialsRef = useRef<LoginCredentials>(getInitialCredentials());
  const [credentials, setCredentials] = useState<LoginCredentials>(
    credentialsRef.current
  );
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginCredentials>>({});
  const [isWeb3ModalOpen, setIsWeb3ModalOpen] = useState(false);

  // Sync ref with state to preserve values
  useEffect(() => {
    credentialsRef.current = credentials;
    // Save to sessionStorage to persist across unmounts (only if has values)
    if (credentials.email || credentials.password) {
      try {
        sessionStorage.setItem(
          "login_credentials",
          JSON.stringify(credentials)
        );
      } catch (e) {
        // Ignore errors
      }
    }
  }, [credentials]);

  // Clear sessionStorage on successful login (when error is cleared)
  useEffect(() => {
    if (!error) {
      // Clear saved credentials when error is cleared (successful login or user cleared error)
      try {
        sessionStorage.removeItem("login_credentials");
      } catch (e) {
        // Ignore errors
      }
    }
  }, [error]);

  // 2FA state - use ref to track if we've detected 2FA requirement + force render trigger
  const [requires2FA, setRequires2FA] = useState(false);
  const twoFARequirementRef = useRef(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

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
  // Use ref to track previous error to avoid unnecessary re-renders
  const previousErrorRef = useRef(error);

  useEffect(() => {
    // Only restore state if error actually changed and we have 2FA requirement
    const errorChanged = previousErrorRef.current !== error;
    previousErrorRef.current = error;

    // If we previously detected 2FA requirement but state was reset, restore it IMMEDIATELY
    if (errorChanged && twoFARequirementRef.current && !requires2FA) {
      console.log(
        "[Login] ⚠️ STATE RESET DETECTED! Restoring requires2FA state immediately"
      );
      // Use setTimeout to ensure this runs after any other state updates
      setTimeout(() => {
        if (twoFARequirementRef.current && !requires2FA) {
          setRequires2FA(true);
          console.log("[Login] ✅ State restored");
        }
      }, 0);
    }
  }, [error, requires2FA]); // Check when error or state changes

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // GSAP animations disabled - ensure form is visible by default
    if (formRef.current) {
      formRef.current.style.opacity = "1";
      formRef.current.style.transform = "translateY(0)";
    }
    if (logoRef.current) {
      logoRef.current.style.opacity = "1";
      logoRef.current.style.transform = "scale(1) rotate(0deg)";
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
    if (process.env.NODE_ENV === "development") {
      console.log("abc handleInputChange", field, value);
    }
    // Don't trim while typing, only on blur
    setCredentials((prev) => {
      const newCredentials = { ...prev, [field]: value };
      // Update ref immediately to preserve values
      credentialsRef.current = newCredentials;
      return newCredentials;
    });

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear global error when user starts typing, but only if they've made a significant change
    // This prevents clearing error too early while still allowing user to see the error message
    if (error && clearError && value.length > 0) {
      // Use a small delay to ensure error is visible for at least a moment
      setTimeout(() => {
        clearError();
      }, 100);
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

    // Prevent default form submission and page reload
    // The form's onSubmit handler will return false to prevent any default behavior

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
      const is2FARequired =
        err?.requires2FA === true ||
        (typeof err === "object" && err?.requires2FA === true);

      if (is2FARequired) {
        twoFARequirementRef.current = true;

        setRequires2FA((prev) => {
          if (!prev) {
            console.log("[Login] ⚠️ State was false, setting to true now");
          }
          return true;
        });

        setTwoFactorError(null);

        return;
      }
      // If login fails (not 2FA), preserve form values
      // Don't clear credentials - user can see their input and try again
      // Keep form state intact to allow user to correct and retry
    }
  };

  return (
    <div className="min-h-screen bg-blue-500 flex flex-col">
      {/* Top Navigation */}
      <div className="w-full px-6 py-4 flex items-center justify-between bg-white">
        <div ref={logoRef} className="font-bold text-gray-900 text-lg">
          Platform
        </div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-base font-semibold text-gray-900"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-base text-gray-900 hover:text-gray-700"
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 bg-blue-500">
        <div className="max-w-md w-full">
          <form
            ref={formRef}
            className="bg-white p-10 rounded-xl shadow-2xl space-y-6"
            style={{ opacity: 1 }}
            onSubmit={(e) => {
              handleSubmit(e);
              return false; // Prevent form submission and page reload
            }}
            noValidate
            autoComplete={error ? "off" : "on"}
            data-form-type="other"
          >
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              {requires2FA || twoFARequirementRef.current
                ? "Verify Your Identity"
                : "Login"}
            </h2>

            {/* Only show error if NOT in 2FA mode OR if it's a 2FA-specific error */}
            {(error || twoFactorError) &&
              !(requires2FA || twoFARequirementRef.current) && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm"
                  style={{ zIndex: 10, position: "relative" }}
                >
                  {typeof error === "string"
                    ? error
                    : error?.message || twoFactorError || "An error occurred"}
                </div>
              )}

            {/* Show 2FA error separately - also use ref check */}
            {(requires2FA || twoFARequirementRef.current) && twoFactorError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {twoFactorError}
              </div>
            )}

            {/* 2FA Banner - use same condition as form to ensure consistency */}
            {(requires2FA || twoFARequirementRef.current) && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                    <p className="font-semibold mb-1 text-sm">
                      Two-Factor Authentication Required
                    </p>
                    <p className="text-xs">
                      Please enter the 6-digit code from your authenticator app
                      (Google Authenticator, Authy, etc.) or use a backup code.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Force render 2FA form if ref indicates it was detected */}
              {requires2FA || twoFARequirementRef.current ? (
                // 2FA Input Section
                <div className="space-y-4">
                  {/* Display email for context */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Logging in as:</p>
                    <p className="text-sm font-medium text-gray-900">
                      {credentials.email}
                    </p>
                  </div>

                  {/* 2FA Code Input */}
                  <div>
                    <label
                      htmlFor="twoFactorToken"
                      className="block text-sm font-medium text-gray-900 mb-2"
                    >
                      2FA Code <span className="text-red-500">*</span>
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
                        twoFactorError ? "border-red-500" : "border-gray-300"
                      } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors text-center text-2xl tracking-widest font-mono`}
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
                      <p className="text-xs text-gray-500">
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

                          setTwoFactorToken("");
                          setTwoFactorError(null);
                          clearError?.();
                          clear2FARequired?.();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        disabled={isLoading}
                      >
                        ← Back to login
                      </button>
                    </div>
                    {twoFactorError && (
                      <p className="mt-2 text-xs text-red-600">
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
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Email address
                    </label>
                    <input
                      id={error ? "login-email-error" : "email"}
                      name={error ? "login-email-error" : "email"}
                      type="text"
                      autoComplete={error ? "off" : "email"}
                      data-form-type="other"
                      data-lpignore="true"
                      required
                      className={`appearance-none relative block w-full px-4 py-3 border ${
                        fieldErrors.email ? "border-red-500" : "border-gray-300"
                      } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all`}
                      placeholder="Enter email"
                      value={credentials.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      onBlur={() => handleBlur("email")}
                      disabled={isLoading}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Password
                    </label>
                    <input
                      id={error ? "login-password-error" : "password"}
                      name={error ? "login-password-error" : "password"}
                      type="password"
                      autoComplete={error ? "new-password" : "current-password"}
                      data-form-type="other"
                      data-lpignore="true"
                      required
                      className={`appearance-none relative block w-full px-4 py-3 border ${
                        fieldErrors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all`}
                      placeholder="Enter password"
                      value={credentials.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      onBlur={() => handleBlur("password")}
                      disabled={isLoading}
                    />
                    {fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {!(requires2FA || twoFARequirementRef.current) && (
              <div className="remember-me-label">
                <CustomCheckbox
                  id="remember-me"
                  name="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm font-medium text-gray-900 cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
            )}

            {/* Submit Button - Always visible */}
            <div className="flex flex-col items-center">
              <button
                type="submit"
                disabled={
                  isLoading ||
                  ((requires2FA || twoFARequirementRef.current) &&
                    twoFactorToken.length < 6 &&
                    twoFactorToken.length !== 8)
                }
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-500 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
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
                  "Submit"
                )}
              </button>

              {/* Helper text for 2FA */}
              {(requires2FA || twoFARequirementRef.current) && (
                <p className="mt-2 text-center text-xs text-gray-500">
                  Enter the code from your authenticator app to complete login
                </p>
              )}
            </div>

            {/* Forgot password link */}
            {!(requires2FA || twoFARequirementRef.current) && (
              <div className="flex justify-end mt-3 w-full">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-blue-500 disabled:opacity-50 transition-colors"
                >
                  Forgot <span className="text-blue-500">password?</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Web3 Wallet Login - Hidden */}
      <div className="hidden max-w-md w-full mx-auto px-4 mt-6">
        {/* Divider */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-100 text-gray-500">or</span>
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
      {/* <Web3WalletModal
        isOpen={isWeb3ModalOpen}
        onClose={() => setIsWeb3ModalOpen(false)}
        onWeb3Login={handleWeb3WalletLogin}
        isLoading={isLoading}
        error={typeof error === "string" ? error : error?.message || null}
      /> */}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Custom comparison function to only re-render when relevant props change
export default memo(Login, (prevProps, nextProps) => {
  // Only re-render if these props actually change
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.error === nextProps.error &&
    prevProps.requires2FAFromGlobal === nextProps.requires2FAFromGlobal &&
    prevProps.onLogin === nextProps.onLogin &&
    prevProps.onLoginWith2FA === nextProps.onLoginWith2FA &&
    prevProps.handleWeb3WalletLogin === nextProps.handleWeb3WalletLogin &&
    prevProps.clearError === nextProps.clearError &&
    prevProps.clear2FARequired === nextProps.clear2FARequired &&
    prevProps.onSwitchToSignUp === nextProps.onSwitchToSignUp
  );
});
