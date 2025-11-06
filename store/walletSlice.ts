import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Wallet state interface
export interface WalletState {
  // TON Connect state
  tonConnect: {
    isConnected: boolean;
    walletAddress: string | null;
    walletInfo: any | null;
    isLoading: boolean;
    error: string | null;
  };

  // Other wallet states can be added here
  ethereum: {
    isConnected: boolean;
    walletAddress: string | null;
    isLoading: boolean;
    error: string | null;
  };

  sui: {
    isConnected: boolean;
    walletAddress: string | null;
    isLoading: boolean;
    error: string | null;
  };

  solana: {
    isConnected: boolean;
    walletAddress: string | null;
    isLoading: boolean;
    error: string | null;
  };

  // Global wallet state
  isAnyWalletConnected: boolean;
  activeWalletType: "ton" | "ethereum" | "sui" | "solana" | null;
}

// Initial state
const initialState: WalletState = {
  tonConnect: {
    isConnected: false,
    walletAddress: null,
    walletInfo: null,
    isLoading: false,
    error: null,
  },
  ethereum: {
    isConnected: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  },
  sui: {
    isConnected: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  },
  solana: {
    isConnected: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  },
  isAnyWalletConnected: false,
  activeWalletType: null,
};

// Async thunks for wallet operations
export const connectTonWallet = createAsyncThunk(
  "wallet/connectTonWallet",
  async (
    walletData: { address: string; walletInfo: any },
    { rejectWithValue }
  ) => {
    try {
      console.log("Connecting TON wallet to global state:", walletData.address);
      return walletData;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to connect TON wallet"
      );
    }
  }
);

export const disconnectTonWallet = createAsyncThunk(
  "wallet/disconnectTonWallet",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Disconnecting TON wallet from global state");
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to disconnect TON wallet"
      );
    }
  }
);

export const resetAllWallets = createAsyncThunk(
  "wallet/resetAllWallets",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Resetting all wallets in global state");
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to reset wallets"
      );
    }
  }
);

// Wallet slice
const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    // TON Connect actions
    setTonConnectState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        walletAddress: string | null;
        walletInfo?: any;
      }>
    ) => {
      state.tonConnect.isConnected = action.payload.isConnected;
      state.tonConnect.walletAddress = action.payload.walletAddress;
      if (action.payload.walletInfo) {
        state.tonConnect.walletInfo = action.payload.walletInfo;
      }

      // Update global wallet state
      state.isAnyWalletConnected =
        action.payload.isConnected ||
        state.ethereum.isConnected ||
        state.sui.isConnected ||
        state.solana.isConnected;
      state.activeWalletType = action.payload.isConnected
        ? "ton"
        : state.ethereum.isConnected
        ? "ethereum"
        : state.sui.isConnected
        ? "sui"
        : state.solana.isConnected
        ? "solana"
        : null;
    },

    setTonConnectLoading: (state, action: PayloadAction<boolean>) => {
      state.tonConnect.isLoading = action.payload;
    },

    setTonConnectError: (state, action: PayloadAction<string | null>) => {
      state.tonConnect.error = action.payload;
    },

    // Other wallet actions (for future implementation)
    setEthereumWalletState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        walletAddress: string | null;
      }>
    ) => {
      state.ethereum.isConnected = action.payload.isConnected;
      state.ethereum.walletAddress = action.payload.walletAddress;
      updateGlobalWalletState(state);
    },

    setSuiWalletState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        walletAddress: string | null;
      }>
    ) => {
      state.sui.isConnected = action.payload.isConnected;
      state.sui.walletAddress = action.payload.walletAddress;
      updateGlobalWalletState(state);
    },

    setSolanaWalletState: (
      state,
      action: PayloadAction<{
        isConnected: boolean;
        walletAddress: string | null;
      }>
    ) => {
      state.solana.isConnected = action.payload.isConnected;
      state.solana.walletAddress = action.payload.walletAddress;
      updateGlobalWalletState(state);
    },

    // Global wallet actions
    clearAllWalletStates: (state) => {
      state.tonConnect = {
        isConnected: false,
        walletAddress: null,
        walletInfo: null,
        isLoading: false,
        error: null,
      };
      state.ethereum = {
        isConnected: false,
        walletAddress: null,
        isLoading: false,
        error: null,
      };
      state.sui = {
        isConnected: false,
        walletAddress: null,
        isLoading: false,
        error: null,
      };
      state.solana = {
        isConnected: false,
        walletAddress: null,
        isLoading: false,
        error: null,
      };
      state.isAnyWalletConnected = false;
      state.activeWalletType = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Connect TON wallet
      .addCase(connectTonWallet.pending, (state) => {
        state.tonConnect.isLoading = true;
        state.tonConnect.error = null;
      })
      .addCase(connectTonWallet.fulfilled, (state, action) => {
        state.tonConnect.isLoading = false;
        state.tonConnect.isConnected = true;
        state.tonConnect.walletAddress = action.payload.address;
        state.tonConnect.walletInfo = action.payload.walletInfo;
        state.isAnyWalletConnected = true;
        state.activeWalletType = "ton";
      })
      .addCase(connectTonWallet.rejected, (state, action) => {
        state.tonConnect.isLoading = false;
        state.tonConnect.error = action.payload as string;
      })

      // Disconnect TON wallet
      .addCase(disconnectTonWallet.pending, (state) => {
        state.tonConnect.isLoading = true;
      })
      .addCase(disconnectTonWallet.fulfilled, (state) => {
        state.tonConnect.isLoading = false;
        state.tonConnect.isConnected = false;
        state.tonConnect.walletAddress = null;
        state.tonConnect.walletInfo = null;
        state.tonConnect.error = null;
        state.isAnyWalletConnected = false;
        state.activeWalletType = null;
      })
      .addCase(disconnectTonWallet.rejected, (state, action) => {
        state.tonConnect.isLoading = false;
        state.tonConnect.error = action.payload as string;
      })

      // Reset all wallets
      .addCase(resetAllWallets.fulfilled, (state) => {
        state.tonConnect = {
          isConnected: false,
          walletAddress: null,
          walletInfo: null,
          isLoading: false,
          error: null,
        };
        state.ethereum = {
          isConnected: false,
          walletAddress: null,
          isLoading: false,
          error: null,
        };
        state.sui = {
          isConnected: false,
          walletAddress: null,
          isLoading: false,
          error: null,
        };
        state.solana = {
          isConnected: false,
          walletAddress: null,
          isLoading: false,
          error: null,
        };
        state.isAnyWalletConnected = false;
        state.activeWalletType = null;
      });
  },
});

// Helper function to update global wallet state
function updateGlobalWalletState(state: WalletState) {
  const wallets = [
    state.tonConnect,
    { isConnected: state.ethereum.isConnected },
    { isConnected: state.sui.isConnected },
    { isConnected: state.solana.isConnected },
  ];
  const connectedWallet = wallets.find((wallet) => wallet.isConnected);

  state.isAnyWalletConnected = !!connectedWallet;
  state.activeWalletType = connectedWallet
    ? state.tonConnect.isConnected
      ? "ton"
      : state.ethereum.isConnected
      ? "ethereum"
      : state.sui.isConnected
      ? "sui"
      : state.solana.isConnected
      ? "solana"
      : null
    : null;
}

export const {
  setTonConnectState,
  setTonConnectLoading,
  setTonConnectError,
  setEthereumWalletState,
  setSuiWalletState,
  setSolanaWalletState,
  clearAllWalletStates,
} = walletSlice.actions;

export default walletSlice.reducer;
