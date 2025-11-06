import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import { useTonConnect } from "../hooks/useTonConnect";
import { useWalletCheck } from "../hooks/useWalletCheck";
import { Web3WalletCredentials } from "../types";
import { useNavigate } from "react-router-dom";
import { walletService } from "../services/walletService";
import { useAccount, useConnect, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useSuiWallet } from "../contexts/SuiWalletContext";

interface Web3WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeb3Login: (credentials: Web3WalletCredentials) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const Web3WalletModal: React.FC<Web3WalletModalProps> = ({
  isOpen,
  onClose,
  onWeb3Login,
  isLoading = false,
  error,
}) => {
  const navigate = useNavigate();
  const {
    checkWallet,
    loading: walletCheckLoading,
    error: walletCheckError,
  } = useWalletCheck();
  const {
    connect: connectTon,
    signMessage: signTonMessage,
    disconnect,
    isLoading: tonLoading,
    error: tonError,
    canSkipSigning,
    globalWalletState,
    isConnected: isTonConnected,
    walletAddress: tonWalletAddress,
  } = useTonConnect();

  // Ethereum/Wagmi hooks
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { signMessageAsync: signEthMessage } = useSignMessage();

  // Sui wallet hooks - using direct Sui wallet connection
  const {
    walletAddress: suiWalletAddress,
    isConnected: isSuiConnected,
    isLoading: isSuiLoading,
    error: suiError,
    connect: connectSui,
    disconnect: disconnectSui,
    signMessage: signSuiMessage,
  } = useSuiWallet();

  // Solana wallet hooks - using direct Phantom connection
  const {
    publicKey,
    isConnected: isSolanaConnected,
    isLoading: isSolanaLoading,
    error: solanaError,
    connect: connectSolana,
    disconnect: disconnectSolana,
    signMessage: signSolanaMessage,
  } = useSolanaWallet();

  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "info" | "warning" | "error";
    message: string;
  } | null>(null);

  // Track connection states for each wallet
  const [isEthConnecting, setIsEthConnecting] = useState(false);
  const [isSuiConnecting, setIsSuiConnecting] = useState(false);
  const [isSolanaConnecting, setIsSolanaConnecting] = useState(false);

  // Track if we need to process Solana connection after wallet is connected
  const [processSolanaConnection, setProcessSolanaConnection] = useState(false);

  // Ref to track if we've already processed this publicKey
  const processedPublicKeyRef = useRef<string | null>(null);

  // Memoize current publicKey to avoid unnecessary recalculations
  const currentPublicKey = useMemo(() => publicKey?.toString(), [publicKey]);

  // Force refresh state when modal opens/closes to ensure status accuracy
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // When modal opens for the first time
    if (isOpen && !wasOpenRef.current) {
      console.log("Web3WalletModal opened - current status:", {
        isTonConnected,
        tonWalletAddress,
        isEthConnected,
        ethAddress,
        isSuiConnected,
        suiWalletAddress,
        isSolanaConnected: !!publicKey,
        solanaAddress: publicKey?.toString(),
      });
      wasOpenRef.current = true;
    }

    // When modal closes
    if (!isOpen && wasOpenRef.current) {
      console.log("Web3WalletModal closed - resetting state");
      processedPublicKeyRef.current = null;
      setProcessSolanaConnection(false);
      wasOpenRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen to prevent unnecessary rerenders

  // Handle Solana wallet connection after approval - memoized to prevent rerenders
  const handleApprovedConnection = useCallback(async () => {
    if (!processSolanaConnection || !publicKey || isSolanaConnecting) return;

    console.log("Processing Solana connection for:", publicKey.toString());
    setProcessSolanaConnection(false);
    setIsSolanaConnecting(true);

    try {
      const walletAddress = publicKey.toString();

      // Check if wallet exists
      const walletCheck = await checkWallet(walletAddress, "solana");

      if (walletCheck?.exists) {
        // Generate auth message and sign for Solana wallet
        console.log("Generating auth message from backend...");
        const messageResult = await walletService.generateAuthMessage(
          walletAddress,
          "solana"
        );

        if (!messageResult.success) {
          throw new Error("Failed to generate authentication message");
        }

        const authMessage = messageResult.data.message;
        console.log("Generated auth message:", authMessage);

        // Sign the message with Solana wallet
        console.log("Signing message...");
        const signature = await signSolanaMessage(authMessage);

        if (signature) {
          console.log("Message signed successfully");

          // Connect wallet via API
          console.log("Connecting wallet via API...");
          const connectResult = await walletService.connectWallet(
            "solana",
            walletAddress,
            authMessage,
            signature
          );

          console.log("Wallet connect result:", connectResult);

          if (connectResult.success) {
            // Call the original onWeb3Login callback with the result
            const web3Credentials: Web3WalletCredentials = {
              walletAddress: walletAddress,
              walletType: "solana",
              signature: signature,
              message: authMessage,
            };

            await onWeb3Login(web3Credentials);
            onClose();
          } else {
            throw new Error(
              connectResult.message || "Failed to connect wallet"
            );
          }
        } else {
          throw new Error("Failed to sign message");
        }
      } else {
        setNotification({
          type: "warning",
          message:
            "Ví chưa được liên kết với tài khoản nào. Vui lòng tạo tài khoản trước tiên.",
        });

        setTimeout(() => {
          navigate(
            `/signup?wallet=solana&address=${encodeURIComponent(walletAddress)}`
          );
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to process Solana connection:", err);
      setNotification({
        type: "error",
        message: `Connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSolanaConnecting(false);
    }
  }, [
    processSolanaConnection,
    publicKey,
    isSolanaConnecting,
    checkWallet,
    navigate,
    onClose,
    signSolanaMessage,
    onWeb3Login,
  ]);

  useEffect(() => {
    handleApprovedConnection();
  }, [handleApprovedConnection]);

  // Auto-trigger processing when publicKey becomes available (only when modal is open)
  useEffect(() => {
    if (!isOpen) return;

    if (!currentPublicKey || isSolanaConnecting || processSolanaConnection)
      return;

    // Only trigger if this is a new publicKey
    if (processedPublicKeyRef.current !== currentPublicKey) {
      console.log(
        "Solana wallet connected, auto-triggering process for:",
        currentPublicKey
      );
      processedPublicKeyRef.current = currentPublicKey;

      // Small delay to ensure state is settled
      const timeoutId = setTimeout(() => {
        setProcessSolanaConnection(true);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, currentPublicKey, isSolanaConnecting, processSolanaConnection]);

  const handleTonConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Step 1: Connect wallet
      const tonCredentials = await connectTon();
      if (!tonCredentials || !tonCredentials.walletAddress) {
        throw new Error("Failed to connect TON wallet");
      }

      console.log("Connected wallet:", tonCredentials.walletAddress);

      // Step 2: Check if wallet exists
      const walletCheck = await checkWallet(
        tonCredentials.walletAddress,
        "ton"
      );

      console.log("Wallet check result:", walletCheck);

      if (walletCheck) {
        if (walletCheck.exists) {
          // Step 3: Wallet exists - sign message for authentication
          console.log("Wallet exists, signing message for authentication");

          // Wait for wallet state to be properly updated after connection
          console.log("Waiting for wallet state to sync...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Check if wallet is properly connected before signing
          console.log("Current wallet state:", {
            isTonConnected,
            tonWalletAddress,
            expectedAddress: tonCredentials.walletAddress,
          });

          try {
            // Generate authentication message from backend (like in SettingsTab)
            console.log("Generating auth message from backend...");
            const messageResult = await walletService.generateAuthMessage(
              tonCredentials.walletAddress,
              "ton"
            );

            if (!messageResult.success) {
              throw new Error("Failed to generate authentication message");
            }

            const authMessage = messageResult.data.message;
            console.log("Generated auth message:", authMessage);

            // Sign the message with the wallet
            console.log("Signing message...");
            const signature = await signTonMessage(authMessage);

            if (signature) {
              console.log("Message signed successfully");

              // Use walletService.connectWallet instead of onWeb3Login
              console.log("Connecting wallet via API...");
              const connectResult = await walletService.connectWallet(
                "ton",
                tonCredentials.walletAddress,
                authMessage,
                signature
              );

              console.log("Wallet connect result:", connectResult);

              if (connectResult.success) {
                // Call the original onWeb3Login callback with the result
                const web3Credentials: Web3WalletCredentials = {
                  walletAddress: tonCredentials.walletAddress,
                  walletType: "ton",
                  signature: signature,
                  message: authMessage,
                };

                await onWeb3Login(web3Credentials);
                onClose();
              } else {
                throw new Error(
                  connectResult.message || "Failed to connect wallet"
                );
              }
            } else {
              throw new Error("Failed to sign message");
            }
          } catch (signError) {
            console.error("Signing process failed:", signError);
            throw new Error(
              `Signing failed: ${
                signError instanceof Error ? signError.message : "Unknown error"
              }`
            );
          }
        } else {
          // Step 4: Wallet doesn't exist - show notification and navigate to signup
          console.log("Wallet doesn't exist, redirecting to signup");

          const notificationMessage =
            "Ví chưa được liên kết với tài khoản nào. Vui lòng tạo tài khoản trước tiên.";

          setNotification({
            type: "warning",
            message: notificationMessage,
          });

          // Navigate to signup with wallet info after a short delay
          setTimeout(() => {
            navigate(
              `/signup?wallet=ton&address=${encodeURIComponent(
                tonCredentials.walletAddress
              )}&message=${encodeURIComponent(notificationMessage)}`
            );
            onClose();
          }, 2000);
        }
      } else {
        throw new Error("Failed to check wallet status");
      }
    } catch (err) {
      console.error("TON Connect login failed:", err);
      setNotification({
        type: "error",
        message: `Login failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    } finally {
      setIsConnecting(false);
    }
  }, [
    connectTon,
    checkWallet,
    isTonConnected,
    tonWalletAddress,
    signTonMessage,
    onWeb3Login,
    onClose,
    navigate,
  ]);

  // Separate handler for processing Sui wallet (after connection)
  const processSuiWallet = useCallback(async () => {
    if (!isSuiConnected || !suiWalletAddress || isSuiConnecting) return;

    setIsSuiConnecting(true);
    try {
      const walletAddress = suiWalletAddress;

      // Check if wallet exists
      const walletCheck = await checkWallet(walletAddress, "sui");

      if (walletCheck?.exists) {
        // Generate auth message and sign
        const messageResult = await walletService.generateAuthMessage(
          walletAddress,
          "sui"
        );

        if (!messageResult.success) {
          throw new Error("Failed to generate authentication message");
        }

        const authMessage = messageResult.data.message;

        // Sign with Sui wallet
        const signature = await signSuiMessage(authMessage);

        if (signature) {
          console.log("Message signed successfully");

          // Connect wallet via API
          console.log("Connecting wallet via API...");
          const connectResult = await walletService.connectWallet(
            "sui",
            walletAddress,
            authMessage,
            signature
          );

          console.log("Wallet connect result:", connectResult);

          if (connectResult.success) {
            const credentials: Web3WalletCredentials = {
              walletAddress: walletAddress,
              walletType: "sui",
              signature: signature,
              message: authMessage,
            };

            await onWeb3Login(credentials);
            onClose();
          } else {
            throw new Error(
              connectResult.message || "Failed to connect wallet"
            );
          }
        } else {
          throw new Error("Failed to sign message");
        }
      } else {
        setNotification({
          type: "warning",
          message:
            "Ví chưa được liên kết với tài khoản nào. Vui lòng tạo tài khoản trước tiên.",
        });

        setTimeout(() => {
          navigate(
            `/signup?wallet=sui&address=${encodeURIComponent(walletAddress)}`
          );
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("SUI processing failed:", err);
      setNotification({
        type: "error",
        message: `Connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSuiConnecting(false);
    }
  }, [
    isSuiConnected,
    suiWalletAddress,
    isSuiConnecting,
    checkWallet,
    signSuiMessage,
    onWeb3Login,
    onClose,
    navigate,
  ]);

  const handleSuiConnect = useCallback(async () => {
    // If not connected, trigger connection
    if (!isSuiConnected) {
      console.log("Connecting to Sui wallet...");
      await connectSui();
      console.log("Sui wallet connected");
      return;
    }

    // If already connected, trigger processing
    if (isSuiConnected && suiWalletAddress) {
      await processSuiWallet();
    }
  }, [isSuiConnected, suiWalletAddress, connectSui, processSuiWallet]);

  // Auto-trigger processing when Sui wallet connects
  const [shouldProcessSui, setShouldProcessSui] = useState(false);

  useEffect(() => {
    // DISABLED: Auto-processing Sui wallet on connection
    // if (
    //   shouldProcessSui &&
    //   isSuiConnected &&
    //   suiWalletAddress &&
    //   !isSuiConnecting
    // ) {
    //   console.log("Auto-processing Sui wallet connection");
    //   processSuiWallet();
    //   setShouldProcessSui(false);
    // }
  }, [
    shouldProcessSui,
    isSuiConnected,
    suiWalletAddress,
    isSuiConnecting,
    processSuiWallet,
  ]);

  // DISABLED: Auto-trigger Sui wallet processing on connection
  // Wallets should only process when user explicitly clicks connect/process button
  // useEffect(() => {
  //   if (isSuiConnected && suiWalletAddress && !isSuiConnecting) {
  //     console.log("Sui wallet connected, should process:", suiWalletAddress);
  //     setShouldProcessSui(true);
  //   }
  // }, [isSuiConnected, suiWalletAddress]);

  // Separate handler for processing Ethereum wallet (after connection)
  const processEthWallet = useCallback(async () => {
    if (!isEthConnected || !ethAddress || isEthConnecting) return;

    setIsEthConnecting(true);
    setIsConnecting(true);
    try {
      if (!ethAddress) {
        throw new Error("No wallet address available");
      }

      // Check if wallet exists
      const walletCheck = await checkWallet(ethAddress, "ethereum");

      if (walletCheck?.exists) {
        // Generate auth message and sign
        const messageResult = await walletService.generateAuthMessage(
          ethAddress,
          "ethereum"
        );

        if (!messageResult.success) {
          throw new Error("Failed to generate authentication message");
        }

        const authMessage = messageResult.data.message;

        // Sign with Ethereum wallet
        const signature = await signEthMessage({
          account: ethAddress as `0x${string}`,
          message: authMessage,
        });

        // Connect wallet via API
        const connectResult = await walletService.connectWallet(
          "ethereum",
          ethAddress,
          authMessage,
          signature
        );

        if (connectResult.success) {
          const credentials: Web3WalletCredentials = {
            walletAddress: ethAddress,
            walletType: "ethereum",
            signature: signature,
            message: authMessage,
          };

          await onWeb3Login(credentials);
          onClose();
        } else {
          throw new Error(connectResult.message || "Failed to connect wallet");
        }
      } else {
        setNotification({
          type: "warning",
          message:
            "Ví chưa được liên kết với tài khoản nào. Vui lòng tạo tài khoản trước tiên.",
        });

        setTimeout(() => {
          navigate(
            `/signup?wallet=ethereum&address=${encodeURIComponent(ethAddress)}`
          );
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Ethereum Connect failed:", err);
      setNotification({
        type: "error",
        message: `Connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      });
    } finally {
      setIsEthConnecting(false);
      setIsConnecting(false);
    }
  }, [
    isEthConnected,
    ethAddress,
    isEthConnecting,
    checkWallet,
    signEthMessage,
    onWeb3Login,
    onClose,
    navigate,
  ]);

  const handleEthConnect = useCallback(async () => {
    // Ethereum uses RainbowKit ConnectButton, so this is mainly for processing
    if (isEthConnected && ethAddress) {
      await processEthWallet();
    } else {
      setNotification({
        type: "info",
        message: "Please connect your wallet using the Connect button",
      });
    }
  }, [isEthConnected, ethAddress, processEthWallet]);

  // DISABLED: Auto-trigger processing when Ethereum wallet connects
  // const [shouldProcessEth, setShouldProcessEth] = useState(false);

  // useEffect(() => {
  //   if (shouldProcessEth && isEthConnected && ethAddress && !isEthConnecting) {
  //     console.log("Auto-processing Ethereum wallet connection");
  //     processEthWallet();
  //     setShouldProcessEth(false);
  //   }
  // }, [
  //   shouldProcessEth,
  //   isEthConnected,
  //   ethAddress,
  //   isEthConnecting,
  //   processEthWallet,
  // ]);

  // DISABLED: Auto-trigger Ethereum wallet processing on connection
  // useEffect(() => {
  //   if (isEthConnected && ethAddress && !isEthConnecting) {
  //     console.log("Ethereum wallet connected, should process:", ethAddress);
  //     setShouldProcessEth(true);
  //   }
  // }, [isEthConnected, ethAddress]);

  const handleProcessSolanaAfterConnect = useCallback(() => {
    console.log("Process Solana - publicKey:", publicKey);
    if (publicKey && !isSolanaConnecting) {
      setProcessSolanaConnection(true);
    }
  }, [publicKey, isSolanaConnecting]);

  const handleConnectSolanaWallet = useCallback(async () => {
    try {
      console.log("Connecting to Phantom...");
      await connectSolana();
      console.log("Phantom connection triggered");
    } catch (error) {
      console.error("Failed to connect Phantom:", error);
      setNotification({
        type: "error",
        message:
          "Failed to connect Phantom. Please make sure the extension is installed.",
      });
    }
  }, [connectSolana]);

  // Memoize computed values to prevent unnecessary recalculations
  const displayError = useMemo(
    () => error || tonError || walletCheckError,
    [error, tonError, walletCheckError]
  );
  const displayLoading = useMemo(
    () => isLoading || tonLoading || isConnecting || walletCheckLoading,
    [isLoading, tonLoading, isConnecting, walletCheckLoading]
  );

  return (
    <>
      {!isOpen ? null : (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
              onClick={onClose}
            ></div>

            {/* Modal panel */}
            <div className="relative inline-block transform overflow-hidden rounded-lg bg-gray-800 px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6 sm:align-middle">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Connect Web3 Wallet
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* Close button */}
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Choose your preferred wallet to connect
                </p>
              </div>

              {/* Connection Status Indicators */}
              {isTonConnected && (
                <div className="mb-4 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      TON Wallet Connected: {tonWalletAddress?.slice(0, 6)}...
                      {tonWalletAddress?.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {isEthConnected && (
                <div className="mb-4 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      Ethereum Wallet Connected: {ethAddress?.slice(0, 6)}...
                      {ethAddress?.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {isSuiConnected && suiWalletAddress && (
                <div className="mb-4 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      SUI Wallet Connected: {suiWalletAddress?.slice(0, 6)}...
                      {suiWalletAddress?.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {publicKey && (
                <div className="mb-4 bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      Solana Wallet Connected:{" "}
                      {publicKey.toString().slice(0, 6)}...
                      {publicKey.toString().slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {displayError && (
                <div className="mb-4 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                  {displayError}
                </div>
              )}

              {/* Notification Display */}
              {notification && (
                <div
                  className={`px-4 py-3 rounded-lg mb-4 ${
                    notification.type === "warning"
                      ? "bg-yellow-900/20 border border-yellow-500 text-yellow-400"
                      : notification.type === "error"
                      ? "bg-red-900/20 border border-red-500 text-red-400"
                      : "bg-blue-900/20 border border-blue-500 text-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{notification.message}</span>
                    <button
                      onClick={() => setNotification(null)}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Wallet Options */}
              <div className="space-y-3">
                {/* TON Wallet */}
                <button
                  onClick={handleTonConnect}
                  disabled={displayLoading || isTonConnected}
                  className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    isTonConnected
                      ? "border-green-500 bg-green-900/20 hover:bg-green-900/30"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                  } ${
                    displayLoading || isTonConnected
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* TON Logo */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="/coins/ton.png"
                        alt="TON"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">TON Wallet</p>
                      <p className="text-gray-400 text-sm">
                        {isTonConnected
                          ? `Connected: ${tonWalletAddress?.slice(
                              0,
                              6
                            )}...${tonWalletAddress?.slice(-4)}`
                          : "Connect your TON wallet"}
                      </p>
                    </div>
                  </div>
                  {isTonConnected ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">
                        CONNECTED
                      </span>
                    </div>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>

                {/* SUI Wallet */}
                <button
                  onClick={handleSuiConnect}
                  disabled={
                    displayLoading || isSuiConnecting || !!suiWalletAddress
                  }
                  className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    suiWalletAddress
                      ? "border-green-500 bg-green-900/20"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                  } ${
                    displayLoading || isSuiConnecting
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* SUI Logo */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="/coins/sui.png"
                        alt="SUI"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">SUI Wallet</p>
                      <p className="text-gray-400 text-sm">
                        {suiWalletAddress
                          ? `Connected: ${suiWalletAddress?.slice(
                              0,
                              6
                            )}...${suiWalletAddress?.slice(-4)}`
                          : "Connect your SUI wallet"}
                      </p>
                    </div>
                  </div>
                  {isSuiConnecting ? (
                    <svg
                      className="animate-spin h-5 w-5 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : suiWalletAddress ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">
                        CONNECTED
                      </span>
                    </div>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>

                {/* Ethereum/Metamask Wallet */}
                <ConnectButton.Custom>
                  {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    authenticationStatus,
                    mounted,
                  }) => {
                    const ready = mounted && authenticationStatus !== "loading";
                    const connected =
                      ready &&
                      account &&
                      chain &&
                      (!authenticationStatus ||
                        authenticationStatus === "authenticated");

                    return (
                      <div
                        {...(!ready && {
                          "aria-hidden": true,
                          style: {
                            opacity: 0,
                            pointerEvents: "none",
                            userSelect: "none",
                          },
                        })}
                      >
                        <button
                          onClick={!connected ? openConnectModal : undefined}
                          className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                            isEthConnected
                              ? "border-green-500 bg-green-900/20"
                              : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {/* Ethereum Logo */}
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-white">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37258 18.6274 0 12 0C5.37258 0 0 5.37258 0 12C0 18.6274 5.37258 24 12 24Z"
                                  fill="#627EEA"
                                />
                                <path
                                  d="M12.498 6V9.653L17.996 11.764L12.498 6Z"
                                  fill="white"
                                  fillOpacity="0.602"
                                />
                                <path
                                  d="M12.498 6L7 11.764L12.498 9.653V6Z"
                                  fill="white"
                                />
                                <path
                                  d="M12.498 16.476V20.129L18 12.584L12.498 14.695V16.476Z"
                                  fill="white"
                                  fillOpacity="0.602"
                                />
                                <path
                                  d="M12.498 20.129V16.476L7 12.584L12.498 20.129Z"
                                  fill="white"
                                />
                                <path
                                  d="M12.498 15.429L17.996 11.764L12.498 13.875V15.429Z"
                                  fill="white"
                                  fillOpacity="0.2"
                                />
                                <path
                                  d="M7 11.764L12.498 15.429V13.875L7 11.764Z"
                                  fill="white"
                                  fillOpacity="0.602"
                                />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="text-white font-medium">
                                Ethereum Wallet
                              </p>
                              <p className="text-gray-400 text-sm">
                                {isEthConnected
                                  ? `Connected: ${ethAddress?.slice(
                                      0,
                                      6
                                    )}...${ethAddress?.slice(-4)}`
                                  : "Connect via Metamask"}
                              </p>
                            </div>
                          </div>
                          {isEthConnected ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-green-400 text-xs font-medium">
                                CONNECTED
                              </span>
                            </div>
                          ) : (
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  }}
                </ConnectButton.Custom>

                {/* Solana Wallet */}
                <button
                  onClick={
                    publicKey
                      ? handleProcessSolanaAfterConnect
                      : handleConnectSolanaWallet
                  }
                  disabled={isSolanaConnecting || isSolanaLoading}
                  className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    publicKey
                      ? "border-green-500 bg-green-900/20 hover:bg-green-900/30"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                  } ${
                    isSolanaConnecting || isSolanaLoading
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Solana Logo */}
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src="/coins/solana.png"
                        alt="Solana"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">Solana Wallet</p>
                      <p className="text-gray-400 text-sm">
                        {publicKey
                          ? `Connected: ${publicKey
                              .toString()
                              .slice(0, 6)}...${publicKey.toString().slice(-4)}`
                          : "Connect via Phantom"}
                      </p>
                    </div>
                  </div>
                  {publicKey ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">
                        CONNECTED
                      </span>
                    </div>
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Loading State */}
              {displayLoading && (
                <div className="mt-4 flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="ml-2 text-gray-400">Connecting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Memoize the component to prevent unnecessary rerenders
export default memo(Web3WalletModal);
