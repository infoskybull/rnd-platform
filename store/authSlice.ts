import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  User,
  LoginCredentials,
  SignUpData,
  Web3WalletCredentials,
  AuthState,
} from "../types";
import { apiService, AuthResponse } from "../services/api";
import { walletService } from "../services/walletService";
import {
  clearAllLocalStorage,
  resetAllWeb3Wallets,
} from "../utils/storageUtils";
import { resetAllWallets } from "./walletSlice";

// Helper function to extract userId from various API response formats
const extractUserId = (userProfile: any, context: string = ""): string => {
  console.log(`${context}User profile received:`, userProfile);
  console.log(`${context}User profile type:`, typeof userProfile);
  console.log(
    `${context}User profile keys:`,
    userProfile ? Object.keys(userProfile) : "null"
  );
  console.log(`${context}User profile _id:`, userProfile?._id);
  console.log(`${context}User profile id:`, userProfile?.id);

  // Try to get ID from either _id or id field
  let userId = userProfile._id || userProfile.id;
  console.log(`${context}Extracted userId:`, userId);
  console.log(`${context}userId type:`, typeof userId);

  // Fallback: Check if userProfile is nested in a data object
  if (!userId && userProfile.data) {
    console.log(`${context}Checking nested data object for user ID`);
    const nestedData = userProfile.data;
    userId = nestedData._id || nestedData.id;
    console.log(`${context}Nested userId:`, userId);
  }

  // Fallback: Check if userProfile has a user property
  if (!userId && userProfile.user) {
    console.log(`${context}Checking user property for user ID`);
    const userData = userProfile.user;
    userId = userData._id || userData.id;
    console.log(`${context}User property userId:`, userId);
  }

  // Final fallback: Generate a temporary ID if none exists
  if (!userId) {
    console.warn(`${context}No user ID found, generating temporary ID`);
    userId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`${context}Generated temporary userId:`, userId);
  }

  return userId.toString();
};

// Helper function to transform user data with wallet addresses
const normalizePlanCode = (planValue?: string | null): string | null => {
  if (!planValue) {
    return null;
  }
  return typeof planValue === "string" ? planValue.toLowerCase() : planValue;
};

const transformUserData = (userData: any, userId: string): User => {
  const rawPlan = userData?.currentPlan || null;
  const extractedPlan =
    rawPlan && typeof rawPlan === "object"
      ? {
          ...rawPlan,
          id:
            rawPlan.id ||
            (typeof rawPlan._id === "string"
              ? rawPlan._id
              : rawPlan._id?.toString?.()) ||
            undefined,
        }
      : null;

  const normalizedPlanType =
    normalizePlanCode(
      extractedPlan?.planType ||
        userData?.planType ||
        userData?.plan ||
        userData?.subscriptionPlan?.planType
    ) || null;

  const firstName = userData.firstName || "User";
  const lastName = userData.lastName || "";
  const fullName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName;

  return {
    id: userId.toString(),
    email: userData.email,
    firstName: firstName,
    lastName: lastName,
    name: fullName,
    role: userData.role || "creator",
    isKYCVerified:
      userData.isKYCVerified !== undefined ? userData.isKYCVerified : true,
    plan: normalizedPlanType,
    currentPlan: extractedPlan
      ? {
          ...extractedPlan,
          planType: normalizedPlanType || extractedPlan.planType,
        }
      : null,
    createdAt: userData.createdAt
      ? new Date(userData.createdAt).toISOString()
      : new Date().toISOString(),
    adminChatId: userData.adminChatId,
    // Wallet addresses
    tonWalletAddress: userData.tonWalletAddress,
    ethereumWalletAddress: userData.ethereumWalletAddress,
    suiWalletAddress: userData.suiWalletAddress,
    solanaWalletAddress: userData.solanaWalletAddress,
    authProviders: userData.authProviders,
  };
};

