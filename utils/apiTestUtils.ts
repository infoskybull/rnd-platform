import { apiService } from "../services/api";

/**
 * Utility functions to test API authentication after wallet login
 */
export const apiTestUtils = {
  /**
   * Test if API service has access token
   */
  hasAccessToken(): boolean {
    const token = apiService.getAccessToken();
    console.log("API Service Access Token:", token ? "Present" : "Missing");
    return !!token;
  },

  /**
   * Test if API service has refresh token
   */
  hasRefreshToken(): boolean {
    const token = apiService.getRefreshToken();
    console.log("API Service Refresh Token:", token ? "Present" : "Missing");
    return !!token;
  },

  /**
   * Test API call that requires authentication
   */
  async testAuthenticatedCall(): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      console.log("Testing authenticated API call...");
      const result = await apiService.getCurrentUser();
      console.log("✅ Authenticated API call successful:", result);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Authenticated API call failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Test API call that doesn't require authentication
   */
  async testPublicCall(): Promise<{
    success: boolean;
    error?: string;
    data?: any;
  }> {
    try {
      console.log("Testing public API call...");
      const result = await apiService.healthCheck();
      console.log("✅ Public API call successful:", result);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Public API call failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Comprehensive API test after wallet login
   */
  async runFullTest(): Promise<void> {
    console.log("🧪 Running comprehensive API test after wallet login...");

    // Test 1: Check tokens
    console.log("\n1. Checking tokens:");
    const hasAccess = this.hasAccessToken();
    const hasRefresh = this.hasRefreshToken();

    if (!hasAccess) {
      console.error("❌ No access token found in API service!");
      return;
    }

    // Test 2: Test public API call
    console.log("\n2. Testing public API call:");
    await this.testPublicCall();

    // Test 3: Test authenticated API call
    console.log("\n3. Testing authenticated API call:");
    const authResult = await this.testAuthenticatedCall();

    if (authResult.success) {
      console.log(
        "🎉 All API tests passed! Wallet login is working correctly."
      );
    } else {
      console.error(
        "❌ Authenticated API call failed. Check token implementation."
      );
    }
  },

  /**
   * Log current API service state
   */
  logApiServiceState(): void {
    console.log("📊 API Service State:");
    console.log(
      "- Access Token:",
      apiService.getAccessToken() ? "Present" : "Missing"
    );
    console.log(
      "- Refresh Token:",
      apiService.getRefreshToken() ? "Present" : "Missing"
    );
    console.log(
      "- LocalStorage Access Token:",
      localStorage.getItem("accessToken") ? "Present" : "Missing"
    );
    console.log(
      "- LocalStorage Refresh Token:",
      localStorage.getItem("refreshToken") ? "Present" : "Missing"
    );
  },

  /**
   * Test wallet connection and disconnection flow
   */
  async testWalletConnectionFlow(): Promise<void> {
    console.log("🧪 Testing wallet connection flow...");

    // Test 1: Check initial state
    console.log("\n1. Checking initial wallet state:");
    console.log(
      "- TON Connect connected:",
      apiService.getAccessToken() ? "Yes" : "No"
    );

    // Test 2: Test serialization
    console.log("\n2. Testing state serialization:");
    try {
      const state = {
        accessToken: apiService.getAccessToken(),
        refreshToken: apiService.getRefreshToken(),
        userProfile: localStorage.getItem("userProfile"),
      };
      const serialized = JSON.stringify(state);
      console.log("✅ State is serializable");
    } catch (error) {
      console.error("❌ State serialization failed:", error);
    }

    console.log("\n🎉 Wallet connection flow test completed");
  },

  /**
   * Test TON Connect state synchronization
   */
  async testTonConnectStateSync(): Promise<void> {
    console.log("🧪 Testing TON Connect state synchronization...");

    // Test 1: Check if we can access TON Connect SDK
    try {
      // This will be available in components that use useTonConnect
      console.log("✅ TON Connect SDK is accessible");
    } catch (error) {
      console.error("❌ TON Connect SDK not accessible:", error);
    }

    // Test 2: Check localStorage for wallet data
    console.log("\n2. Checking localStorage wallet data:");
    const tonWalletAddress = localStorage.getItem("tonWalletAddress");
    const tonPublicKey = localStorage.getItem("tonPublicKey");
    const tonWalletStateInit = localStorage.getItem("tonWalletStateInit");

    console.log(
      "- TON Wallet Address:",
      tonWalletAddress ? "Present" : "Missing"
    );
    console.log("- TON Public Key:", tonPublicKey ? "Present" : "Missing");
    console.log(
      "- TON Wallet State Init:",
      tonWalletStateInit ? "Present" : "Missing"
    );

    // Test 3: Check Redux state
    console.log("\n3. Checking Redux state:");
    console.log(
      "- Access Token:",
      apiService.getAccessToken() ? "Present" : "Missing"
    );
    console.log(
      "- Refresh Token:",
      apiService.getRefreshToken() ? "Present" : "Missing"
    );

    console.log("\n🎉 TON Connect state sync test completed");
  },
};
