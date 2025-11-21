import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Home,
  Wallet,
  Copy,
  Check,
  Link2,
  Loader2,
  Bell,
  Grid3x3,
  Settings,
  HelpCircle,
} from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import { User as UserType } from "../types";
import { useTonConnect } from "../hooks/useTonConnect";
import { useAccount, useSignMessage } from "wagmi";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useSuiWallet } from "../contexts/SuiWalletContext";
import { walletService } from "../services/walletService";
import { useAuth } from "../hooks/useAuth";

interface ResponsiveNavbarProps {
  title: string;
  titleColor?: string;
  user: UserType | null;
  onLogout: () => void | Promise<void>;
  backButton?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

const ResponsiveNavbar: React.FC<ResponsiveNavbarProps> = ({
  title,
  titleColor = "text-indigo-400",
  user,
  onLogout,
  backButton,
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showTabletDropdown, setShowTabletDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const [showMobileFeatures, setShowMobileFeatures] = useState(false);

  // Check if current path contains /dashboard
  const isDashboardPage = location.pathname.includes("/dashboard");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [linkingWallet, setLinkingWallet] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabletDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const featuresDropdownRef = useRef<HTMLDivElement>(null);

  // Wallet hooks
  const {
    isConnected: isTonConnected,
    walletAddress: tonAddress,
    signMessage: signTonMessage,
    connect: connectTon,
  } = useTonConnect();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { signMessageAsync: signEthMessage } = useSignMessage();
  const {
    publicKey: solanaPublicKey,
    isConnected: isSolanaConnected,
    signMessage: signSolanaMessage,
    connect: connectSolana,
  } = useSolanaWallet();
  const {
    walletAddress: suiAddress,
    isConnected: isSuiConnected,
    signMessage: signSuiMessage,
    connect: connectSui,
  } = useSuiWallet();
  const { accessToken, refreshUser } = useAuth();

  // Close dropdown when clicking outside (Desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Close dropdown when clicking outside (Tablet)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tabletDropdownRef.current &&
        !tabletDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTabletDropdown(false);
      }
    };