const transformAuthResponse = (response: AuthResponse): User => {
  console.log("Auth response received:", response);

  if (!response) {
    console.error("No auth response received");
    throw new Error("No response from server");
  }

  // Check if response has nested user object or direct user data
  let userData: any = response.data?.user || response.data;

  if (!userData) {
    console.error("Invalid auth response: missing user data", response);
    if (response.message || response.error) {
      throw new Error(response.message || response.error);
    }
    throw new Error("Invalid response from server: missing user data");
  }

  // If userData has tokens but no user fields, it means we need to look for user data elsewhere
  if ("accessToken" in userData && !("email" in userData)) {
    console.log("Found token data, looking for user data in response.data");
    userData = response.data;
  }

  // Validate required fields
  if (!userData.email) {
    console.error("Invalid user data: missing email", userData);
    throw new Error("Invalid user data: missing email");
  }

  // Try to get ID from either _id or id field
  const userId = userData._id || userData.id;
  if (!userId) {
    console.error("Invalid user data: missing both _id and id", userData);
    throw new Error("Invalid user data: missing user ID");
  }

  const user = transformUserData(userData, userId);
  console.log("Transformed user:", user);
  return user;
};

// Initial state
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  error: null,
  isInitialized: false,
  requires2FA: false,
  pending2FA: null,
};

// Helper function to check if token has expired
const checkTokenExpiration = (): boolean => {
  const expirationDate = localStorage.getItem("tokenExpiration");
  if (!expirationDate) {
    // No expiration date means session-only (expires when browser closes)
    return false;
  }
  const expiration = new Date(expirationDate);
  const now = new Date();
  return now > expiration;
};

