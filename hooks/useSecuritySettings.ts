import { useState, useCallback } from "react";
import { apiService } from "../services/api";

export const useChangePassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const response = await apiService.changePassword(
          currentPassword,
          newPassword
        );

        if (response.success) {
          setSuccess(response.message || "Password changed successfully");
          return { success: true };
        } else {
          throw new Error(response.message || "Failed to change password");
        }
      } catch (err: any) {
        // Handle error response from API
        let errorMessage = "Failed to change password";

        if (err instanceof Error) {
          errorMessage = err.message;
        }

        // Special handling for common error messages
        if (errorMessage.includes("Current password is incorrect")) {
          errorMessage =
            "Current password is incorrect. Please check and try again.";
        } else if (errorMessage.includes("User does not have a password set")) {
          errorMessage =
            "Your account doesn't have a password set. Please use forgot password to set one.";
        } else if (
          errorMessage.includes("must be longer than or equal to 8 characters")
        ) {
          errorMessage = "New password must be at least 8 characters long.";
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    changePassword,
    loading,
    error,
    success,
    clearMessages,
  };
};

export const useTwoFactorAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);

  const generateSecret = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.generate2FASecret();

      if (response.success && response.data) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setBackupCodes(response.data.backupCodes);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || "Failed to generate 2FA secret");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate 2FA secret";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const enable = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.enable2FA(token);

      if (response.success) {
        setIs2FAEnabled(true);
        if (response.data?.backupCodes) {
          setBackupCodes(response.data.backupCodes);
        }
        setSuccess(response.message || "2FA enabled successfully");
        return { success: true, backupCodes: response.data?.backupCodes };
      } else {
        throw new Error(response.message || "Failed to enable 2FA");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to enable 2FA";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const verify = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.verify2FA(token);

      if (response.success) {
        const verified = response.data?.verified || false;
        if (verified) {
          setSuccess("2FA token verified successfully");
        } else {
          setError("Invalid 2FA token");
        }
        return { success: verified };
      } else {
        throw new Error(response.message || "Failed to verify 2FA token");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to verify 2FA token";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.disable2FA();

      if (response.success) {
        setIs2FAEnabled(false);
        setQrCodeUrl(null);
        setBackupCodes([]);
        setSuccess(response.message || "2FA disabled successfully");
        return { success: true };
      } else {
        throw new Error(response.message || "Failed to disable 2FA");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disable 2FA";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const resetSetup = useCallback(() => {
    setQrCodeUrl(null);
    setBackupCodes([]);
    setError(null);
    setSuccess(null);
  }, []);

  return {
    generateSecret,
    enable,
    verify,
    disable,
    loading,
    error,
    success,
    qrCodeUrl,
    backupCodes,
    is2FAEnabled,
    setIs2FAEnabled,
    clearMessages,
    resetSetup,
  };
};
