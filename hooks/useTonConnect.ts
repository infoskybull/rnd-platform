import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { TonConnectLoginCredentials } from "../types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  setTonConnectState,
  setTonConnectLoading,
  setTonConnectError,
  disconnectTonWallet,
  resetAllWallets,
} from "../store/walletSlice";

export const useTonConnect = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const dispatch = useAppDispatch();

  // Get wallet state from Redux store
  const walletState = useAppSelector((state) => state.wallet.tonConnect);
  const globalWalletState = useAppSelector((state) => state.wallet);

  const isConnected = walletState.isConnected;
  const walletAddress = walletState.walletAddress;
  const isLoading = walletState.isLoading;
  const error = walletState.error;

  // DISABLED: Automatic initial wallet sync
  // This was causing automatic login issues where wallets would connect without user action
  // Wallets should only connect when user explicitly clicks connect
  // useEffect(() => {
  //   // Check initial state when component mounts
  //   const initialWallet = tonConnectUI.account;
  //   console.log("Initial TON Connect state:", initialWallet);

  //   if (initialWallet) {
  //     // Wallet is already connected
  //     dispatch(
  //       setTonConnectState({
  //         isConnected: true,
  //         walletAddress: initialWallet.address,
  //         walletInfo: {
  //           account: initialWallet,
  //           device: {
  //             appName: "Unknown",
  //             appVersion: "Unknown",
  //             platform: "Unknown",
  //             features: [],
  //           },
  //         },
  //       })
  //     );
  //     dispatch(setTonConnectError(null));
  //   } else {
  //     // Wallet is not connected
  //     dispatch(
  //       setTonConnectState({
  //         isConnected: false,
  //         walletAddress: null,
  //         walletInfo: null,
  //       })
  //     );
  //     dispatch(setTonConnectError(null));
  //   }
  // }, [tonConnectUI, dispatch]);

  // Sync TON Connect SDK state changes with Redux store
  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      console.log("TON Connect status changed:", wallet);

      if (wallet) {
        // Wallet connected
        dispatch(
          setTonConnectState({
            isConnected: true,
            walletAddress: wallet.account.address,
            walletInfo: wallet,
          })
        );
        dispatch(setTonConnectError(null));
      } else {
        // Wallet disconnected
        dispatch(
          setTonConnectState({
            isConnected: false,
            walletAddress: null,
            walletInfo: null,
          })
        );
        dispatch(setTonConnectError(null));
      }
    });

    return unsubscribe;
  }, [tonConnectUI, dispatch]);

  // Listen for auth state changes to reset wallet state on logout
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If userProfile is removed (logout), reset wallet state
      if (e.key === "userProfile" && e.newValue === null) {
        console.log("User profile removed - resetting wallet state in Redux");
        dispatch(resetAllWallets());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Log wallet state changes
  useEffect(() => {
    console.log("Wallet state changed:", {
      wallet: !!wallet,
      walletAddress: wallet?.account?.address,
      tonConnectUIWallet: tonConnectUI.account?.address,
      isConnected,
      globalState: walletState,
    });
  }, [wallet, tonConnectUI.account?.address, isConnected, walletState]);

  const connect =
    useCallback(async (): Promise<TonConnectLoginCredentials | null> => {
      dispatch(setTonConnectLoading(true));
      dispatch(setTonConnectError(null));

      try {
        console.log("Starting wallet connection...");

        // DISABLED: Auto-reuse existing wallet connections
        // Always require explicit user connection to avoid auto-login issues
        // const sdkWallet = tonConnectUI.account;
        // console.log("TON Connect SDK wallet state:", sdkWallet);

        // // Check if wallet is already connected (either in Redux or SDK)
        // if ((isConnected && walletAddress) || sdkWallet) {
        //   const connectedAddress = walletAddress || sdkWallet?.address;
        //   console.log("Wallet already connected:", connectedAddress);

        //   // Update Redux state if it's not in sync
        //   if (sdkWallet && !isConnected) {
        //     console.log("Syncing Redux state with SDK state");
        //     dispatch(
        //       setTonConnectState({
        //         isConnected: true,
        //         walletAddress: sdkWallet.address,
        //         walletInfo: {
        //           account: sdkWallet,
        //           device: {
        //             appName: "Unknown",
        //             appVersion: "Unknown",
        //             platform: "Unknown",
        //             features: [],
        //           },
        //         },
        //       })
        //     );
        //   }

        //   // Return existing credentials
        //   const credentials: TonConnectLoginCredentials = {
        //     walletAddress: connectedAddress!,
        //     publicKey: wallet?.account?.publicKey || sdkWallet?.publicKey || "",
        //     walletStateInit:
        //       wallet?.account?.walletStateInit ||
        //       sdkWallet?.walletStateInit ||
        //       "",
        //   };

        //   dispatch(setTonConnectLoading(false));
        //   return credentials;
        // }

        // Always request fresh connection

        const result = await tonConnectUI.connectWallet();

        if (result) {
          console.log("Wallet connected successfully:", result.account.address);

          // Update Redux state
          dispatch(
            setTonConnectState({
              isConnected: true,
              walletAddress: result.account.address,
              walletInfo: result,
            })
          );

          const credentials: TonConnectLoginCredentials = {
            walletAddress: result.account.address,
            publicKey: result.account.publicKey,
            walletStateInit: result.account.walletStateInit,
          };

          return credentials;
        }

        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to connect wallet";
        dispatch(setTonConnectError(errorMessage));
        throw new Error(errorMessage);
      } finally {
        dispatch(setTonConnectLoading(false));
      }
    }, [tonConnectUI, dispatch, isConnected, walletAddress, wallet]);

  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      try {
        console.log("Signing message...");

        // Simple check - if tonConnectUI.account exists, we can sign
        if (!tonConnectUI.account?.address) {
          throw new Error("Wallet not connected - please connect wallet first");
        }

        dispatch(setTonConnectLoading(true));
        dispatch(setTonConnectError(null));

        const result = await tonConnectUI.signData({
          type: "text",
          text: message,
        });

        if (result && result.signature) {
          console.log("Message signed successfully");
          return result.signature;
        }

        return null;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sign message";
        dispatch(setTonConnectError(errorMessage));
        throw new Error(errorMessage);
      } finally {
        dispatch(setTonConnectLoading(false));
      }
    },
    [tonConnectUI, dispatch]
  );

  const disconnect = useCallback(async () => {
    dispatch(setTonConnectLoading(true));
    dispatch(setTonConnectError(null));

    try {
      console.log("Starting TON Connect disconnect...");

      // Force disconnect from TON Connect SDK
      await tonConnectUI.disconnect();

      // Immediately force reset Redux state to ensure it's cleared
      dispatch(
        setTonConnectState({
          isConnected: false,
          walletAddress: null,
          walletInfo: null,
        })
      );

      // Double-check after a short delay
      setTimeout(() => {
        const currentWallet = tonConnectUI.account;
        if (currentWallet) {
          console.warn(
            "Wallet still connected after disconnect, forcing state reset"
          );
          dispatch(
            setTonConnectState({
              isConnected: false,
              walletAddress: null,
              walletInfo: null,
            })
          );
        } else {
          console.log("✅ Wallet successfully disconnected from SDK");
        }
      }, 200);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect wallet";
      dispatch(setTonConnectError(errorMessage));
      console.error("Error during TON Connect disconnect:", err);

      // Force reset state even if disconnect fails
      dispatch(
        setTonConnectState({
          isConnected: false,
          walletAddress: null,
          walletInfo: null,
        })
      );

      throw new Error(errorMessage);
    } finally {
      dispatch(setTonConnectLoading(false));
    }
  }, [tonConnectUI, dispatch]);

  const sendTransaction = useCallback(
    async (transaction: any) => {
      if (!isConnected) {
        throw new Error("Wallet not connected");
      }

      dispatch(setTonConnectLoading(true));
      dispatch(setTonConnectError(null));

      try {
        const result = await tonConnectUI.sendTransaction(transaction);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Transaction failed";
        dispatch(setTonConnectError(errorMessage));
        throw new Error(errorMessage);
      } finally {
        dispatch(setTonConnectLoading(false));
      }
    },
    [tonConnectUI, isConnected, dispatch]
  );

  const logout = useCallback(async () => {
    dispatch(setTonConnectLoading(true));
    dispatch(setTonConnectError(null));

    try {
      console.log("Starting TON Connect logout...");

      // Force disconnect from TON Connect SDK
      await tonConnectUI.disconnect();

      // Immediately force reset Redux state to ensure it's cleared
      dispatch(
        setTonConnectState({
          isConnected: false,
          walletAddress: null,
          walletInfo: null,
        })
      );

      // Double-check after a short delay
      setTimeout(() => {
        const currentWallet = tonConnectUI.account;
        if (currentWallet) {
          console.warn(
            "Wallet still connected after disconnect, forcing state reset"
          );
          dispatch(
            setTonConnectState({
              isConnected: false,
              walletAddress: null,
              walletInfo: null,
            })
          );
        } else {
          console.log("✅ Wallet successfully disconnected from SDK");
        }
      }, 200);

      console.log("TON Connect wallet logged out successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to logout wallet";
      dispatch(setTonConnectError(errorMessage));
      console.error("Error during TON Connect logout:", err);

      // Force reset state even if disconnect fails
      dispatch(
        setTonConnectState({
          isConnected: false,
          walletAddress: null,
          walletInfo: null,
        })
      );

      // Don't throw error here as logout should always complete
    } finally {
      dispatch(setTonConnectLoading(false));
    }
  }, [tonConnectUI, dispatch]);

  const clearError = useCallback(() => {
    dispatch(setTonConnectError(null));
  }, [dispatch]);

  const canSkipSigning = useCallback(
    (address: string): boolean => {
      return (
        isConnected &&
        walletAddress === address &&
        wallet &&
        wallet.account?.address === address
      );
    },
    [isConnected, walletAddress, wallet]
  );

  return {
    isConnected,
    walletAddress,
    isLoading,
    error,
    connect,
    signMessage,
    disconnect,
    logout,
    sendTransaction,
    clearError,
    canSkipSigning,
    tonConnectUI,
    // Additional global state access
    globalWalletState,
  };
};
