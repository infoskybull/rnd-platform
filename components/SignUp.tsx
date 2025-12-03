import React, { useState, useEffect, useRef } from "react";
import { SignUpData } from "../types";
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

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Entrance animation for form
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
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
    // Handle role field explicitly to ensure proper type
    if (field === "role") {
      const roleValue = value as "publisher" | "creator";
      console.log("Role changed to:", roleValue);
      setFormData((prev) => ({ ...prev, [field]: roleValue }));
    } else {
      // Don't trim while typing, only on blur
      setFormData((prev) => ({ ...prev, [field]: value as any }));
    }

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

    // Log the role being submitted for debugging
    console.log("Submitting signup with role:", trimmedFormData.role);
    console.log("Full form data:", {
      ...trimmedFormData,
      password: "***",
      confirmPassword: "***",
    });

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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top Navigation */}
      <div className="w-full px-6 py-4 flex items-center justify-between bg-white">
        <div className="font-bold text-gray-900 text-lg">Platform</div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-base font-semibold text-gray-900"
            disabled={isLoading}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="text-base text-gray-900 hover:text-gray-700"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 bg-gray-100">
        <div className="max-w-lg w-full">
          <form
            ref={formRef}
            className="bg-white p-10 rounded-xl shadow-2xl space-y-6"
            onSubmit={handleSubmit}
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Create your account
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Wallet Message Display */}
            {walletInfo?.message && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
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
                  <div className="mt-2 text-sm text-yellow-700">
                    <span className="font-medium">Wallet Address:</span>
                    <div className="mt-1 break-all text-xs font-mono bg-yellow-100 px-2 py-1 rounded border border-yellow-300">
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
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    className={`appearance-none relative block w-full px-3 py-2.5 border ${
                      fieldErrors.firstName
                        ? "border-red-500"
                        : "border-gray-300"
                    } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors`}
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    onBlur={() => handleBlur("firstName")}
                    disabled={isLoading}
                  />
                  {fieldErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    className={`appearance-none relative block w-full px-3 py-2.5 border ${
                      fieldErrors.lastName
                        ? "border-red-500"
                        : "border-gray-300"
                    } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors`}
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    onBlur={() => handleBlur("lastName")}
                    disabled={isLoading}
                  />
                  {fieldErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Required for KYC (Know Your Customer) verification
              </p>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Role
                </label>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      id="role-publisher"
                      name="role"
                      type="radio"
                      value="publisher"
                      checked={formData.role === "publisher"}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value)
                      }
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 bg-white mt-0.5"
                    />
                    <label
                      htmlFor="role-publisher"
                      className="ml-3 text-sm text-gray-900"
                    >
                      <span className="font-medium block">Publisher</span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Buy and distribute games to customers
                      </span>
                    </label>
                  </div>
                  <div className="flex items-start">
                    <input
                      id="role-creator"
                      name="role"
                      type="radio"
                      value="creator"
                      checked={formData.role === "creator"}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value)
                      }
                      disabled={isLoading}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 bg-white mt-0.5"
                    />
                    <label
                      htmlFor="role-creator"
                      className="ml-3 text-sm text-gray-900"
                    >
                      <span className="font-medium block">Creator</span>
                      <span className="block text-xs text-gray-500 mt-0.5">
                        Create and upload games for sale
                      </span>
                    </label>
                  </div>
                </div>
                {fieldErrors.role && (
                  <p className="mt-2 text-sm text-red-600">
                    {fieldErrors.role}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-900 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  required
                  className={`appearance-none relative block w-full px-3 py-2.5 border ${
                    fieldErrors.email ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  className="block text-sm font-bold text-gray-900 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2.5 border ${
                    fieldErrors.password ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors`}
                  placeholder="Create a strong password"
                  value={formData.password}
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
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-gray-900 mb-2"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-2.5 border ${
                    fieldErrors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleBlur("confirmPassword")}
                  disabled={isLoading}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
