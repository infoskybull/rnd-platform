import { useState, useCallback } from "react";
import { WalletCheckResult, WalletCheckRequest } from "../types";
import { walletService } from "../services/walletService";

export const useWalletCheck = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkWallet = useCallback(
    async (
      address: string,
      walletType: string
    ): Promise<WalletCheckResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await walletService.checkWalletExists(
          address,
          walletType
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || "Failed to check wallet");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    checkWallet,
    loading,
    error,
    clearError,
  };
};

export default useWalletCheck;
