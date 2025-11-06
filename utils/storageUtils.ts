/**
 * Utility functions for localStorage management
 */

/**
 * Clear all localStorage items
 * This function removes all data stored in localStorage
 */
export const clearAllLocalStorage = (): void => {
  localStorage.clear();
};

/**
 * Clear specific localStorage items related to authentication
 * This function removes only authentication-related data
 */
export const clearAuthLocalStorage = (): void => {
  const authKeys = [
    "accessToken",
    "refreshToken",
    "userProfile",
    "isNewUser",
    "tokenExpiration",
    "tonWalletAddress",
    "tonPublicKey",
    "tonWalletAddress",
    "suiWalletAddress",
    "bnbWalletAddress",
    "solanaWalletAddress",
  ];

  authKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear all wallet-related localStorage items
 * This function removes all wallet connection data
 */
export const clearWalletLocalStorage = (): void => {
  const walletKeys = [
    "tonWalletAddress",
    "tonPublicKey",
    "tonWalletStateInit",
    "suiWalletAddress",
    "bnbWalletAddress",
    "solanaWalletAddress",
    "walletType",
    "walletConnected",
  ];

  walletKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Clear all user-related localStorage items
 * This function removes all user data and preferences
 */
export const clearUserLocalStorage = (): void => {
  const userKeys = [
    "userProfile",
    "isNewUser",
    "userPreferences",
    "userSettings",
    "recentProjects",
    "favoriteProjects",
  ];

  userKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/**
 * Get all localStorage keys
 * This function returns an array of all localStorage keys
 */
export const getAllLocalStorageKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Log all localStorage items (for debugging)
 * This function logs all localStorage items to console
 */
export const logAllLocalStorage = (): void => {
  console.log("=== LocalStorage Contents ===");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value);
    }
  }
  console.log("=== End LocalStorage Contents ===");
};

/**
 * Check if localStorage is available
 * This function checks if localStorage is supported and available
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Reset all Web3 wallet connection states
 * This function disconnects all wallets and clears their states
 * @param tonConnectUI - Optional TON Connect UI instance for disconnection
 */
export const resetAllWeb3Wallets = async (
  tonConnectUI?: any
): Promise<void> => {
  try {
    console.log("Resetting all Web3 wallet states...");

    // Step 1: Disconnect from TON Connect SDK if available
    if (tonConnectUI) {
      try {
        console.log("Disconnecting from TON Connect SDK...");
        await tonConnectUI.disconnect();
        console.log("✅ TON Connect SDK disconnected successfully");
      } catch (disconnectError) {
        console.warn("TON Connect SDK disconnect failed:", disconnectError);
        // Continue with localStorage cleanup even if disconnect fails
      }
    }

    // Step 2: Clear all wallet-related localStorage
    console.log("Clearing all wallet-related localStorage...");
    clearWalletLocalStorage();

    // Step 3: Clear additional wallet keys that might exist
    const additionalWalletKeys = [
      "walletConnected",
      "walletType",
      "walletAddress",
      "walletPublicKey",
      "walletStateInit",
      "tonConnectWalletInfo",
      "tonConnectConnectionSource",
    ];

    additionalWalletKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("✅ All Web3 wallet states have been reset completely");
  } catch (error) {
    console.error("Error resetting Web3 wallets:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Reset TON Connect wallet specifically
 * This function handles TON Connect disconnection
 * @param tonConnectUI - Optional TON Connect UI instance for disconnection
 */
export const resetTonConnectWallet = async (
  tonConnectUI?: any
): Promise<void> => {
  try {
    console.log("Resetting TON Connect wallet...");

    // Step 1: Disconnect from TON Connect SDK if available
    if (tonConnectUI) {
      try {
        console.log("Disconnecting from TON Connect SDK...");
        await tonConnectUI.disconnect();
        console.log("✅ TON Connect SDK disconnected successfully");
      } catch (disconnectError) {
        console.warn("TON Connect SDK disconnect failed:", disconnectError);
        // Continue with localStorage cleanup even if disconnect fails
      }
    }

    // Step 2: Clear TON-specific localStorage
    console.log("Clearing TON-specific localStorage...");
    const tonKeys = [
      "tonWalletAddress",
      "tonPublicKey",
      "tonWalletStateInit",
      "tonConnectWallet",
      "tonConnectAccount",
      "tonConnectWalletInfo",
      "tonConnectConnectionSource",
    ];

    tonKeys.forEach((key) => {
      localStorage.removeItem(key);
    });

    console.log("✅ TON Connect wallet has been reset completely");
  } catch (error) {
    console.error("Error resetting TON Connect wallet:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

/**
 * Safe localStorage operations with error handling
 */
export const safeLocalStorage = {
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error("Failed to set localStorage item:", key, e);
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error("Failed to get localStorage item:", key, e);
      return null;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error("Failed to remove localStorage item:", key, e);
      return false;
    }
  },

  clear: (): boolean => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
      return false;
    }
  },
};
