import React, { createContext, useContext, useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mainnet, sepolia } from "wagmi/chains";

interface EthereumWalletContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const EthereumWalletContext = createContext<
  EthereumWalletContextType | undefined
>(undefined);

export const useEthereumWallet = () => {
  const context = useContext(EthereumWalletContext);
  if (!context) {
    throw new Error(
      "useEthereumWallet must be used within EthereumWalletProvider"
    );
  }
  return context;
};

interface EthereumWalletProviderProps {
  children: React.ReactNode;
}

// Configure wagmi with RainbowKit
const config = getDefaultConfig({
  appName: "R&D Game Marketplace",
  projectId: "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [mainnet, sepolia],
});

const queryClient = new QueryClient();

export const EthereumWalletProvider: React.FC<EthereumWalletProviderProps> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [walletAddress, setWalletAddress] = React.useState<string | null>(null);

  const connect = async () => {
    // Connection is handled by RainbowKit's ConnectButton
    console.log("Connecting Ethereum wallet...");
  };

  const disconnect = async () => {
    setIsConnected(false);
    setWalletAddress(null);
    console.log("Disconnected from Ethereum wallet");
  };

  const contextValue: EthereumWalletContextType = {
    isConnected,
    walletAddress,
    connect,
    disconnect,
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme()}
          modalSize="compact"
          initialChain={mainnet}
        >
          <EthereumWalletContext.Provider value={contextValue}>
            {children}
          </EthereumWalletContext.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