// Async thunks
export const initializeAuth = createAsyncThunk(
  "auth/initializeAuth",
  async (_, { rejectWithValue }) => {
    try {
      // Check if token has expired
      if (checkTokenExpiration()) {
        console.log("Token has expired, clearing tokens");
        apiService.logout();
        return { user: null, accessToken: null, refreshToken: null };
      }

      const accessToken = apiService.getAccessToken();
      const refreshToken = apiService.getRefreshToken();

      // First check if we have a cached user profile in localStorage
      const cachedUserProfile = localStorage.getItem("userProfile");
      if (cachedUserProfile && accessToken && refreshToken) {
        try {
          const user = JSON.parse(cachedUserProfile);
          console.log("Using cached user profile:", user);
          // For admin, skip calling /users/me entirely
          if (user.role === "admin") {
            return { user, accessToken, refreshToken };
          }

          // Verify with server in background for non-admin
          try {
            const userProfile = await apiService.getCurrentUser();
            if (userProfile) {
              const userId = extractUserId(userProfile, "Initialize: ");

              // Handle nested user data structure
              let userData = userProfile;
              if ((userProfile as any).data?.user) {
                userData = (userProfile as any).data.user;
              } else if (
                (userProfile as any).data &&
                !("email" in userProfile.data)
              ) {
                userData = (userProfile as any).data;
              } else if (
                (userProfile as any).success &&
                (userProfile as any).data
              ) {
                // Handle API response format: { success: true, data: { ... } }
                userData = (userProfile as any).data;
              }

              // Create updated user object using helper function
              const updatedUser = transformUserData(userData, userId);

              // Update localStorage with fresh data
              localStorage.setItem("userProfile", JSON.stringify(updatedUser));
              return { user: updatedUser, accessToken, refreshToken };
            }
          } catch (verifyError) {
            console.warn(
              "Failed to verify user with server, using cached data:",
              verifyError
            );
            return { user, accessToken, refreshToken };
          }
        } catch (parseError) {
          console.error("Failed to parse cached user profile:", parseError);
          localStorage.removeItem("userProfile");
        }
      }

      // No cached data or tokens, check if we have tokens to verify
      if (accessToken && refreshToken) {
        try {
          // If we have cached user and it's admin, skip /users/me
          const cached = localStorage.getItem("userProfile");
          if (cached) {
            try {
              const cachedUser = JSON.parse(cached) as User;
              if (cachedUser.role === "admin") {
                return { user: cachedUser, accessToken, refreshToken };
              }
            } catch {}
          }

          const userProfile = await apiService.getCurrentUser();
          if (!userProfile) {
            throw new Error("No user profile received");
          }

          const userId = extractUserId(userProfile, "Initialize: ");

          // Handle nested user data structure
          let userData = userProfile;
          if ((userProfile as any).data?.user) {
            userData = (userProfile as any).data.user;
          } else if (
            (userProfile as any).data &&
            !("email" in userProfile.data)
          ) {
            userData = (userProfile as any).data;
          } else if (
            (userProfile as any).success &&
            (userProfile as any).data
          ) {
            // Handle API response format: { success: true, data: { ... } }
            userData = (userProfile as any).data;
          }

          // Create user object using helper function
          const user = transformUserData(userData, userId);

          // Save user profile to localStorage
          localStorage.setItem("userProfile", JSON.stringify(user));

          return { user, accessToken, refreshToken };
        } catch (error) {
          console.error("Token verification failed:", error);
          // Tokens are invalid, clear them
          apiService.logout();
          throw error;
        }
      }

      // No tokens available
      return { user: null, accessToken: null, refreshToken: null };
    } catch (error) {
      console.error("Auth initialization failed:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Auth initialization failed"
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials);

      // Check if 2FA is required
      if (
        response.data?.requires2FA === true ||
        (response as any).data?.requires2FA === true
      ) {
        console.log(
          "[authSlice] 2FA required detected, returning special error object"
        );
        // Return special value indicating 2FA is required
        // This will be thrown as error when unwrap() is called
        const twoFactorError = {
          requires2FA: true,
          message: response.message || "2FA token is required",
        };
        console.log("[authSlice] Returning 2FA error object:", twoFactorError);
        return rejectWithValue(twoFactorError);
      }

      const user = transformAuthResponse(response);

      // Save user profile to localStorage immediately
      localStorage.setItem("userProfile", JSON.stringify(user));

      // If remember me is checked, set token expiration to 1 week from now
      if (credentials.rememberMe) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 1 week from now
        localStorage.setItem("tokenExpiration", expirationDate.toISOString());
        console.log("Remember me enabled - token expires in 1 week");
      } else {
        // Session expires when browser is closed
        localStorage.removeItem("tokenExpiration");
      }

      console.log("Login successful:", {
        userId: user.id,
        email: user.email,
        role: user.role,
        rememberMe: credentials.rememberMe,
      });

      // After successful login, fetch full user profile from server
      try {
        console.log("[authSlice] Fetching current user profile after login...");
        const currentUser = await apiService.getCurrentUser();
        console.log("[authSlice] Current user profile fetched:", currentUser);

        // Update user with fresh data from server
        // Handle nested user data structure
        let userDataFromAPI = currentUser;
        if ((currentUser as any).data?.user) {
          userDataFromAPI = (currentUser as any).data.user;
        } else if (
          (currentUser as any).data &&
          !("email" in currentUser.data)
        ) {
          userDataFromAPI = (currentUser as any).data;
        } else if ((currentUser as any).success && (currentUser as any).data) {
          // Handle API response format: { success: true, data: { ... } }
          userDataFromAPI = (currentUser as any).data;
        }

        const userIdFromAPI =
          (userDataFromAPI as any)._id ||
          (userDataFromAPI as any).id ||
          user.id;
        const updatedUser = transformUserData(userDataFromAPI, userIdFromAPI);

        // Preserve existing values if API doesn't return them
        if (!updatedUser.isKYCVerified && user.isKYCVerified) {
          updatedUser.isKYCVerified = user.isKYCVerified;
        }

        // Save updated user profile to localStorage
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
        console.log("[authSlice] User profile updated after getCurrentUser");

        return {
          user: updatedUser,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      } catch (getUserError) {
        console.warn(
          "[authSlice] Failed to fetch current user after login, using user from login response:",
          getUserError
        );
        // If getCurrentUser fails, return user from login response
        // This ensures login still succeeds even if getCurrentUser fails
        return {
          user,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      console.error("Login failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const loginWith2FA = createAsyncThunk(
  "auth/loginWith2FA",
  async (
    credentials: LoginCredentials & { token: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const fallback = state.auth.pending2FA;
      const email = credentials.email || fallback?.email || "";
      const password = credentials.password || fallback?.password || "";
      const rememberMe =
        credentials.rememberMe !== undefined
          ? credentials.rememberMe
          : fallback?.rememberMe;

      const response = await apiService.loginWith2FA({
        email,
        password,
        token: credentials.token,
        rememberMe,
      });

      const user = transformAuthResponse(response);

      // Save user profile to localStorage immediately
      localStorage.setItem("userProfile", JSON.stringify(user));

      // If remember me is checked, set token expiration to 1 week from now
      if (credentials.rememberMe) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 1 week from now
        localStorage.setItem("tokenExpiration", expirationDate.toISOString());
        console.log("Remember me enabled - token expires in 1 week");
      } else {
        // Session expires when browser is closed
        localStorage.removeItem("tokenExpiration");
      }

      console.log("Login with 2FA successful:", {
        userId: user.id,
        email: user.email,
        role: user.role,
        rememberMe: credentials.rememberMe,
      });

      // After successful login, fetch full user profile from server
      try {
        console.log(
          "[authSlice] Fetching current user profile after 2FA login..."
        );
        const currentUser = await apiService.getCurrentUser();
        console.log("[authSlice] Current user profile fetched:", currentUser);

        // Update user with fresh data from server
        // Handle nested user data structure
        let userDataFromAPI = currentUser;
        if ((currentUser as any).data?.user) {
          userDataFromAPI = (currentUser as any).data.user;
        } else if (
          (currentUser as any).data &&
          !("email" in currentUser.data)
        ) {
          userDataFromAPI = (currentUser as any).data;
        } else if ((currentUser as any).success && (currentUser as any).data) {
          // Handle API response format: { success: true, data: { ... } }
          userDataFromAPI = (currentUser as any).data;
        }

        const userIdFromAPI =
          (userDataFromAPI as any)._id ||
          (userDataFromAPI as any).id ||
          user.id;
        const updatedUser = transformUserData(userDataFromAPI, userIdFromAPI);

        // Preserve existing values if API doesn't return them
        if (!updatedUser.isKYCVerified && user.isKYCVerified) {
          updatedUser.isKYCVerified = user.isKYCVerified;
        }

        // Save updated user profile to localStorage
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
        console.log(
          "[authSlice] User profile updated after getCurrentUser (2FA)"
        );

        return {
          user: updatedUser,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      } catch (getUserError) {
        console.warn(
          "[authSlice] Failed to fetch current user after 2FA login, using user from login response:",
          getUserError
        );
        // If getCurrentUser fails, return user from login response
        // This ensures login still succeeds even if getCurrentUser fails
        return {
          user,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "2FA login failed";
      console.error("2FA login failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const web3WalletLogin = createAsyncThunk(
  "auth/web3WalletLogin",
  async (credentials: Web3WalletCredentials, { rejectWithValue }) => {
    try {
      const response = await walletService.authenticateWithWallet(credentials);

      if (response.success && response.data) {
        const userData = response.data.user;

        // Create user object with proper validation
        const userId =
          userData.id || userData._id || `wallet_${credentials.walletAddress}`;
        const user = transformUserData(userData, userId);

        // Set wallet address based on wallet type
        if (credentials.walletType === "ton") {
          user.tonWalletAddress = credentials.walletAddress;
        } else if (credentials.walletType === "ethereum") {
          user.ethereumWalletAddress = credentials.walletAddress;
        } else if (credentials.walletType === "sui") {
          user.suiWalletAddress = credentials.walletAddress;
        } else if (credentials.walletType === "solana") {
          user.solanaWalletAddress = credentials.walletAddress;
        }

        // Save user profile to localStorage
        localStorage.setItem("userProfile", JSON.stringify(user));
        localStorage.setItem(
          `${credentials.walletType}WalletAddress`,
          credentials.walletAddress
        );

        // Store tokens in localStorage
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);

        // IMPORTANT: Update ApiService instance with new tokens
        apiService.setTokens(
          response.data.accessToken,
          response.data.refreshToken
        );

        console.log("Web3 wallet login successful:", {
          user: user.name,
          role: user.role,
          email: user.email,
          hasAccessToken: !!response.data.accessToken,
          hasRefreshToken: !!response.data.refreshToken,
        });

        // After successful login, fetch full user profile from server
        try {
          console.log(
            "[authSlice] Fetching current user profile after Web3 wallet login..."
          );
          const currentUser = await apiService.getCurrentUser();
          console.log("[authSlice] Current user profile fetched:", currentUser);

          // Update user with fresh data from server
          // Handle nested user data structure
          let userDataFromAPI = currentUser;
          if ((currentUser as any).data?.user) {
            userDataFromAPI = (currentUser as any).data.user;
          } else if (
            (currentUser as any).data &&
            !("email" in currentUser.data)
          ) {
            userDataFromAPI = (currentUser as any).data;
          } else if (
            (currentUser as any).success &&
            (currentUser as any).data
          ) {
            // Handle API response format: { success: true, data: { ... } }
            userDataFromAPI = (currentUser as any).data;
          }

          const userIdFromAPI =
            (userDataFromAPI as any)._id ||
            (userDataFromAPI as any).id ||
            user.id;
          const updatedUser = transformUserData(userDataFromAPI, userIdFromAPI);

          // Preserve existing values if API doesn't return them
          if (
            updatedUser.isKYCVerified === undefined &&
            user.isKYCVerified !== undefined
          ) {
            updatedUser.isKYCVerified = user.isKYCVerified;
          }

          // Save updated user profile to localStorage
          localStorage.setItem("userProfile", JSON.stringify(updatedUser));
          console.log(
            "[authSlice] User profile updated after getCurrentUser (Web3 wallet)"
          );

          return {
            user: updatedUser,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          };
        } catch (getUserError) {
          console.warn(
            "[authSlice] Failed to fetch current user after Web3 wallet login, using user from login response:",
            getUserError
          );
          // If getCurrentUser fails, return user from login response
          // This ensures login still succeeds even if getCurrentUser fails
          return {
            user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
          };
        }
      } else {
        throw new Error(
          response.message || "Web3 wallet authentication failed"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Web3 wallet authentication failed";
      console.error("Web3 wallet login failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async (data: SignUpData, { rejectWithValue }) => {
    try {
      const registerData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      };

      const response = await apiService.register(registerData);
      const user = transformAuthResponse(response);

      // New users might need KYC verification
      user.isKYCVerified = false;

      // Save user profile to localStorage
      localStorage.setItem("userProfile", JSON.stringify(user));
      localStorage.setItem("isNewUser", "true"); // Flag for navigation to upload

      console.log("Signup successful:", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // After successful signup, fetch full user profile from server
      try {
        console.log(
          "[authSlice] Fetching current user profile after signup..."
        );
        const currentUser = await apiService.getCurrentUser();
        console.log("[authSlice] Current user profile fetched:", currentUser);

        // Update user with fresh data from server
        // Handle nested user data structure
        let userDataFromAPI = currentUser;
        if ((currentUser as any).data?.user) {
          userDataFromAPI = (currentUser as any).data.user;
        } else if (
          (currentUser as any).data &&
          !("email" in currentUser.data)
        ) {
          userDataFromAPI = (currentUser as any).data;
        }

        const userIdFromAPI =
          (userDataFromAPI as any)._id ||
          (userDataFromAPI as any).id ||
          user.id;
        const updatedUser = transformUserData(userDataFromAPI, userIdFromAPI);

        // Preserve existing values if API doesn't return them
        if (
          updatedUser.isKYCVerified === undefined &&
          user.isKYCVerified !== undefined
        ) {
          updatedUser.isKYCVerified = user.isKYCVerified;
        }

        // Save updated user profile to localStorage
        localStorage.setItem("userProfile", JSON.stringify(updatedUser));
        console.log(
          "[authSlice] User profile updated after getCurrentUser (signup)"
        );

        return {
          user: updatedUser,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      } catch (getUserError) {
        console.warn(
          "[authSlice] Failed to fetch current user after signup, using user from signup response:",
          getUserError
        );
        // If getCurrentUser fails, return user from signup response
        // This ensures signup still succeeds even if getCurrentUser fails
        return {
          user,
          accessToken: response.data.accessToken!,
          refreshToken: response.data.refreshToken!,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      console.error("Signup failed:", errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      console.log("Starting logout process...");

      // Step 1: Reset wallet state in Redux store
      console.log("Resetting wallet state in Redux store...");
      dispatch(resetAllWallets());

      // Step 2: Logout from API service
      console.log("Logging out from API service...");
      await apiService.logout();

      // Step 3: Clear user profile and token expiration from localStorage
      console.log("Clearing user profile from localStorage...");
      localStorage.removeItem("userProfile");
      localStorage.removeItem("tokenExpiration");

      console.log("✅ Logout completed successfully - all wallet states reset");
      return true;
    } catch (error) {
      console.error("Error during logout:", error);

      // Still proceed with logout even if some steps fail
      try {
        await apiService.logout();
      } catch (apiError) {
        console.error("API logout also failed:", apiError);
      }

      // Clear user profile and token expiration from localStorage
      localStorage.removeItem("userProfile");
      localStorage.removeItem("tokenExpiration");

      // Reset wallet state in Redux store even on error
      dispatch(resetAllWallets());

      console.log("⚠️ Logout completed with errors - user state cleared");
      return rejectWithValue(
        error instanceof Error ? error.message : "Logout failed"
      );
    }
  }
);

export const refreshUser = createAsyncThunk(
  "auth/refreshUser",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const { accessToken } = state.auth;

      if (!accessToken) {
        console.warn("No access token available for user refresh");
        return rejectWithValue("No access token available");
      }

      // If current user is admin, do not call /users/me
      const currentUser = state.auth.user;
      if (currentUser?.role === "admin") {
        return currentUser;
      }

      const userProfile = await apiService.getCurrentUser();

      if (!userProfile) {
        console.error("No user profile received during refresh");
        throw new Error("No user profile received");
      }

      // Handle nested user data structure
      let userData = userProfile;
      if ((userProfile as any).data?.user) {
        userData = (userProfile as any).data.user;
      } else if ((userProfile as any).data && !("email" in userProfile.data)) {
        userData = (userProfile as any).data;
      } else if ((userProfile as any).success && (userProfile as any).data) {
        // Handle API response format: { success: true, data: { ... } }
        userData = (userProfile as any).data;
      }

      // Extract userId using helper function
      const userId = extractUserId(userProfile, "Refresh: ");

      // Use helper function to transform user data
      const user = transformUserData(userData, userId);

      // Update localStorage with fresh data
      localStorage.setItem("userProfile", JSON.stringify(user));

      console.log("User refreshed successfully:", {
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return user;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to refresh user"
      );
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRequires2FA: (state, action: PayloadAction<boolean>) => {
      state.requires2FA = action.payload;
    },
    clear2FAContext: (state) => {
      state.requires2FA = false;
      state.pending2FA = null;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        state.isInitialized = true;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
        state.isInitialized = true;
      })
      // Login user
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        state.requires2FA = false;
        state.pending2FA = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        // Handle both string and object payloads (for 2FA requirement)
        if (typeof action.payload === "string") {
          state.error = action.payload;
        } else if (action.payload && typeof action.payload === "object") {
          // If it's an object with requires2FA, don't set error (handled in component)
          // Only set error if it's a regular error object with message
          if (!(action.payload as any).requires2FA) {
            state.error = (action.payload as any).message || "Login failed";
          } else {
            // 2FA required - don't set error state, let component handle it
            state.error = null;
            state.requires2FA = true;
            const creds = (action as any).meta?.arg as
              | LoginCredentials
              | undefined;
            if (creds?.email && creds?.password) {
              state.pending2FA = {
                email: creds.email,
                password: creds.password,
                rememberMe: creds.rememberMe,
              };
            }
          }
        } else {
          state.error = "Login failed";
        }
      })
      // Login with 2FA
      .addCase(loginWith2FA.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginWith2FA.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
        state.requires2FA = false;
        state.pending2FA = null;
      })
      .addCase(loginWith2FA.rejected, (state, action) => {
        state.isLoading = false;
        // Keep requires2FA true so user can retry entering token
        state.error = action.payload as string;
      })
      // Web3 wallet login
      .addCase(web3WalletLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(web3WalletLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(web3WalletLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Signup user
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout user
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = null;
        state.isInitialized = false;
        state.requires2FA = false;
        state.pending2FA = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.error = action.payload as string;
        state.isInitialized = false;
        state.requires2FA = false;
        state.pending2FA = null;
      })
      // Refresh user
      .addCase(refreshUser.pending, (state) => {
        // Don't set loading for refresh to avoid UI flicker
      })
      .addCase(refreshUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(refreshUser.rejected, (state, action) => {
        // Don't logout on refresh failure, might be temporary network issue
        console.warn("User refresh failed:", action.payload);
      });
  },
});

export const {
  clearError,
  setInitialized,
  setLoading,
  setRequires2FA,
  clear2FAContext,
} = authSlice.actions;
export default authSlice.reducer;
