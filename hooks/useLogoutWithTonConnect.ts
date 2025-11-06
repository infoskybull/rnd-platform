import { useCallback } from "react";
import { useTonConnect } from "./useTonConnect";
import { resetAllWeb3Wallets } from "../utils/storageUtils";
import { apiService } from "../services/api";

/**
 * Custom hook for logout that includes TON Connect SDK disconnection
 * This hook should be used in components that need to logout with wallet disconnection
 */
export const useLogoutWithTonConnect = () => {
  const { disconnect: tonDisconnect, tonConnectUI } = useTonConnect();

  const logoutWithTonConnect = useCallback(async () => {
    try {
      console.log("Starting logout with TON Connect disconnection...");

      // Step 1: Disconnect from TON Connect SDK first
      try {
        console.log("Disconnecting from TON Connect SDK...");
        await tonDisconnect();
        console.log("✅ TON Connect SDK disconnected successfully");
      } catch (tonError) {
        console.warn(
          "TON Connect disconnect failed (may not be connected):",
          tonError
        );
        // Continue with logout even if TON disconnect fails
      }

      // Step 2: Reset all Web3 wallet states
      console.log("Resetting all Web3 wallet states...");
      await resetAllWeb3Wallets(tonConnectUI);

      // Step 3: Logout from API service
      console.log("Logging out from API service...");
      await apiService.logout();

      // Step 4: Clear user profile from localStorage
      console.log("Clearing user profile from localStorage...");
      localStorage.removeItem("userProfile");

      console.log("✅ Logout with TON Connect completed successfully");

      return { success: true };
    } catch (error) {
      console.error("Error during logout with TON Connect:", error);

      // Still proceed with logout even if some steps fail
      try {
        await apiService.logout();
      } catch (apiError) {
        console.error("API logout also failed:", apiError);
      }

      // Clear user profile from localStorage
      localStorage.removeItem("userProfile");

      console.log(
        "⚠️ Logout with TON Connect completed with errors - user state cleared"
      );

      return { success: false, error };
    }
  }, [tonDisconnect, tonConnectUI]);

  return {
    logoutWithTonConnect,
  };
};
