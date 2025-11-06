import React, { useState, useRef, useEffect } from "react";
import { apiService } from "../services/api";
import RnDLogo from "./icons/RnDLogo";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

type Step = "email" | "pin" | "password" | "success";

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState<string | null>(
    () => {
      // Load verification status from localStorage if exists
      const pinVerified = localStorage.getItem("pinVerified");
      return pinVerified ? "verified" : null;
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load verification status from localStorage on mount
  useEffect(() => {
    const pinVerified = localStorage.getItem("pinVerified");
    if (pinVerified && !verificationToken) {
      setVerificationToken("verified");
      // If PIN is verified, we should be on the password step
      if (currentStep !== "password") {
        setCurrentStep("password");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
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
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === "pin") {
      const firstEmptyIndex = pin.findIndex((digit) => digit === "");
      if (firstEmptyIndex !== -1 && pinInputRefs.current[firstEmptyIndex]) {
        pinInputRefs.current[firstEmptyIndex]?.focus();
      }
    }
  }, [currentStep, pin]);

  const validateEmail = (email: string): string | null => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Please enter a valid email";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    const trimmed = password.trim();
    if (!trimmed) return "Password is required";
    if (trimmed.length < 8) return "Password must be at least 8 characters";
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmed))
      return "Password must contain uppercase, lowercase, and number";
    return null;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }

    // Clear any old verification status when starting a new reset flow
    localStorage.removeItem("pinVerified");
    setVerificationToken(null);

    setIsLoading(true);
    try {
      await apiService.requestForgotPassword(email.trim());
      setCurrentStep("pin");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send verification code";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 5 && pinInputRefs.current[index + 1]) {
      pinInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    const newPin = [...pin];

    digits.split("").forEach((digit, index) => {
      if (index < 6) {
        newPin[index] = digit;
      }
    });

    setPin(newPin);
    if (pastedData.length >= 6) {
      pinInputRefs.current[5]?.focus();
    } else {
      pinInputRefs.current[pastedData.length]?.focus();
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.some((digit) => !digit)) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const pinString = pin.join("");
      const response = await apiService.verifyForgotPasswordPin(
        email.trim(),
        pinString
      );
      // PIN verified successfully, move to password step
      setVerificationToken("verified");
      localStorage.setItem("pinVerified", "true");
      setCurrentStep("password");
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Invalid verification code";
      setError(errorMessage);
      setPin(["", "", "", "", "", ""]);
      pinInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setFieldErrors({ newPassword: passwordError });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    // Verify that PIN was verified before allowing password reset
    if (verificationToken !== "verified") {
      setError("Verification is missing. Please start over.");
      return;
    }

    setIsLoading(true);
    try {
      // Pass email to reset password API
      await apiService.resetPassword(email.trim(), newPassword.trim());
      // Clear the verification status from localStorage after successful reset
      localStorage.removeItem("pinVerified");
      setVerificationToken(null);
      setNewPassword("");
      setConfirmPassword("");
      setPin(["", "", "", "", "", ""]);
      // Move to success step
      setCurrentStep("success");
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset password";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "email":
        return (
          <>
            <h2 className="text-2xl在过去 font-bold text-white mb-2">
              Forgot your password?
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your email address and we'll send you a 6-digit verification
              code
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => {
                    if (email.trim() !== email) {
                      setEmail(email.trim());
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-3 border ${
                    fieldErrors.email ? "border-red-500" : "border-gray-600"
                  } rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
                  placeholder="Enter your email"
                  required
                  autoFocus
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Sending..." : "Send verification code"}
              </button>

              <button
                type="button"
                onClick={onBackToLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back to login 显{" "}
              </button>
            </form>
          </>
        );

      case "pin":
        return (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Enter verification code
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                  Enter 6-digit code
                </label>
                <div className="flex gap-2 justify-center">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        pinInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(index, e)}
                      onPaste={handlePinPaste}
                      disabled={isLoading}
                      className="w-12 h-14 text-center text-xl font-bold border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:outlineровка-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Verifying..." : "Verify code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Clear verification status when going back to email
                  localStorage.removeItem("pinVerified");
                  setVerificationToken(null);
                  setPin(["", "", "", "", "", ""]);
                  setCurrentStep("email");
                }}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back to email
              </button>
            </form>
          </>
        );

      case "password":
        return (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Create new password
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Please enter a new password for your account
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  New Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => {
                    if (newPassword.trim() !== newPassword) {
                      setNewPassword(newPassword.trim());
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-3 border ${
                    fieldErrors.newPassword
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
                  placeholder="Enter new password"
                  required
                  autoFocus
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.newPassword}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => {
                    if (confirmPassword.trim() !== confirmPassword) {
                      setConfirmPassword(confirmPassword.trim());
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-3 border ${
                    fieldErrors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-600"
                  } rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors`}
                  placeholder="Confirm new password"
                  required
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm谥号 text-red-400">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Resetting..." : "Reset password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  // Don't clear token when going back to PIN step
                  setCurrentStep("pin");
                }}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Back to code
              </button>
            </form>
          </>
        );

      case "success":
        return (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Your password has been reset successfully. You can now log in with
              your new password.
            </p>

            <div className="flex flex-col items-center justify-center space-y-6">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>

              {/* User Info */}
              <div className="bg-gray-700/50 p-4 rounded-lg w-full border border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Email:</p>
                <p className="text-white font-medium">{email}</p>
              </div>

              {/* Back to Login Button */}
              <button
                onClick={() => {
                  // Clear all state
                  localStorage.removeItem("pinVerified");
                  setVerificationToken(null);
                  setEmail("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setPin(["", "", "", "", "", ""]);
                  navigate("/login");
                }}
                className="w-full py-3 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Back to Login
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div ref={logoRef} className="flex justify-center mb-6">
            <RnDLogo size={80} />
          </div>
        </div>

        <div className="mt-8 space-y-6 bg-gray-800 p-8 rounded-xl border border-gray-700">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
