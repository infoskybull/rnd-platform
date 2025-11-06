import { useCallback } from "react";
import { useAuth } from "./useAuth";
import { useTonConnect } from "./useTonConnect";

/**
 * Custom hook for comprehensive logout functionality
 * This hook ensures both auth and wallet states are properly cleared
 */
export const useComprehensiveLogout = () => {
  const { logout: authLogout } = useAuth();
  const { logout: tonLogout, disconnect } = useTonConnect();

  const logout = useCallback(async () => {
    try {
      console.log("Starting comprehensive logout...");

      // Step 1: Disconnect from TON Connect UI
      try {
        console.log("Disconnecting from TON Connect UI...");
        await tonLogout();
        console.log("✅ TON Connect UI disconnected");
      } catch (tonError) {
        console.warn("TON Connect logout failed:", tonError);
        // Try disconnect as fallback
        try {
          await disconnect();
          console.log("✅ TON Connect disconnected via fallback");
        } catch (disconnectError) {
          console.warn("TON Connect disconnect also failed:", disconnectError);
        }
      }

      // Step 2: Logout from auth system
      try {
        console.log("Logging out from auth system...");
        await authLogout();
        console.log("✅ Auth logout completed");
      } catch (authError) {
        console.error("Auth logout failed:", authError);
        throw authError;
      }

      console.log("🎉 Comprehensive logout completed successfully");
    } catch (error) {
      console.error("Comprehensive logout failed:", error);
      throw error;
    }
  }, [authLogout, tonLogout, disconnect]);

  return { logout };
};
