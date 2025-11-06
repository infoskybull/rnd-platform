import React from "react";
import { useWalletState } from "../hooks/useWalletState";
import { useTonConnect } from "../hooks/useTonConnect";
import { apiTestUtils } from "../utils/apiTestUtils";
import { useAppSelector } from "../store/hooks";
import { getUserCreatedDateTime } from "../utils/userUtils";
import { useComprehensiveLogout } from "../hooks/useComprehensiveLogout";

/**
 * Debug component to test wallet state synchronization
 * This component can be temporarily added to any page to verify wallet state
 */
const WalletStateDebug: React.FC = () => {
  const walletState = useWalletState();
  const { disconnect } = useTonConnect();
  const { logout: comprehensiveLogout } = useComprehensiveLogout();
  const authState = useAppSelector((state) => state.auth);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await comprehensiveLogout();
      console.log("Comprehensive logout completed successfully");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleApiTest = async () => {
    await apiTestUtils.runFullTest();
  };

  const handleTestTonConnectSync = async () => {
    await apiTestUtils.testTonConnectStateSync();
  };

  const handleLogApiState = () => {
    apiTestUtils.logApiServiceState();
  };

  const handleTestSerialization = () => {
    console.log("🧪 Testing Redux state serialization...");

    // Test if we can serialize the entire auth state
    try {
      const serialized = JSON.stringify(authState);
      console.log("✅ Auth state is serializable");
      console.log("Serialized auth state:", serialized);

      // Test if we can parse it back
      const parsed = JSON.parse(serialized);
      console.log("✅ Auth state can be parsed back");
      console.log("Parsed auth state:", parsed);

      // Test user createdAt field
      if (parsed.user?.createdAt) {
        console.log("✅ User createdAt is string:", parsed.user.createdAt);
        console.log("Formatted date:", getUserCreatedDateTime(parsed.user));
      }
    } catch (error) {
      console.error("❌ Auth state is not serializable:", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 text-white text-sm max-w-sm z-50">
      <h3 className="font-bold mb-2 text-green-400">Wallet State Debug</h3>

      <div className="space-y-2">
        <div>
          <span className="text-gray-400">TON Connect:</span>
          <span
            className={`ml-2 ${
              walletState.tonConnect.isConnected
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {walletState.tonConnect.isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {walletState.tonConnect.walletAddress && (
          <div>
            <span className="text-gray-400">Address:</span>
            <span className="ml-2 text-blue-400 text-xs">
              {walletState.tonConnect.walletAddress.slice(0, 6)}...
              {walletState.tonConnect.walletAddress.slice(-4)}
            </span>
          </div>
        )}

        <div>
          <span className="text-gray-400">Any Wallet:</span>
          <span
            className={`ml-2 ${
              walletState.isAnyWalletConnected
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {walletState.isAnyWalletConnected ? "Yes" : "No"}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Active Type:</span>
          <span className="ml-2 text-yellow-400">
            {walletState.activeWalletType || "None"}
          </span>
        </div>

        {authState.user && (
          <div>
            <span className="text-gray-400">User Created:</span>
            <span className="ml-2 text-cyan-400 text-xs">
              {getUserCreatedDateTime(authState.user)}
            </span>
          </div>
        )}

        {walletState.tonConnect.isLoading && (
          <div className="text-yellow-400">Loading...</div>
        )}

        {walletState.tonConnect.error && (
          <div className="text-red-400 text-xs">
            Error: {walletState.tonConnect.error}
          </div>
        )}
      </div>

      <div className="mt-3 space-x-2 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleDisconnect}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            Disconnect
          </button>
          <button
            onClick={handleLogout}
            className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
          >
            Logout
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleApiTest}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Test API
          </button>
          <button
            onClick={handleLogApiState}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
          >
            Log State
          </button>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleTestSerialization}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Test Serialization
          </button>
          <button
            onClick={handleTestTonConnectSync}
            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
          >
            Test TON Sync
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletStateDebug;
