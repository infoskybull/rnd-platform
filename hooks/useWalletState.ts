import { useAppSelector } from "../store/hooks";

/**
 * Custom hook to access wallet state from Redux store
 * This provides a centralized way to access wallet connection status
 */
export const useWalletState = () => {
  const walletState = useAppSelector((state) => state.wallet);

  return {
    // TON Connect state
    tonConnect: walletState.tonConnect,

    // Other wallet states
    sui: walletState.sui,
    bnb: walletState.bnb,
    solana: walletState.solana,

    // Global wallet state
    isAnyWalletConnected: walletState.isAnyWalletConnected,
    activeWalletType: walletState.activeWalletType,

    // Helper functions
    isWalletConnected: (walletType: "ton" | "sui" | "bnb" | "solana") => {
      switch (walletType) {
        case "ton":
          return walletState.tonConnect.isConnected;
        case "sui":
          return walletState.sui.isConnected;
        case "bnb":
          return walletState.bnb.isConnected;
        case "solana":
          return walletState.solana.isConnected;
        default:
          return false;
      }
    },

    getWalletAddress: (walletType: "ton" | "sui" | "bnb" | "solana") => {
      switch (walletType) {
        case "ton":
          return walletState.tonConnect.walletAddress;
        case "sui":
          return walletState.sui.walletAddress;
        case "bnb":
          return walletState.bnb.walletAddress;
        case "solana":
          return walletState.solana.walletAddress;
        default:
          return null;
      }
    },
  };
};
