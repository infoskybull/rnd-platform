import React, { createContext, useContext, useEffect, useState } from "react";
import { WalletProvider } from "@suiet/wallet-kit";
import { useWallet } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

interface SuiWalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
}

const SuiWalletContext = createContext<SuiWalletContextType | undefined>(
  undefined
);

export const useSuiWallet = () => {
  const context = useContext(SuiWalletContext);
  if (!context) {
    throw new Error("useSuiWallet must be used within SuiWalletProvider");
  }
  return context;
};

interface SuiWalletProviderProps {
  children: React.ReactNode;
}

// Inner component that uses the wallet
const SuiWalletProviderInner: React.FC<SuiWalletProviderProps> = ({
  children,
}) => {
  const wallet = useWallet();
  const [error, setError] = useState<string | null>(null);

  // Connect to Sui wallet
  const connect = async () => {
    try {
      setError(null);
      console.log("Connecting to Sui wallet...");

      if (!wallet.connected && wallet.allAvailableWallets.length > 0) {
        const walletName = wallet.allAvailableWallets[0].name;
        await wallet.select(walletName);
      }

      console.log("Connected to Sui wallet:", wallet.address);
    } catch (err: any) {
      console.error("Failed to connect Sui wallet:", err);
      setError(err.message || "Failed to connect Sui wallet");
      throw err;
    }
  };

  // Disconnect from Sui wallet
  const disconnect = async () => {
    try {
      setError(null);
      console.log("Disconnecting from Sui wallet...");
      await wallet.disconnect();
      console.log("Disconnected from Sui wallet");
    } catch (err: any) {
      console.error("Failed to disconnect Sui wallet:", err);
      setError(err.message || "Failed to disconnect");
      throw err;
    }
  };

  // Sign message with Sui wallet
  const signMessage = async (message: string): Promise<string | null> => {
    try {
      if (!wallet.connected || !wallet.address) {
        throw new Error("Sui wallet not connected");
      }

      console.log("Signing message with Sui wallet:", message);

      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const result = await wallet.signMessage({
        message: messageBytes,
      });

      console.log("Message signed successfully");
      return result.signature;
    } catch (err: any) {
      console.error("Failed to sign message:", err);
      setError(err.message || "Failed to sign message");
      return null;
    }
  };

  const contextValue: SuiWalletContextType = {
    walletAddress: wallet.address || null,
    isConnected: wallet.connected || false,
    isLoading: wallet.connecting || false,
    error,
    connect,
    disconnect,
    signMessage,
  };

  return (
    <SuiWalletContext.Provider value={contextValue}>
      {children}
    </SuiWalletContext.Provider>
  );
};

// Main provider with WalletProvider from @suiet/wallet-kit
export const SuiWalletProvider: React.FC<SuiWalletProviderProps> = ({
  children,
}) => {
  return (
    <WalletProvider
      autoConnect={false}
      chains={[
        {
          id: "sui:mainnet",
          name: "Sui Mainnet",
          rpcUrl: "https://fullnode.mainnet.sui.io",
        },
        {
          id: "sui:testnet",
          name: "Sui Testnet",
          rpcUrl: "https://fullnode.testnet.sui.io",
        },
        {
          id: "sui:devnet",
          name: "Sui Devnet",
          rpcUrl: "https://fullnode.devnet.sui.io",
        },
      ]}
    >
      <SuiWalletProviderInner>{children}</SuiWalletProviderInner>
    </WalletProvider>
  );
};
