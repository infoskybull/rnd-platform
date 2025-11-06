import React, { useState, useEffect, useRef } from "react";
import { SignUpData } from "../types";
import RnDLogo from "./icons/RnDLogo";
import { gsap } from "gsap";
import { useNavigate } from "react-router-dom";

interface SignUpProps {
  onSignUp: (data: SignUpData) => Promise<void>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
  walletInfo?: {
    type: string | null;
    address: string | null;
    message: string | null;
  };
}

const SignUp: React.FC<SignUpProps> = ({
  onSignUp,
  onSwitchToLogin,
  isLoading = false,
  error,
  walletInfo,
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignUpData>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "publisher",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    field: keyof SignUpData,
    value: string | "publisher" | "creator"
  ): string | null => {
    const stringValue = String(value);
    // Trim value before validation for text fields
    const trimmedValue = field === "role" ? stringValue : stringValue.trim();

    switch (field) {
      case "email":
        if (!trimmedValue) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue))
          return "Please enter a valid email";
        return null;
      case "password":
        if (!trimmedValue) return "Password is required";
        if (trimmedValue.length < 8)
          return "Password must be at least 8 characters";
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(trimmedValue))
          return "Password must contain uppercase, lowercase, and number";
        return null;
      case "firstName":
        if (!trimmedValue) return "First name is required";
        if (trimmedValue.length < 2)
          return "First name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(trimmedValue))
          return "First name can only contain letters and spaces";
        return null;
      case "lastName":
        if (!trimmedValue) return "Last name is required";
        if (trimmedValue.length < 2)
          return "Last name must be at least 2 characters";
        if (!/^[a-zA-Z\s]+$/.test(trimmedValue))
          return "Last name can only contain letters and spaces";
        return null;
      case "role":
        if (!stringValue) return "Please select a role";
        if (!["publisher", "creator"].includes(stringValue))
          return "Please select a valid role";
        return null;
      case "confirmPassword":
        if (!trimmedValue) return "Please confirm your password";
        if (trimmedValue !== formData.password) return "Passwords do not match";
        return null;
      default:
        return null;
    }
  };

  const handleInputChange = (field: keyof SignUpData, value: string) => {
    // Don't trim while typing, only on blur
    setFormData((prev) => ({ ...prev, [field]: value as any }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }

    // Also validate confirm password when password changes
    if (field === "password" && formData.confirmPassword) {
      const confirmPasswordError = validateField(
        "confirmPassword",
        formData.confirmPassword
      );
      if (confirmPasswordError) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        const newErrors = { ...fieldErrors };
        delete newErrors.confirmPassword;
        setFieldErrors(newErrors);
      }
    }
  };

  const handleBlur = (field: keyof SignUpData) => {
    // Only trim text fields, not role (radio button)
    if (field !== "role" && typeof formData[field] === "string") {
      // Get the actual value from DOM element, not from state
      const inputElement = document.getElementById(field) as HTMLInputElement;
      if (!inputElement) {
        console.log(`SignUp ${field}: Input element not found`);
        return;
      }

      const originalValue = inputElement.value; // Get actual DOM value
      const trimmedValue = originalValue.trim();

      console.log("abc", originalValue, trimmedValue);
      console.log(`SignUp ${field} blur:`, {
        original: `"${originalValue}"`,
        trimmed: `"${trimmedValue}"`,
        changed: originalValue !== trimmedValue,
        isString: typeof formData[field] === "string",
        originalLength: originalValue.length,
        trimmedLength: trimmedValue.length,
      });

      if (trimmedValue !== originalValue) {
        console.log(
          `SignUp ${field}: Updating state from "${originalValue}" to "${trimmedValue}"`
        );

        // Force update state and trigger re-render
        setFormData((prev) => {
          const newData = { ...prev, [field]: trimmedValue };
          console.log(`SignUp ${field}: New state:`, newData);
          return newData;
        });

        // Also force update the input element directly
        const inputElement = document.getElementById(field) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = trimmedValue;
          console.log(
            `SignUp ${field}: Directly updated input element to:`,
            trimmedValue
          );
        }
      } else {
        console.log(`SignUp ${field}: No change needed`);
      }
    } else {
      console.log(`SignUp ${field} blur: Skipped (role field or not string)`, {
        field,
        isRole: field === "role",
        type: typeof formData[field],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trim all text fields before validation and submission
    const trimmedFormData: SignUpData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password.trim(),
      confirmPassword: formData.confirmPassword.trim(),
      role: formData.role, // Don't trim role (radio button)
    };

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(trimmedFormData).forEach((key) => {
      const field = key as keyof SignUpData;
      const error = validateField(field, trimmedFormData[field]);
      if (error) errors[field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      await onSignUp(trimmedFormData);
    } catch (err) {
      // Error handling is done by the parent component
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div ref={logoRef} className="flex justify-center mb-6">
            <RnDLogo size={80} />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Join the RnD Game Marketplace
          </p>
        </div>

        <form
          ref={formRef}
          className="mt-8 space-y-6 bg-gray-800 p-8 rounded-xl border border-gray-700"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Wallet Message Display */}
          {walletInfo?.message && (
            <div className="bg-yellow-900/20 border border-yellow-500 text-yellow-400 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span>{walletInfo.message}</span>
              </div>
              {walletInfo.address && (
                <div className="mt-2 text-sm text-yellow-300">
                  <span className="font-medium">Wallet Address:</span>
                  <div className="mt-1 break-all text-xs font-mono bg-yellow-900/30 px-2 py-1 rounded border border-yellow-600/30">
                    {walletInfo.address}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    fieldErrors.firstName ? "border-red-500" : "border-gray-600"
                  } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  onBlur={() => handleBlur("firstName")}
                  disabled={isLoading}
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 border ${
                    fieldErrors.lastName ? "border-red-500" : "border-gray-600"
                  } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  onBlur={() => handleBlur("lastName")}
                  disabled={isLoading}
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-400">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Required for KYC (Know Your Customer) verification
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Role <span className="text-red-400">*</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="role-publisher"
                    name="role"
                    type="radio"
                    value="publisher"
                    checked={formData.role === "publisher"}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    disabled={isLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <label
                    htmlFor="role-publisher"
                    className="ml-3 text-sm text-gray-300"
                  >
                    <span className="font-medium">Publisher</span>
                    <span className="block text-xs text-gray-500">
                      Buy and distribute games to customers
                    </span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="role-creator"
                    name="role"
                    type="radio"
                    value="creator"
                    checked={formData.role === "creator"}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    disabled={isLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 bg-gray-700"
                  />
                  <label
                    htmlFor="role-creator"
                    className="ml-3 text-sm text-gray-300"
                  >
                    <span className="font-medium">Creator</span>
                    <span className="block text-xs text-gray-500">
                      Create and upload games for sale
                    </span>
                  </label>
                </div>
              </div>
              {fieldErrors.role && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.role}</p>
              )}
            </div>

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
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
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
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  fieldErrors.password ? "border-red-500" : "border-gray-600"
                } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                disabled={isLoading}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-400">
                  {fieldErrors.password}
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
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none relative block w-full px-3 py-3 border ${
                  fieldErrors.confirmPassword
                    ? "border-red-500"
                    : "border-gray-600"
                } placeholder-gray-400 text-gray-100 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:z-10 sm:text-sm transition-colors`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleBlur("confirmPassword")}
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg">
            <p className="text-sm">
              <span className="font-semibold">KYC Notice:</span> Your name and
              role selection will be used for identity verification to comply
              with marketplace regulations. This information is securely stored
              and used only for verification and role-based access control
              purposes.
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-medium text-indigo-400 hover:text-indigo-300"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
