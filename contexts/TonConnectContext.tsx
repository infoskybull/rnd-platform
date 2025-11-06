import React, { createContext, useContext, useEffect, useState } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { THEME } from "@tonconnect/ui";

interface TonConnectContextType {
  isConnected: boolean;
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const TonConnectContext = createContext<TonConnectContextType | undefined>(
  undefined
);

export const useTonConnectContext = () => {
  const context = useContext(TonConnectContext);
  if (!context) {
    throw new Error(
      "useTonConnectContext must be used within a TonConnectProvider"
    );
  }
  return context;
};

interface TonConnectProviderProps {
  children: React.ReactNode;
  manifestUrl?: string;
}

export const TonConnectProvider: React.FC<TonConnectProviderProps> = ({
  children,
  manifestUrl,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connect = async () => {
    // This will be handled by the TonConnectUIProvider
    console.log("Connecting to TON wallet...");
  };

  const disconnect = async () => {
    setIsConnected(false);
    setWalletAddress(null);
    console.log("Disconnected from TON wallet");
  };

  const contextValue: TonConnectContextType = {
    isConnected,
    walletAddress,
    connect,
    disconnect,
  };

  return (
    <TonConnectContext.Provider value={contextValue}>
      <TonConnectUIProvider
        manifestUrl={
          manifestUrl ||
          "https://dev1line.github.io/nft-factory/tonconnect-manifest.json"
        }
        uiPreferences={{
          theme: THEME.DARK,
          borderRadius: "m",
        }}
        walletsListConfiguration={{
          includeWallets: [
            {
              appName: "tonwallet",
              name: "TON Wallet",
              imageUrl: "https://wallet.ton.org/assets/ui/qr-logo.png",
              aboutUrl:
                "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd",
              universalLink: "https://wallet.ton.org/ton-connect",
              jsBridgeKey: "tonwallet",
              bridgeUrl: "https://bridge.tonapi.io/bridge",
              platforms: ["chrome", "android"],
            },
            {
              appName: "mytonwallet",
              name: "MyTonWallet",
              imageUrl: "https://mytonwallet.io/static/tonconnect_logo.png",
              aboutUrl:
                "https://chrome.google.com/webstore/detail/mytonwallet/fldfpgipocagafmlnkjoadhabalfnheo",
              universalLink: "https://app.mytonwallet.io",
              jsBridgeKey: "mytonwallet",
              bridgeUrl: "https://bridge.tonapi.io/bridge",
              platforms: ["chrome", "android"],
            },
          ],
        }}
        actionsConfiguration={{
          twaReturnUrl: "https://t.me/rnd_game_marketplace_bot",
        }}
      >
        {children}
      </TonConnectUIProvider>
    </TonConnectContext.Provider>
  );
};
