# Wallet Integration Documentation

## Overview

This document describes the multi-chain wallet integration implemented in the RnD-FrontEnd application.

## Integrated Wallets

### 1. TON Wallet

- **Package**: `@tonconnect/ui-react`
- **Provider**: TONConnect
- **Status**: ✅ Fully Integrated

### 2. Ethereum Wallet (Metamask)

- **Package**: `@rainbow-me/rainbowkit`, `wagmi`, `viem`
- **Provider**: RainbowKit
- **Status**: ✅ Fully Integrated
- **Features**:
  - Connect via RainbowKit's ConnectButton
  - Message signing with wagmi
  - Support for Ethereum mainnet and Sepolia testnet

### 3. Sui Wallet

- **Package**: `@suiet/wallet-kit`
- **Provider**: Suiet Wallet Kit
- **Status**: ✅ Integrated (signing pending)
- **Features**:
  - Multi-chain support (Mainnet, Testnet, Devnet)
  - Wallet connection via Suiet SDK
  - Note: Message signing implementation pending

### 4. Solana Wallet

- **Package**: `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-phantom`
- **Provider**: Solana Wallet Adapter
- **Status**: ✅ Integrated (signing pending)
- **Features**:
  - Support for Phantom and Solflare wallets
  - Connection via WalletMultiButton
  - Note: Message signing implementation pending

## File Structure

### New Context Providers

1. `contexts/EthereumWalletContext.tsx` - Ethereum wallet integration
2. `contexts/SuiWalletContext.tsx` - Sui wallet integration
3. `contexts/SolanaWalletContext.tsx` - Solana wallet integration

### Updated Files

1. `App.tsx` - Wrapped with all wallet providers
2. `store/walletSlice.ts` - Added Ethereum wallet state (replaced BNB)
3. `components/Web3WalletModal.tsx` - Integrated all wallet connections

## Wallet Provider Hierarchy

```tsx
Provider (Redux Store)
  └── EthereumWalletProvider
      └── SuiWalletProvider
          └── SolanaWalletProvider
              └── TonConnectUIProvider
                  └── SidebarProvider
                      └── Router
                          └── App Content
```

## Usage

### Connecting Wallets

#### Ethereum (Metamask)

1. Click "Ethereum Wallet" button in the modal
2. Use the RainbowKit ConnectButton to connect your Metamask wallet
3. Sign the authentication message when prompted

#### Sui

1. Click "SUI Wallet" button in the modal
2. Connect your Sui wallet using Suiet Wallet Kit
3. Signing functionality to be implemented

#### Solana

1. Click "Solana Wallet" button in the modal
2. Use the WalletMultiButton to connect (Phantom/Solflare)
3. Signing functionality to be implemented

#### TON

1. Click "TON Wallet" button in the modal
2. Connect via TON Connect modal
3. Sign the authentication message

## State Management

### Wallet State Structure

```typescript
WalletState {
  tonConnect: { isConnected, walletAddress, walletInfo, isLoading, error }
  ethereum: { isConnected, walletAddress, isLoading, error }
  sui: { isConnected, walletAddress, isLoading, error }
  solana: { isConnected, walletAddress, isLoading, error }
  isAnyWalletConnected: boolean
  activeWalletType: "ton" | "ethereum" | "sui" | "solana" | null
}
```

### Actions

- `setTonConnectState` - Update TON wallet state
- `setEthereumWalletState` - Update Ethereum wallet state
- `setSuiWalletState` - Update Sui wallet state
- `setSolanaWalletState` - Update Solana wallet state
- `clearAllWalletStates` - Clear all wallet states

## Configuration

### Ethereum/RainbowKit

- Project ID: Needs to be configured in `EthereumWalletContext.tsx`
- Get from: https://cloud.walletconnect.com
- Chains: Mainnet, Sepolia

### Sui

- Networks: Mainnet, Testnet, Devnet
- Default RPC URLs configured

### Solana

- Network: Mainnet
- Wallets: Phantom, Solflare

## Future Improvements

1. **Message Signing**: Implement signing for Sui and Solana wallets
2. **Project ID**: Add Ethereum RainbowKit Project ID from WalletConnect Cloud
3. **Error Handling**: Enhance error handling for each wallet type
4. **Auto-connect**: Implement auto-connect for previously connected wallets
5. **Disconnect**: Add disconnect functionality for each wallet type

## Notes

- All wallet providers are wrapped in the App component
- Web3WalletModal provides UI for all wallet connections
- State management handled by Redux Toolkit
- BNB wallet was replaced with Ethereum wallet in the UI
- Message signing is fully implemented for TON and Ethereum
- Sui and Solana signing implementations are pending

