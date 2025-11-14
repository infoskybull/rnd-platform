import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, User, ChevronDown, Menu, X, Home, Wallet, Copy, Check } from "lucide-react";
import RnDLogo from "./icons/RnDLogo";
import RoleBadge from "./RoleBadge";
import { User as UserType } from "../types";
import { useTonConnect } from "../hooks/useTonConnect";
import { useAccount } from "wagmi";
import { useSolanaWallet } from "../contexts/SolanaWalletContext";
import { useSuiWallet } from "../contexts/SuiWalletContext";

interface ResponsiveNavbarProps {
  title: string;
  titleColor?: string;
  user: UserType | null;
  onLogout: () => void;
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Wallet hooks
  const { isConnected: isTonConnected, walletAddress: tonAddress } = useTonConnect();
  const { address: ethAddress, isConnected: isEthConnected } = useAccount();
  const { publicKey: solanaPublicKey, isConnected: isSolanaConnected } = useSolanaWallet();
  const { walletAddress: suiAddress, isConnected: isSuiConnected } = useSuiWallet();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  const formatAddress = (address: string | null | undefined, length: number = 6) => {
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

  // Get connected wallets list
  const getConnectedWallets = () => {
    const wallets = [];
    if (isTonConnected && tonAddress) {
      wallets.push({ type: "TON", address: tonAddress });
    }
    if (isEthConnected && ethAddress) {
      wallets.push({ type: "Ethereum", address: ethAddress });
    }
    if (isSolanaConnected && solanaPublicKey) {
      wallets.push({ type: "Solana", address: solanaPublicKey.toString() });
    }
    if (isSuiConnected && suiAddress) {
      wallets.push({ type: "Sui", address: suiAddress });
    }
    return wallets;
  };

  const connectedWallets = getConnectedWallets();

  return (
    <header
      className={`bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Back and Home buttons - always visible */}
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

            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <RnDLogo size={32} className="sm:w-10 sm:h-10" />
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white">
                {title.split(" ").map((word, index) => (
                  <span key={index}>
                    {index === title.split(" ").length - 1 ? (
                      <span className={titleColor}>{word}</span>
                    ) : (
                      word + " "
                    )}
                  </span>
                ))}
              </h1>
            </div>
          </div>

          {/* User Dropdown */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xl:inline">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    {/* User Info Section */}
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                      <div className="mt-2">
                        <RoleBadge role={user.role} size="sm" />
                      </div>
                    </div>

                    {/* Connected Wallets Section */}
                    {connectedWallets.length > 0 && (
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center space-x-2 mb-3">
                          <Wallet className="w-4 h-4 text-indigo-400" />
                          <p className="text-xs font-medium text-gray-300 uppercase">Connected Wallets</p>
                        </div>
                        <div className="space-y-2">
                          {connectedWallets.map((wallet, index) => (
                            <div key={index} className="bg-gray-700/50 rounded p-2">
                              <p className="text-xs font-medium text-indigo-400">{wallet.type}</p>
                              <p className="text-xs text-gray-300 font-mono mt-1 break-all">
                                {wallet.address}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserDropdown(false);
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
            )}
          </div>
        </div>

        {/* Tablet Layout - Collapsed buttons */}
        <div className="hidden md:flex lg:hidden justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Back and Home buttons */}
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

            {/* Logo and Title */}
            <RnDLogo size={32} className="w-10 h-10" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              {title.split(" ").map((word, index) => (
                <span key={index}>
                  {index === title.split(" ").length - 1 ? (
                    <span className={titleColor}>{word}</span>
                  ) : (
                    word + " "
                  )}
                </span>
              ))}
            </h1>
          </div>

          {/* User Dropdown */}
          <div className="flex items-center space-x-2">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <ChevronDown className={`w-3 h-3 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* User Info Section */}
                    <div className="px-5 py-4 bg-gradient-to-r from-gray-800 to-gray-800/50 border-b border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-white truncate">{user.name}</p>
                          <p className="text-sm text-gray-400 mt-0.5 truncate">{user.email}</p>
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <RoleBadge role={user.role} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Connected Wallets Section */}
                    {connectedWallets.length > 0 && (
                      <div className="px-5 py-4 border-b border-gray-700">
                        <div className="flex items-center space-x-2 mb-3">
                          <Wallet className="w-4 h-4 text-indigo-400" />
                          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                            Connected Wallets ({connectedWallets.length})
                          </p>
                        </div>
                        <div className="space-y-2.5 max-h-64 overflow-y-auto">
                          {connectedWallets.map((wallet, index) => {
                            const isCopied = copiedAddress === `${wallet.type}-${wallet.address}`;
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
                                    <p className="text-xs font-semibold text-indigo-300">{wallet.type}</p>
                                  </div>
                                  <button
                                    onClick={() => copyToClipboard(wallet.address, wallet.type)}
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
                      </div>
                    )}

                    {/* Empty State for Wallets */}
                    {connectedWallets.length === 0 && (
                      <div className="px-5 py-4 border-b border-gray-700">
                        <div className="flex items-center space-x-2 mb-2">
                          <Wallet className="w-4 h-4 text-gray-500" />
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Connected Wallets
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 italic">No wallets connected</p>
                      </div>
                    )}

                    {/* Logout Button */}
                    <div className="p-3 bg-gray-800/50">
                      <button
                        onClick={() => {
                          onLogout();
                          setShowUserDropdown(false);
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
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex md:hidden justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* Back and Home buttons */}
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

            {/* Logo and Title */}
            <div className="flex items-center space-x-2">
              <RnDLogo size={28} className="w-8 h-8" />
              <h1 className="text-lg font-bold tracking-tight text-white truncate max-w-[120px]">
                {title.split(" ").map((word, index) => (
                  <span key={index}>
                    {index === title.split(" ").length - 1 ? (
                      <span className={titleColor}>{word}</span>
                    ) : (
                      word + " "
                    )}
                  </span>
                ))}
              </h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
            <div className="space-y-4">
              {user && (
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-800/50 to-gray-800/30 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{user.email}</p>
                      </div>
                      <div className="ml-3 flex-shrink-0">
                        <RoleBadge role={user.role} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Connected Wallets */}
                  {connectedWallets.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <Wallet className="w-4 h-4 text-indigo-400" />
                        <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Connected Wallets ({connectedWallets.length})
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        {connectedWallets.map((wallet, index) => {
                          const isCopied = copiedAddress === `${wallet.type}-${wallet.address}`;
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
                                  <p className="text-xs font-semibold text-indigo-300">{wallet.type}</p>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(wallet.address, wallet.type)}
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
                    </div>
                  )}

                  {/* Empty State for Wallets */}
                  {connectedWallets.length === 0 && (
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Wallet className="w-4 h-4 text-gray-500" />
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Connected Wallets
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 italic text-center">No wallets connected</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 pt-2 border-t border-gray-700">
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

                <button
                  onClick={() => {
                    onLogout();
                    setShowMobileMenu(false);
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
