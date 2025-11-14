import {
  WalletCheckRequest,
  WalletCheckResponse,
  Web3WalletCredentials,
} from "../types";
import { apiService } from "./api";

// Helper function to map frontend wallet types to backend wallet types
const mapWalletType = (frontendType: string): string => {
  const mapping: { [key: string]: string } = {
    ton: "ton_wallet",
    metamask: "metamask",
    ethereum: "ethereum_wallet",
    sui: "sui_wallet",
    solana: "solana_wallet",
  };
  return mapping[frontendType] || frontendType;
};

export const walletService = {
  /**
   * Check if a wallet address is already linked to an account
   */
  async checkWalletExists(
    address: string,
    walletType: string
  ): Promise<WalletCheckResponse> {
    try {
      return await apiService.request<WalletCheckResponse>(
        "/auth/wallet/check",
        {
          method: "POST",
          body: JSON.stringify({
            address,
            walletType: mapWalletType(walletType),
          } as WalletCheckRequest),
        }
      );
    } catch (error) {
      console.error("Error checking wallet:", error);
      throw error;
    }
  },

  /**
   * Generate authentication message for wallet signing
   */
  async generateAuthMessage(
    address: string,
    walletType: string
  ): Promise<{ success: boolean; message: string; data: { message: string } }> {
    try {
      return await apiService.request<{
        success: boolean;
        message: string;
        data: { message: string };
      }>("/auth/wallet/message", {
        method: "POST",
        body: JSON.stringify({
          address,
          walletType: mapWalletType(walletType),
        }),
      });
    } catch (error) {
      console.error("Error generating auth message:", error);
      throw error;
    }
  },

  /**
   * Connect wallet (for new users or existing users)
   */
  async connectWallet(
    walletType: string,
    address: string,
    message: string,
    signature: string
  ): Promise<any> {
    try {
      return await apiService.request<any>("/auth/wallet/connect", {
        method: "POST",
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          message,
          signature,
        }),
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      throw error;
    }
  },

  /**
   * Authenticate with wallet signature
   */
  async authenticateWithWallet(
    credentials: Web3WalletCredentials
  ): Promise<any> {
    try {
      return await apiService.request<any>("/auth/wallet/connect", {
        method: "POST",
        body: JSON.stringify({
          walletType: mapWalletType(credentials.walletType),
          address: credentials.walletAddress,
          message: credentials.message,
          signature: credentials.signature,
        }),
      });
    } catch (error) {
      console.error("Error authenticating with wallet:", error);
      throw error;
    }
  },

  /**
   * Link wallet to existing account
   */
  async linkWalletToAccount(
    walletType: string,
    address: string,
    message: string,
    signature: string,
    accessToken: string
  ): Promise<any> {
    try {
      // Note: apiService will automatically add Authorization header from stored token
      // But we can also pass it explicitly if needed
      return await apiService.request<any>("/auth/wallet/link", {
        method: "POST",
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          message,
          signature,
        }),
      });
    } catch (error) {
      console.error("Error linking wallet to account:", error);
      throw error;
    }
  },

  /**
   * Get user's connected wallets
   */
  async getUserWallets(accessToken: string): Promise<any> {
    try {
      // apiService will automatically add Authorization header from stored token
      return await apiService.request<any>("/auth/wallet/list", {
        method: "GET",
      });
    } catch (error) {
      console.error("Error getting user wallets:", error);
      throw error;
    }
  },

  /**
   * Create new account with wallet
   */
  async createAccountWithWallet(
    credentials: Web3WalletCredentials,
    userData?: any
  ): Promise<any> {
    try {
      return await apiService.request<any>("/auth/wallet/signup", {
        method: "POST",
        body: JSON.stringify({
          ...credentials,
          walletType: mapWalletType(credentials.walletType),
          userData,
        }),
      });
    } catch (error) {
      console.error("Error creating account with wallet:", error);
      throw error;
    }
  },

  /**
   * Simple login for already linked wallets (no signature required)
   */
  async simpleLogin(
    walletType: string,
    address: string,
    nonce?: string,
    timestamp?: string
  ): Promise<any> {
    try {
      return await apiService.request<any>("/auth/wallet/simple-login", {
        method: "POST",
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          nonce: nonce || this.generateNonce(),
          timestamp: timestamp || Date.now().toString(),
        }),
      });
    } catch (error) {
      console.error("Error with simple login:", error);
      throw error;
    }
  },

  /**
   * Generate a random nonce for authentication
   */
  generateNonce(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },
};

export default walletService;
