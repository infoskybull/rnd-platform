import {
  WalletCheckRequest,
  WalletCheckResponse,
  Web3WalletCredentials,
} from "../types";

const API_BASE_URL =
  (window as any).__API_BASE_URL__ ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

// Helper function to map frontend wallet types to backend wallet types
const mapWalletType = (frontendType: string): string => {
  const mapping: { [key: string]: string } = {
    ton: "ton_wallet",
    metamask: "metamask",
    bnb: "bnb_wallet",
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          walletType: mapWalletType(walletType),
        } as WalletCheckRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          walletType: mapWalletType(walletType),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          message,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletType: mapWalletType(credentials.walletType),
          address: credentials.walletAddress,
          message: credentials.message,
          signature: credentials.signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          message,
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...credentials,
          walletType: mapWalletType(credentials.walletType),
          userData,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
      const response = await fetch(`${API_BASE_URL}/auth/wallet/simple-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletType: mapWalletType(walletType),
          address,
          nonce: nonce || this.generateNonce(),
          timestamp: timestamp || Date.now().toString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
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
