import React, { createContext, useContext, useState, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

// Phantom wallet interface
interface PhantomProvider {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected: boolean;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction: (transaction: any) => Promise<{ signature: string }>;
  signMessage: (
    message: Uint8Array,
    display?: string
  ) => Promise<{ signature: Uint8Array }>;
  connect: (opts?: {
    onlyIfTrusted?: boolean;
  }) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: string, callback: (args: any) => void) => void;
  removeListener: (event: string, callback: (args: any) => void) => void;
  // Additional methods for newer Phantom versions
  request?: (args: { method: string; params?: any }) => Promise<any>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider;
    };
    solana?: PhantomProvider; // Some versions expose the provider directly
  }
}

interface SolanaWalletContextType {
  publicKey: PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
}

const SolanaWalletContext = createContext<SolanaWalletContextType | undefined>(
  undefined
);

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error("useSolanaWallet must be used within SolanaWalletProvider");
  }
  return context;
};

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export const SolanaWalletProvider: React.FC<SolanaWalletProviderProps> = ({
  children,
}) => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Phantom is installed
  const getPhantomProvider = (): PhantomProvider | null => {
    if (typeof window !== "undefined") {
      console.log("Checking for Phantom wallet...");

      // Try window.solana first (newer approach)
      if (window.solana?.isPhantom) {
        console.log("✅ Phantom wallet found via window.solana!");
        return window.solana as PhantomProvider;
      }

      // Fallback to window.phantom.solana (older approach)
      if (window.phantom?.solana) {
        console.log("✅ Phantom wallet found via window.phantom.solana!");
        return window.phantom.solana as PhantomProvider;
      }

      console.log("❌ Phantom wallet not found");
      console.log("Available solana providers:", {
        solana: !!window.solana,
        phantom: !!window.phantom,
        isPhantom: window.solana?.isPhantom,
      });
    }
    return null;
  };

  // Connect to Phantom wallet
  const connect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getPhantomProvider();

      if (!provider) {
        throw new Error(
          "Phantom wallet not found. Please install Phantom extension."
        );
      }

      console.log("Connecting to Phantom wallet...");
      console.log("Provider object:", provider);
      console.log("Provider.connect type:", typeof provider.connect);

      // Request connection - Phantom's connect method signature
      let response;
      try {
        // DISABLED: Auto-reuse existing connections
        // Always request explicit connection from user to avoid auto-login issues
        // if (provider.isConnected && provider.publicKey) {
        //   console.log(
        //     "Already connected to Phantom, using existing connection"
        //   );
        //   setPublicKey(provider.publicKey);
        //   setIsConnected(true);
        //   console.log(
        //     "✅ Connected to Phantom:",
        //     provider.publicKey.toBase58()
        //   );
        //   return;
        // }

        // Validate that connect method exists
        if (!provider.connect || typeof provider.connect !== "function") {
          throw new Error("Phantom provider does not have a connect method");
        }

        // Try with the standard Phantom connect signature
        console.log("Attempting to call provider.connect()...");
        response = await provider.connect();
        console.log("✅ provider.connect() succeeded");

        // Handle the response
        if (response?.publicKey) {
          setPublicKey(response.publicKey);
          setIsConnected(true);
          console.log(
            "✅ Connected to Phantom:",
            response.publicKey.toBase58()
          );
        } else {
          console.error("❌ No public key in response:", response);
          throw new Error("Failed to get public key from Phantom");
        }
      } catch (connectError: any) {
        console.error("❌ provider.connect() failed:", connectError);
        console.log("Error details:", {
          message: connectError.message,
          code: connectError.code,
          name: connectError.name,
          stack: connectError.stack,
        });

        // Check if it's a user rejection
        if (
          connectError.code === 4001 ||
          connectError.message?.toLowerCase().includes("user rejected")
        ) {
          throw new Error("User rejected the connection request");
        }

        // Provide more helpful error messages
        if (connectError.message?.toLowerCase().includes("not installed")) {
          throw new Error(
            "Phantom wallet is not installed. Please install it from phantom.app"
          );
        }

        throw connectError;
      }
    } catch (err: any) {
      console.error("Failed to connect Phantom wallet:", err);
      setError(err.message || "Failed to connect Phantom wallet");
      setIsConnected(false);
      setPublicKey(null);

      // Re-throw for UI to handle
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from Phantom wallet
  const disconnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const provider = getPhantomProvider();

      if (provider) {
        await provider.disconnect();
        console.log("Disconnected from Phantom wallet");
      }

      setPublicKey(null);
      setIsConnected(false);
    } catch (err: any) {
      console.error("Failed to disconnect Phantom wallet:", err);
      setError(err.message || "Failed to disconnect");

      // Still reset state even if disconnect fails
      setPublicKey(null);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Sign message with Phantom wallet
  const signMessage = async (message: string): Promise<string | null> => {
    try {
      const provider = getPhantomProvider();

      if (!provider || !publicKey) {
        throw new Error("Phantom wallet not connected");
      }

      console.log("Signing message with Phantom:", message);

      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);

      // Sign the message
      const signedMessage = await provider.signMessage(messageBytes, "utf8");

      // Convert signature to base64 string
      const signatureBase64 = Buffer.from(signedMessage.signature).toString(
        "base64"
      );

      console.log("Message signed successfully");
      return signatureBase64;
    } catch (err: any) {
      console.error("Failed to sign message:", err);
      setError(err.message || "Failed to sign message");
      return null;
    }
  };

  // Listen for account changes
  useEffect(() => {
    const provider = getPhantomProvider();

    if (!provider) {
      return;
    }

    const handleAccountChange = (publicKey: PublicKey | null) => {
      if (publicKey) {
        setPublicKey(publicKey);
        setIsConnected(true);
        console.log("Account changed:", publicKey.toBase58());
      } else {
        setPublicKey(null);
        setIsConnected(false);
        console.log("Disconnected from wallet");
      }
    };

    const handleDisconnect = () => {
      setPublicKey(null);
      setIsConnected(false);
      console.log("Wallet disconnected");
    };

    provider.on("accountChanged", handleAccountChange);
    provider.on("disconnect", handleDisconnect);

    return () => {
      provider.removeListener("accountChanged", handleAccountChange);
      provider.removeListener("disconnect", handleDisconnect);
    };
  }, []);

  // DISABLED: Automatic wallet connection check on mount
  // This was causing issues with automatic login requiring signMessage
  // Wallets should only connect when user explicitly clicks connect
  // useEffect(() => {
  //   const checkConnection = async () => {
  //     const provider = getPhantomProvider();

  //     if (provider && provider.isConnected && provider.publicKey) {
  //       try {
  //         setPublicKey(provider.publicKey);
  //         setIsConnected(true);
  //         console.log(
  //           "Already connected to Phantom:",
  //           provider.publicKey.toBase58()
  //         );
  //       } catch (err) {
  //         console.error("Error checking Phantom connection:", err);
  //       }
  //     }
  //   };

  //   checkConnection();
  // }, []);

  const contextValue: SolanaWalletContextType = {
    publicKey,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    signMessage,
  };

  return (
    <SolanaWalletContext.Provider value={contextValue}>
      {children}
    </SolanaWalletContext.Provider>
  );
};
