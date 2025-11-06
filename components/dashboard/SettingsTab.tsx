import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../../types";
import { useTonConnect } from "../../hooks/useTonConnect";
import { walletService } from "../../services/walletService";
import { useAuth } from "../../hooks/useAuth";
import { getUserCreatedDate } from "../../utils/userUtils";
import {
  useChangePassword,
  useTwoFactorAuth,
} from "../../hooks/useSecuritySettings";
import { X, Eye, EyeOff, Shield, Copy, Check } from "lucide-react";

interface SettingsTabProps {
  user: User;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ user }) => {
  const navigate = useNavigate();
  const {
    isConnected,
    walletAddress,
    connect,
    disconnect,
    isLoading,
    error,
    signMessage,
  } = useTonConnect();
  const { accessToken } = useAuth();
  const [linkedWallets, setLinkedWallets] = useState<
    Array<{ type: string; address: string }>
  >([]);
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  // Change Password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    changePassword,
    loading: changingPassword,
    error: passwordError,
    success: passwordSuccess,
    clearMessages: clearPasswordMessages,
  } = useChangePassword();

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [twoFAToken, setTwoFAToken] = useState("");
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const {
    generateSecret,
    enable: enable2FA,
    disable: disable2FA,
    loading: twoFALoading,
    error: twoFAError,
    success: twoFASuccess,
    qrCodeUrl,
    backupCodes,
    is2FAEnabled,
    clearMessages: clear2FAMessages,
    resetSetup,
  } = useTwoFactorAuth();

  // Check if user has linked wallets
  useEffect(() => {
    const fetchUserWallets = async () => {
      if (!accessToken) return;

      try {
        const result = await walletService.getUserWallets(accessToken);
        if (result.success && result.data?.wallets) {
          setLinkedWallets(result.data.wallets);
        }
      } catch (error) {
        console.error("Error fetching user wallets:", error);
      }
    };

    fetchUserWallets();
  }, [accessToken]);

  const handleLinkWallet = async () => {
    if (!isConnected) {
      try {
        await connect();
      } catch (error) {
        setLinkError("Failed to connect wallet");
        return;
      }
    }

    if (!walletAddress) {
      setLinkError("No wallet address available");
      return;
    }

    if (!accessToken) {
      setLinkError("Authentication required");
      return;
    }

    setIsLinkingWallet(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      // Check if wallet is already linked to another account
      const checkResult = await walletService.checkWalletExists(
        walletAddress,
        "ton"
      );

      if (checkResult.data?.exists && checkResult.data?.userId !== user.id) {
        setLinkError("This wallet is already linked to another account");
        return;
      }

      // Generate authentication message
      const messageResult = await walletService.generateAuthMessage(
        walletAddress,
        "ton"
      );
      if (!messageResult.success) {
        setLinkError("Failed to generate authentication message");
        return;
      }

      const authMessage = messageResult.data.message;

      // Sign the message with the wallet
      const signature = await signMessage(authMessage);
      if (!signature) {
        setLinkError("Failed to sign authentication message");
        return;
      }

      // Link wallet to current account
      await walletService.linkWalletToAccount(
        "ton",
        walletAddress,
        authMessage,
        signature,
        accessToken
      );

      setLinkSuccess("Wallet linked successfully!");

      // Refresh the wallet list
      const result = await walletService.getUserWallets(accessToken);
      if (result.success && result.data?.wallets) {
        setLinkedWallets(result.data.wallets);
      }
    } catch (error) {
      setLinkError(
        error instanceof Error ? error.message : "Failed to link wallet"
      );
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async (walletType: string, address: string) => {
    if (!accessToken) {
      setLinkError("Authentication required");
      return;
    }

    try {
      // In a real app, this would be an API call to unlink the wallet
      // For now, we'll simulate it by removing from the local state
      setLinkedWallets((prev) =>
        prev.filter(
          (wallet) =>
            !(wallet.type === walletType && wallet.address === address)
        )
      );
      setLinkSuccess("Wallet unlinked successfully!");
      setLinkError(null);
    } catch (error) {
      setLinkError("Failed to unlink wallet");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Profile Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white truncate"
                title={user.name}
              >
                {user.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white truncate"
                title={user.email}
              >
                {user.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white capitalize">
                {user.role}
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
          <div className="space-y-4">
            <button
              onClick={() => {
                setShowChangePasswordModal(true);
                clearPasswordMessages();
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Change Password
            </button>

            <button
              onClick={() => {
                setShow2FAModal(true);
                clear2FAMessages();
                setTwoFAToken("");
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>
                Two-Factor Authentication
                {is2FAEnabled && (
                  <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                    Enabled
                  </span>
                )}
              </span>
            </button>

            <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors">
              Login History
            </button>
          </div>
        </div>

        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    clearPasswordMessages();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter new password (min 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 8 && (
                    <p className="mt-1 text-xs text-red-400">
                      Password must be at least 8 characters
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {confirmPassword.length > 0 &&
                    newPassword !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">
                        Passwords do not match
                      </p>
                    )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      clearPasswordMessages();
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !currentPassword ||
                        !newPassword ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                      ) {
                        return;
                      }
                      const result = await changePassword(
                        currentPassword,
                        newPassword
                      );
                      if (result.success) {
                        setTimeout(() => {
                          setShowChangePasswordModal(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }, 2000);
                      }
                    }}
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      newPassword.length < 8 ||
                      newPassword !== confirmPassword
                    }
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {changingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Modal */}
        {show2FAModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Two-Factor Authentication</span>
                </h3>
                <button
                  onClick={() => {
                    setShow2FAModal(false);
                    setShow2FASetup(false);
                    setShow2FADisable(false);
                    clear2FAMessages();
                    resetSetup();
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {twoFAError && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                  {twoFAError}
                </div>
              )}

              {twoFASuccess && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-green-400 text-sm">
                  {twoFASuccess}
                </div>
              )}

              {!show2FASetup && !show2FADisable && (
                <div className="space-y-4">
                  <div className="text-gray-300 text-sm">
                    {is2FAEnabled
                      ? "Two-factor authentication is currently enabled for your account."
                      : "Add an extra layer of security to your account by enabling two-factor authentication."}
                  </div>
                  <div className="flex space-x-3">
                    {!is2FAEnabled ? (
                      <button
                        onClick={async () => {
                          const result = await generateSecret();
                          if (result.success) {
                            setShow2FASetup(true);
                          }
                        }}
                        disabled={twoFALoading}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {twoFALoading ? "Generating..." : "Enable 2FA"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShow2FADisable(true)}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        Disable 2FA
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 2FA Setup Flow */}
              {show2FASetup && (
                <div className="space-y-4">
                  <div className="text-gray-300 text-sm">
                    Scan the QR code with your authenticator app (Google
                    Authenticator, Authy, etc.)
                  </div>

                  {qrCodeUrl && (
                    <div className="flex justify-center bg-white p-4 rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  )}

                  {backupCodes.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-yellow-400 mb-2">
                        ⚠️ Save these backup codes securely:
                      </div>
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                        {backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-800 p-2 rounded font-mono text-sm"
                          >
                            <span className="text-white">{code}</span>
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(code);
                                setCopiedCodeIndex(index);
                                setTimeout(
                                  () => setCopiedCodeIndex(null),
                                  2000
                                );
                              }}
                              className="text-gray-400 hover:text-white ml-2"
                            >
                              {copiedCodeIndex === index ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter 6-digit code from your authenticator app
                    </label>
                    <input
                      type="text"
                      value={twoFAToken}
                      onChange={(e) =>
                        setTwoFAToken(
                          e.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        resetSetup();
                      }}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (twoFAToken.length === 6) {
                          const result = await enable2FA(twoFAToken);
                          if (result.success) {
                            setTimeout(() => {
                              setShow2FAModal(false);
                              setShow2FASetup(false);
                            }, 2000);
                          }
                        }
                      }}
                      disabled={twoFALoading || twoFAToken.length !== 6}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {twoFALoading ? "Enabling..." : "Enable 2FA"}
                    </button>
                  </div>
                </div>
              )}

              {/* 2FA Disable Confirmation */}
              {show2FADisable && (
                <div className="space-y-4">
                  <div className="text-gray-300 text-sm">
                    Are you sure you want to disable two-factor authentication?
                    This will make your account less secure.
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShow2FADisable(false)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const result = await disable2FA();
                        if (result.success) {
                          setTimeout(() => {
                            setShow2FAModal(false);
                            setShow2FADisable(false);
                          }, 2000);
                        }
                      }}
                      disabled={twoFALoading}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {twoFALoading ? "Disabling..." : "Disable 2FA"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Settings */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Notifications
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">
                  Email Notifications
                </div>
                <div className="text-gray-400 text-sm">
                  Receive updates via email
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Project Updates</div>
                <div className="text-gray-400 text-sm">
                  Get notified about project changes
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Marketing Emails</div>
                <div className="text-gray-400 text-sm">
                  Receive promotional content
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Subscription Plan
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">Current Plan</div>
                <div className="text-gray-400 text-sm">
                  {user.plan === "free" &&
                    "1 free prototype/month, 1 AI request"}
                  {user.plan === "pro" && "20 prototypes, 200 AI requests"}
                  {user.plan === "business" &&
                    "Unlimited prototypes, 500 AI requests"}
                  {!user.plan &&
                    "Free plan - 1 free prototype/month, 1 AI request"}
                </div>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  user.plan === "business"
                    ? "bg-purple-100 text-purple-800"
                    : user.plan === "pro"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {user.plan || "Free"}
              </div>
            </div>

            <button
              onClick={() => navigate("/plan")}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Account Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">KYC Verification</div>
                <div className="text-gray-400 text-sm">
                  Identity verification status
                </div>
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.isKYCVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {user.isKYCVerified ? "Verified" : "Pending"}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-600">
              <div className="text-sm text-gray-400 mb-2">Member since</div>
              <div className="text-white">{getUserCreatedDate(user)}</div>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Wallet Connection
          </h3>
          <div className="space-y-4">
            {/* Error Messages */}
            {(error || linkError) && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{error || linkError}</span>
                </div>
              </div>
            )}

            {/* Success Messages */}
            {linkSuccess && (
              <div className="bg-green-900/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>{linkSuccess}</span>
                </div>
              </div>
            )}

            {/* Linked Wallets Display */}
            {linkedWallets.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Linked Wallets</div>
                    <div className="text-gray-400 text-sm">
                      {linkedWallets.length} wallet
                      {linkedWallets.length > 1 ? "s" : ""} connected
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {linkedWallets.length} Connected
                  </div>
                </div>

                {linkedWallets.map((wallet, index) => (
                  <div
                    key={`${wallet.type}-${wallet.address}`}
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img
                          src={`/coins/${
                            wallet.type === "ton_wallet" ? "ton" : wallet.type
                          }.png`}
                          alt={wallet.type}
                          className="w-5 h-5"
                        />
                        <span className="text-white font-medium capitalize">
                          {wallet.type === "ton_wallet"
                            ? "TON Wallet"
                            : wallet.type === "metamask"
                            ? "MetaMask"
                            : wallet.type === "bnb_wallet"
                            ? "BNB Wallet"
                            : wallet.type === "sui_wallet"
                            ? "SUI Wallet"
                            : wallet.type === "solana_wallet"
                            ? "Solana Wallet"
                            : wallet.type}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleUnlinkWallet(wallet.type, wallet.address)
                        }
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                      >
                        Unlink
                      </button>
                    </div>
                    <div className="text-xs font-mono text-gray-300 break-all bg-gray-800/50 px-2 py-1 rounded border border-gray-600/30">
                      {wallet.address}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">
                      No Wallet Linked
                    </div>
                    <div className="text-gray-400 text-sm">
                      Connect your TON wallet to enable Web3 features
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    Not Connected
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <img src="/coins/ton.png" alt="TON" className="w-6 h-6" />
                  <span className="text-white">TON Wallet</span>
                </div>

                <button
                  onClick={handleLinkWallet}
                  disabled={isLinkingWallet || isLoading}
                  className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isLinkingWallet || isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      {isLinkingWallet ? "Linking..." : "Connecting..."}
                    </div>
                  ) : (
                    "Link Wallet"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
