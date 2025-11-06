import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  // Load environment variables - Vite automatically loads .env.production for production builds
  const env = loadEnv(mode, ".", "");

  // Debug: Log the loaded env variable
  console.log("=== Vite Config Debug ===");
  console.log("Mode:", mode);
  console.log("VITE_API_BASE_URL from env:", env.VITE_API_BASE_URL);
  console.log("Process.env.VITE_API_BASE_URL:", process.env.VITE_API_BASE_URL);

  // Use env variable or fallback
  const apiBaseUrl =
    env.VITE_API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    "http://localhost:3000/api";
  console.log("Final API_BASE_URL:", apiBaseUrl);

  return {
    server: {
      port: 5173,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      // Add Node.js polyfills for Web3 libraries (Solana, Ethereum, Sui, TON)
      // This is critical for mobile browsers that don't have Node.js globals
      nodePolyfills({
        // Enable polyfills for specific modules
        include: [
          "buffer",
          "process",
          "util",
          "stream",
          "crypto",
          "events",
          "url",
          "querystring",
          "path",
          "os",
        ],
        // Globals to polyfill
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        // Override default polyfills if needed
        overrides: {
          // Use the 'buffer' package we have installed
          buffer: "buffer",
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      // Force inject VITE_API_BASE_URL - this will replace import.meta.env.VITE_API_BASE_URL in code
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
      // Define global for Buffer (needed for Web3 libraries)
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
        // Ensure buffer is resolved correctly
        buffer: "buffer",
      },
    },
    optimizeDeps: {
      // Pre-bundle these dependencies for better performance
      include: [
        "buffer",
        "@solana/web3.js",
        "@mysten/sui.js",
        "@ton/core",
        "viem",
        "wagmi",
      ],
    },
  };
});