    if (showTabletDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTabletDropdown]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotificationDropdown]);

  // Close features dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        featuresDropdownRef.current &&
        !featuresDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFeaturesDropdown(false);
      }
    };

    if (showFeaturesDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFeaturesDropdown]);

  // Handle back navigation
  const handleBack = () => {
    if (backButton) {
      backButton.onClick();
    } else {
      navigate(-1);
    }
  };

  // Handle home navigation
  const handleHome = () => {
    if (user?.role === "publisher") {
      navigate("/dashboard/publisher/browse-games");
    } else if (user?.role === "creator") {
      navigate("/dashboard/creator/your-projects");
    } else if (user?.role === "admin") {
      navigate("/admin/accounts");
    } else {
      navigate("/dashboard");
    }
  };

  // Format wallet address for display
  const formatAddress = (
    address: string | null | undefined,
    length: number = 6
  ) => {
    if (!address) return "";
    if (address.length <= length * 2) return address;
    return `${address.slice(0, length)}...${address.slice(-length)}`;
  };

  // Copy address to clipboard
  const copyToClipboard = async (address: string, walletType: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(`${walletType}-${address}`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Get wallet icon based on type
  const getWalletIcon = (type: string) => {
    // You can add specific icons for each wallet type if needed
    return Wallet;
  };

  // Get linked wallets from user object
  const getLinkedWallets = () => {
    const wallets = [];
    if (user?.tonWalletAddress) {
      wallets.push({
        type: "TON",
        address: user.tonWalletAddress,
        isLinked: true,
      });
    }
    if (user?.ethereumWalletAddress) {
      wallets.push({
        type: "Ethereum",
        address: user.ethereumWalletAddress,
        isLinked: true,
      });
    }
    if (user?.solanaWalletAddress) {
      wallets.push({
        type: "Solana",
        address: user.solanaWalletAddress,
        isLinked: true,
      });
    }
    if (user?.suiWalletAddress) {
      wallets.push({
        type: "Sui",
        address: user.suiWalletAddress,
        isLinked: true,
      });
    }
    // Debug log to check linked wallets
    console.log("[ResponsiveNavbar] Linked wallets:", wallets);
    console.log("[ResponsiveNavbar] User wallet addresses:", {
      ton: user?.tonWalletAddress,
      ethereum: user?.ethereumWalletAddress,
      solana: user?.solanaWalletAddress,
      sui: user?.suiWalletAddress,
    });
    return wallets;
  };

  // Get connected but not linked wallets
  const getConnectedButNotLinkedWallets = () => {
    const linkedWallets = getLinkedWallets();
    const connectedButNotLinked = [];

    // Debug log connection states
    console.log("[ResponsiveNavbar] Connection states:", {
      isTonConnected,
      tonAddress,
      isEthConnected,
      ethAddress,
      isSolanaConnected,
      solanaPublicKey: solanaPublicKey?.toString(),
      isSuiConnected,
      suiAddress,
    });

    // Check TON
    if (
      isTonConnected &&
      tonAddress &&
      !linkedWallets.some((w) => w.type === "TON" && w.address === tonAddress)
    ) {
      connectedButNotLinked.push({
        type: "TON",
        address: tonAddress,
        isLinked: false,
      });
    }

    // Check Ethereum - ONLY show if connected via Metamask (NOT Phantom)
    // Phantom wallet also injects into window.ethereum, but we only want Metamask
    // Since we removed injectedWallet from wagmi config, only Metamask should be detected
    // Additional check: only add if it's a valid Ethereum address (starts with 0x)
    if (
      isEthConnected &&
      ethAddress &&
      ethAddress.startsWith("0x") && // Ensure it's a valid Ethereum address
      !linkedWallets.some(
        (w) => w.type === "Ethereum" && w.address === ethAddress
      )
    ) {
      connectedButNotLinked.push({
        type: "Ethereum",
        address: ethAddress,
        isLinked: false,
      });
    }

    // Check Solana
    if (isSolanaConnected && solanaPublicKey) {
      const solanaAddr = solanaPublicKey.toString();
      if (
        !linkedWallets.some(
          (w) => w.type === "Solana" && w.address === solanaAddr
        )
      ) {
        connectedButNotLinked.push({
          type: "Solana",
          address: solanaAddr,
          isLinked: false,
        });
      }
    }

    // Check Sui
    if (
      isSuiConnected &&
      suiAddress &&
      !linkedWallets.some((w) => w.type === "Sui" && w.address === suiAddress)
    ) {
      connectedButNotLinked.push({
        type: "Sui",
        address: suiAddress,
        isLinked: false,
      });
    }

    console.log("[ResponsiveNavbar] Connected but not linked wallets:", connectedButNotLinked);
    return connectedButNotLinked;
  };

  const linkedWallets = getLinkedWallets();
  const connectedButNotLinkedWallets = getConnectedButNotLinkedWallets();
  const allWallets = [...linkedWallets, ...connectedButNotLinkedWallets];
  
  // Debug log all wallets
  console.log("[ResponsiveNavbar] All wallets to display:", allWallets);

  // Handle link wallet
  const handleLinkWallet = async (walletType: string, address: string) => {
    if (!accessToken) {
      setLinkError("Authentication required");
      return;
    }

    setLinkingWallet(`${walletType}-${address}`);
    setLinkError(null);

    try {
      const typeMap: { [key: string]: string } = {
        TON: "ton",
        Ethereum: "ethereum",
        Solana: "solana",
        Sui: "sui",
      };
      const backendType = typeMap[walletType] || walletType.toLowerCase();

      // Step 1: Check if wallet is already linked
      const checkResult = await walletService.checkWalletExists(
        address,
        backendType
      );
      
      // If wallet exists, check which account it's linked to
      if (checkResult.data?.exists) {
        const walletUserId = checkResult.data?.userId;
        const currentUserId = user?.id;
        
        // Only show error if wallet is linked to a different user (and userId is valid)
        if (walletUserId && currentUserId && walletUserId !== currentUserId) {
          setLinkError("This wallet is already linked to another account");
          return;
        }
        
        // If wallet is already linked to current user, refresh user data and exit
        if (walletUserId && currentUserId && walletUserId === currentUserId) {
          // Wallet is already linked to this account, just refresh to sync state
          await refreshUser();
          setLinkError(null);
          return;
        }
      }

      // Step 2: Generate authentication message
      const messageResult = await walletService.generateAuthMessage(
        address,
        backendType
      );
      if (!messageResult.success) {
        setLinkError("Failed to generate authentication message");
        return;
      }

      const authMessage = messageResult.data.message;

      // Step 3: Sign the message
      let signature: string | null = null;
      if (walletType === "TON") {
        signature = await signTonMessage(authMessage);
      } else if (walletType === "Ethereum") {
        signature = await signEthMessage({
          account: address as `0x${string}`,
          message: authMessage,
        });
      } else if (walletType === "Solana") {
        signature = await signSolanaMessage(authMessage);
      } else if (walletType === "Sui") {
        signature = await signSuiMessage(authMessage);
      }

      if (!signature) {
        setLinkError("Failed to sign authentication message");
        return;
      }

      // Step 4: Link wallet to account
      await walletService.linkWalletToAccount(
        backendType,
        address,
        authMessage,
        signature,
        accessToken
      );

      // Step 5: Refresh user data
      await refreshUser();

      // Clear error and close linking state
      setLinkError(null);
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Failed to link wallet"
      );
    } finally {
      setLinkingWallet(null);
    }
  };

  return (
    <header
      className={`bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10 ${className}`}
    >
      <div
        className={`${isDashboardPage ? "w-full" : "container mx-auto"} ${
          isDashboardPage ? "px-0" : "px-4 sm:px-6"
        } py-4`}
      >
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          <div
            className={`flex items-center space-x-4 ${
              isDashboardPage ? "pl-4 sm:pl-6" : ""
            }`}
          >
            {/* Back and Home buttons - hidden on dashboard pages */}
            {!isDashboardPage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBack}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors flex items-center space-x-2"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{backButton?.text || "Back"}</span>
                </button>
                <button
                  onClick={handleHome}
                  className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors flex items-center space-x-2"
                  title="Go home"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
              </div>
            )}

            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <RnDLogo size={32} className="sm:w-10 sm:h-10" />
              {/* <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                {title.split(" ").map((word, index) => (
                  <span key={index}>
                    {index === title.split(" ").length - 1 ? (
                      <span className={titleColor}>{word}</span>
                    ) : (
                      word + " "
                    )}
                  </span>
                ))}
              </h1> */}
            </div>
          </div>

          {/* Notification, Features, and User Dropdown */}
          <div
            className={`flex items-center space-x-2 ${
              isDashboardPage ? "pr-4 sm:pr-6" : ""
            }`}
          >
            {user && (
              <>
                {/* Notification Button */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNotificationDropdown(!showNotificationDropdown);
                      setShowFeaturesDropdown(false);
                      setShowUserDropdown(false);
                    }}
                    className="relative p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {/* Notification badge - you can add logic to show/hide based on unread count */}
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 text-center text-sm text-gray-400">
                          No new notifications
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Dropdown */}
                <div className="relative" ref={featuresDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowFeaturesDropdown(!showFeaturesDropdown);
                      setShowNotificationDropdown(false);
                      setShowUserDropdown(false);
                    }}
                    className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    title="Features"
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>

                  {showFeaturesDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigate("/dashboard/settings");
                            setShowFeaturesDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            // Add help/support navigation
                            setShowFeaturesDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Help & Support</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUserDropdown(!showUserDropdown);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden xl:inline">{user.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showUserDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      {/* User Info Section */}
                      <div className="p-4 border-b border-gray-700">
                        <p className="text-sm font-medium text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {user.email}
                        </p>
                        <div className="mt-2">
                          <RoleBadge role={user.role} size="sm" />
                        </div>
                      </div>

                      {/* Linked Wallets Section */}
                      {allWallets.length > 0 && (
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center space-x-2 mb-3">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                            <p className="text-xs font-medium text-gray-300 uppercase">
                              Linked Wallets
                            </p>
                          </div>
                          <div className="space-y-2">
                            {allWallets.map((wallet, index) => {
                              const isLinking =
                                linkingWallet ===
                                `${wallet.type}-${wallet.address}`;
                              const isCopied =
                                copiedAddress ===
                                `${wallet.type}-${wallet.address}`;
                              return (
                                <div
                                  key={index}
                                  className="bg-gray-700/50 rounded p-2"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <p className="text-xs font-medium text-indigo-400">
                                          {wallet.type}
                                        </p>
                                        {wallet.isLinked && (
                                          <Check className="w-3 h-3 text-green-400" />
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-300 font-mono mt-1 break-all">
                                        {formatAddress(wallet.address, 6)}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                      {!wallet.isLinked && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleLinkWallet(
                                              wallet.type,
                                              wallet.address
                                            );
                                          }}
                                          disabled={isLinking}
                                          className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                                          title="Link wallet"
                                        >
                                          {isLinking ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Link2 className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          copyToClipboard(
                                            wallet.address,
                                            wallet.type
                                          );
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-600/50 rounded transition-colors"
                                        title="Copy address"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {linkError && (
                            <p className="text-xs text-red-400 mt-2">
                              {linkError}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Empty State */}
                      {allWallets.length === 0 && (
                        <div className="p-4 border-b border-gray-700">
                          <div className="flex items-center space-x-2 mb-2">
                            <Wallet className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Linked Wallets
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            No wallets linked
                          </p>
                        </div>
                      )}

                      {/* Logout Button */}
                      <div className="p-2">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowUserDropdown(false);
                            try {
                              await onLogout();
                            } catch (error) {
                              console.error("Logout error:", error);
                            }
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 bg-red-900/20 hover:bg-red-900/30 rounded-lg border border-red-800/50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tablet Layout - Collapsed buttons */}
        <div className="hidden md:flex lg:hidden justify-between items-center">
          <div
            className={`flex items-center space-x-3 ${
              isDashboardPage ? "pl-4 sm:pl-6" : ""
            }`}
          >
            {/* Back and Home buttons - hidden on dashboard pages */}
            {!isDashboardPage && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  title={backButton?.text || "Go back"}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleHome}
                  className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  title="Go home"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Logo and Title */}
            <RnDLogo size={32} className="w-10 h-10" />
            {/* <h1 className="text-xl font-bold tracking-tight text-white">
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {index === title.split(" ").length - 1 ? (
                    <span className={titleColor}>{word}</span>
                  ) : (
                    word + " "
                  )}
                </span>
              ))}
            </h1> */}
          </div>

          {/* Notification, Features, and User Dropdown */}
          <div
            className={`flex items-center space-x-2 ${
              isDashboardPage ? "pr-4 sm:pr-6" : ""
            }`}
          >
            {user && (
              <>
                {/* Notification Button */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNotificationDropdown(!showNotificationDropdown);
                      setShowFeaturesDropdown(false);
                      setShowTabletDropdown(false);
                    }}
                    className="relative p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  {showNotificationDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="text-sm font-semibold text-white">
                          Notifications
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 text-center text-sm text-gray-400">
                          No new notifications
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Dropdown */}
                <div className="relative" ref={featuresDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowFeaturesDropdown(!showFeaturesDropdown);
                      setShowNotificationDropdown(false);
                      setShowTabletDropdown(false);
                    }}
                    className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    title="Features"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>

                  {showFeaturesDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigate("/dashboard/settings");
                            setShowFeaturesDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowFeaturesDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Help & Support</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={tabletDropdownRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTabletDropdown(!showTabletDropdown);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${
                        showTabletDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showTabletDropdown && (
                    <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      {/* User Info Section */}
                      <div className="px-5 py-4 bg-gradient-to-r from-gray-800 to-gray-800/50 border-b border-gray-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-sm text-gray-400 mt-0.5 truncate">
                              {user.email}
                            </p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <RoleBadge role={user.role} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Linked Wallets Section */}
                      {allWallets.length > 0 && (
                        <div className="px-5 py-4 border-b border-gray-700">
                          <div className="flex items-center space-x-2 mb-3">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Linked Wallets ({linkedWallets.length})
                              {connectedButNotLinkedWallets.length > 0 && (
                                <span className="text-yellow-400 ml-1">
                                  ({connectedButNotLinkedWallets.length} to
                                  link)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="space-y-2.5 max-h-64 overflow-y-auto">
                            {allWallets.map((wallet, index) => {
                              const isLinking =
                                linkingWallet ===
                                `${wallet.type}-${wallet.address}`;
                              const isCopied =
                                copiedAddress ===
                                `${wallet.type}-${wallet.address}`;
                              const WalletIcon = getWalletIcon(wallet.type);
                              return (
                                <div
                                  key={index}
                                  className="group bg-gray-700/40 hover:bg-gray-700/60 rounded-lg p-3 transition-all duration-200 border border-gray-600/50"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="p-1.5 bg-indigo-500/20 rounded">
                                        <WalletIcon className="w-3.5 h-3.5 text-indigo-400" />
                                      </div>
                                      <div className="flex items-center space-x-1.5">
                                        <p className="text-xs font-semibold text-indigo-300">
                                          {wallet.type}
                                        </p>
                                        {wallet.isLinked && (
                                          <Check className="w-3 h-3 text-green-400" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {!wallet.isLinked && (
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleLinkWallet(
                                              wallet.type,
                                              wallet.address
                                            );
                                          }}
                                          disabled={isLinking}
                                          className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Link wallet"
                                        >
                                          {isLinking ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Link2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          copyToClipboard(
                                            wallet.address,
                                            wallet.type
                                          );
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-600/50 rounded transition-colors"
                                        title="Copy address"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-xs text-gray-300 font-mono flex-1 break-all">
                                      {formatAddress(wallet.address, 8)}
                                    </p>
                                  </div>
                                  {/* Full address tooltip on hover */}
                                  <div className="mt-1.5 pt-2 border-t border-gray-600/30">
                                    <p className="text-[10px] text-gray-500 font-mono break-all leading-tight">
                                      {wallet.address}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {linkError && (
                            <p className="text-xs text-red-400 mt-2">
                              {linkError}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Empty State for Wallets */}
                      {allWallets.length === 0 && (
                        <div className="px-5 py-4 border-b border-gray-700">
                          <div className="flex items-center space-x-2 mb-2">
                            <Wallet className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Linked Wallets
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 italic">
                            No wallets linked
                          </p>
                        </div>
                      )}

                      {/* Logout Button */}
                      <div className="p-3 bg-gray-800/50">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTabletDropdown(false);
                            try {
                              await onLogout();
                            } catch (error) {
                              console.error("Logout error:", error);
                            }
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-red-300 hover:text-red-200 bg-red-900/20 hover:bg-red-900/30 rounded-lg border border-red-800/50 transition-all duration-200 hover:border-red-700/50"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden justify-between items-center">
          <div
            className={`flex items-center space-x-2 ${
              isDashboardPage ? "pl-4" : ""
            }`}
          >
            {/* Back and Home buttons - hidden on dashboard pages */}
            {!isDashboardPage && (
              <>
                <button
                  onClick={handleBack}
                  className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  title={backButton?.text || "Go back"}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleHome}
                  className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  title="Go home"
                >
                  <Home className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <RnDLogo size={28} className="w-8 h-8" />
              {/* <h1 className="text-lg font-bold tracking-tight text-white truncate max-w-[120px]">
                {title.split(" ").map((word, index) => (
                  <span key={index}>
                    {index === title.split(" ").length - 1 ? (
                      <span className={titleColor}>{word}</span>
                    ) : (
                      word + " "
                    )}
                  </span>
                ))}
              </h1> */}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors ${
              isDashboardPage ? "mr-4" : ""
            }`}
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-700">
            <div className="space-y-4 px-4">
              {user && (
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <RoleBadge role={user.role} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Linked Wallets */}
                  {allWallets.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Wallet className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Linked Wallets ({linkedWallets.length})
                          {connectedButNotLinkedWallets.length > 0 && (
                            <span className="text-yellow-400 ml-1">
                              ({connectedButNotLinkedWallets.length} to link)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {allWallets.map((wallet, index) => {
                          const isLinking =
                            linkingWallet ===
                            `${wallet.type}-${wallet.address}`;
                          const isCopied =
                            copiedAddress ===
                            `${wallet.type}-${wallet.address}`;
                          const WalletIcon = getWalletIcon(wallet.type);
                          return (
                            <div
                              key={index}
                              className="bg-gray-700/40 rounded-lg p-3 border border-gray-600/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 bg-indigo-500/20 rounded">
                                    <WalletIcon className="w-3.5 h-3.5 text-indigo-400" />
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <p className="text-xs font-semibold text-indigo-300">
                                      {wallet.type}
                                    </p>
                                    {wallet.isLinked && (
                                      <Check className="w-3 h-3 text-green-400" />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  {!wallet.isLinked && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleLinkWallet(
                                          wallet.type,
                                          wallet.address
                                        );
                                      }}
                                      disabled={isLinking}
                                      className="p-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="Link wallet"
                                    >
                                      {isLinking ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Link2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copyToClipboard(
                                        wallet.address,
                                        wallet.type
                                      );
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-600/50 rounded transition-colors"
                                    title="Copy address"
                                  >
                                    {isCopied ? (
                                      <Check className="w-3.5 h-3.5 text-green-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-300 font-mono break-all">
                                {formatAddress(wallet.address, 6)}
                              </p>
                              <div className="mt-2 pt-2 border-t border-gray-600/30">
                                <p className="text-[10px] text-gray-500 font-mono break-all leading-tight">
                                  {wallet.address}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {linkError && (
                        <p className="text-xs text-red-400 mt-2 text-center">
                          {linkError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Empty State for Wallets */}
                  {allWallets.length === 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Wallet className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Linked Wallets
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 italic text-center">
                        No wallets linked
                      </p>
                    </div>
                  )}

                  {/* Notifications Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <button
                      onClick={() =>
                        setShowMobileNotifications(!showMobileNotifications)
                      }
                      className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4" />
                        <span>Notifications</span>
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showMobileNotifications ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showMobileNotifications && (
                      <div className="mt-2 bg-gray-800/50 rounded-lg border border-gray-700 p-4">
                        <div className="text-center text-sm text-gray-400">
                          No new notifications
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Features Section */}
                  <div className="border-t border-gray-700 pt-4">
                    <button
                      onClick={() => setShowMobileFeatures(!showMobileFeatures)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Grid3x3 className="w-4 h-4" />
                        <span>Features</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          showMobileFeatures ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {showMobileFeatures && (
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={() => {
                            navigate("/dashboard/settings");
                            setShowMobileMenu(false);
                            setShowMobileFeatures(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowMobileFeatures(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700/50 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span>Help & Support</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-700">
                {!isDashboardPage && (
                  <>
                    <button
                      onClick={() => {
                        handleBack();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {backButton?.text || "Back"}
                    </button>

                    <button
                      onClick={() => {
                        handleHome();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </button>
                  </>
                )}

                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMobileMenu(false);
                    try {
                      await onLogout();
                    } catch (error) {
                      console.error("Logout error:", error);
                    }
                  }}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-300 hover:text-red-200 bg-red-900/20 hover:bg-red-900/30 rounded-lg border border-red-800/50 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default ResponsiveNavbar;
