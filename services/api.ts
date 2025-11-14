const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8080/api";

export const getApiBaseOrigin = (): string => {
  try {
    const url = new URL(API_BASE_URL);
    // If path ends with /api, strip it for socket namespace root
    const origin = `${url.protocol}//${url.host}`;
    return origin;
  } catch (_) {
    // Fallback: rudimentary strip of trailing /api
    return API_BASE_URL.replace(/\/?api$/i, "");
  }
};

// API service for real database integration
import {
  clearAllLocalStorage,
  resetAllWeb3Wallets,
} from "../utils/storageUtils";
import type { CurrentPlanDetails } from "../types";

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "publisher" | "creator";
}

export interface AuthResponse {
  data: {
    accessToken?: string;
    refreshToken?: string;
    requires2FA?: boolean; // Indicates if 2FA is required for login
    user?: {
      _id?: string;
      id?: string; // Support both _id and id
      email: string;
      firstName: string;
      lastName: string;
      role?: "publisher" | "creator";
      createdAt: string;
    };
  };
  // Error response fields
  message?: string;
  error?: string;
  success?: boolean;
}

export interface UserProfile {
  _id?: string;
  id?: string; // Support both _id and id
  email: string;
  firstName: string;
  lastName: string;
  isKYCVerified: boolean;
  role?: "publisher" | "creator" | "admin";
  adminChatId?: string | null; // Admin chat ID for support
  createdAt: string;
  // Wallet addresses
  tonWalletAddress?: string;
  ethereumWalletAddress?: string;
  suiWalletAddress?: string;
  solanaWalletAddress?: string;
  authProviders?: string[]; // List of auth providers
  currentPlan?: CurrentPlanDetails | null;
  plan?: string | null;
  planType?: string;
}

export interface CurrentUserResponse {
  success: boolean;
  data: UserProfile;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<void> | null = null;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  // Public method to make API requests with automatic refreshToken handling
  // Use this instead of fetch() directly to ensure refreshToken is handled automatically
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, options);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Always check localStorage for fresh token (in case it was updated elsewhere)
    // This ensures we always have the latest token, even if it was updated in another tab/window
    let token = this.accessToken || localStorage.getItem("accessToken");

    // Also ensure refreshToken is synced
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem("refreshToken");
    }

    // Update internal token if we got it from localStorage
    if (token && token !== this.accessToken) {
      this.accessToken = token;
    }

    // List of public endpoints that don't require authentication
    // These endpoints should not trigger refreshToken logic
    const publicEndpoints = [
      // Authentication APIs
      "/auth/login",
      "/auth/register",
      "/auth/login-passport",
      "/auth/refresh-token",
      "/auth/login/2fa",

      // OAuth Authentication
      "/auth/google",
      "/auth/google/callback",
      "/auth/discord",
      "/auth/discord/callback",
      "/auth/telegram",

      // Wallet Authentication
      "/auth/wallet/connect",
      "/auth/wallet/check",
      "/auth/wallet/message",
      "/auth/wallet/signup",
      "/auth/wallet/simple-login",

      // Password Recovery
      "/auth/forgot-password",
      "/auth/verify-reset-code",
      "/auth/reset-password",

      // Game Projects APIs (Public)
      "/game-projects",
      "/game-projects/stats",
      "/game-projects/featured",
      "/game-projects/search",
      "/game-projects/for-sale",

      // File Upload & Processing (Webhooks - typically public/internal)
      "/files/webhook/process-file",
      "/files/sqs/status",
      "/files/sqs/process-once",

      // Health Check APIs
      "/health",
      "/", // Root health check
    ];

    // Check if endpoint is public
    // For dynamic routes like /game-projects/:id, we need exact match or specific path matching
    // Extract path without query parameters for matching
    const [endpointPath] = endpoint.split("?");

    const isPublicEndpoint = publicEndpoints.some((publicPath) => {
      // Exact match (ignoring query parameters)
      if (endpointPath === publicPath) {
        return true;
      }

      // For paths that start with the publicPath followed by "/"
      // This handles dynamic routes like /game-projects/:id
      if (endpointPath.startsWith(publicPath + "/")) {
        // Check if it's a protected sub-path that should NOT be public
        const protectedSubPaths = [
          "/game-projects/my-projects",
          "/game-projects/inventory",
          "/game-projects/purchase-history",
          "/game-projects/publisher-stats",
        ];

        // If it matches a protected sub-path, it's not public
        const isProtected = protectedSubPaths.some((protectedPath) =>
          endpointPath.startsWith(protectedPath)
        );

        return !isProtected;
      }

      // For root path
      if (publicPath === "/" && (endpointPath === "/" || endpointPath === "")) {
        return true;
      }

      return false;
    });

    // Add authorization header if access token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      // Only log for protected endpoints
      if (!isPublicEndpoint) {
        console.log(
          `[API] Making request to ${endpoint} with Authorization header`,
          {
            url: `${API_BASE_URL}${endpoint}`,
            hasToken: !!token,
            tokenPreview: token?.substring(0, 20) + "...",
          }
        );
      }
    } else {
      // Only log warning for protected endpoints that require authentication
      if (!isPublicEndpoint) {
        console.warn(
          `[API] Making request to ${endpoint} without Authorization header - no token found`,
          {
            url: `${API_BASE_URL}${endpoint}`,
            hasAccessTokenInMemory: !!this.accessToken,
            hasAccessTokenInStorage: !!localStorage.getItem("accessToken"),
          }
        );
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      console.log(`[API] Response from ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        hasAuth: !!headers.Authorization,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData: any = null;

        try {
          errorData = await response.json();
          console.error(`API Error [${endpoint}]:`, {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          // Ensure errorMessage is always a string
          const messageCandidate =
            errorData.message || errorData.error || errorMessage;
          errorMessage =
            typeof messageCandidate === "string"
              ? messageCandidate
              : JSON.stringify(messageCandidate);
        } catch (jsonError) {
          console.error(
            `API Error [${endpoint}] - Failed to parse error response:`,
            {
              status: response.status,
              statusText: response.statusText,
              jsonError,
            }
          );
        }

        // Check if we have token and this is a protected endpoint
        const hasToken =
          !isPublicEndpoint &&
          (this.accessToken || localStorage.getItem("accessToken"));
        const hasRefreshToken =
          this.refreshToken || localStorage.getItem("refreshToken");

        // Check if this is a token-related error that should trigger refresh
        // Ensure errorMessage is string before calling toLowerCase
        const errorMessageLower =
          typeof errorMessage === "string"
            ? errorMessage.toLowerCase()
            : String(errorMessage).toLowerCase();
        // Helper function to safely convert to string and check
        const safeStringCheck = (value: any, searchTerm: string): boolean => {
          if (!value) return false;
          const str = typeof value === "string" ? value : String(value);
          return str.toLowerCase().includes(searchTerm);
        };

        const isTokenError =
          response.status === 401 ||
          response.status === 403 ||
          (errorData &&
            (safeStringCheck(errorData.message, "token") ||
              safeStringCheck(errorData.message, "expired") ||
              safeStringCheck(errorData.message, "unauthorized") ||
              safeStringCheck(errorData.message, "authentication") ||
              safeStringCheck(errorData.message, "invalid token") ||
              safeStringCheck(errorData.message, "token expired") ||
              safeStringCheck(errorData.error, "token") ||
              safeStringCheck(errorData.error, "expired") ||
              safeStringCheck(errorData.error, "unauthorized"))) ||
          errorMessageLower.includes("token") ||
          errorMessageLower.includes("expired") ||
          errorMessageLower.includes("unauthorized");

        // For ANY error on protected endpoints with token, try refreshing token once
        // This ensures we catch token expiration even if server doesn't return proper error codes
        if (hasToken && hasRefreshToken) {
          console.log(
            `[API Interceptor] Error ${response.status} on protected endpoint ${endpoint}, attempting token refresh...`,
            {
              status: response.status,
              isTokenError,
              hasToken: true,
              hasRefreshToken: true,
              errorMessage,
              endpoint,
            }
          );

          try {
            // Always try to refresh token for any error on protected endpoints
            // The handleUnauthorizedResponse will handle retry logic
            if (
              isTokenError ||
              response.status === 401 ||
              response.status === 403
            ) {
              // For token-related errors, use full retry logic
              return await this.handleUnauthorizedResponse<T>(
                endpoint,
                url,
                config,
                headers,
                errorMessage
              );
            } else {
              // For other errors, try refresh but only retry if we get a fresh token
              // Save old token to compare
              const oldToken =
                this.accessToken || localStorage.getItem("accessToken");
              await this.refreshAccessToken();
              const freshToken = await this.waitForTokenRefresh();

              if (freshToken) {
                // Got token (new or same), retry the request
                console.log(
                  `[API Interceptor] Token refresh completed, retrying ${endpoint} with ${
                    freshToken !== oldToken ? "new" : "same"
                  } token...`
                );
                const retryHeaders = {
                  ...headers,
                  Authorization: `Bearer ${freshToken}`,
                };
                const retryConfig: RequestInit = {
                  ...config,
                  headers: retryHeaders,
                };

                const retryResponse = await fetch(url, retryConfig);

                if (retryResponse.ok) {
                  const contentType = retryResponse.headers.get("Content-Type");
                  if (contentType && contentType.includes("application/json")) {
                    console.log(
                      `[API Interceptor] Retry successful for ${endpoint} after token refresh`
                    );
                    return await retryResponse.json();
                  } else {
                    return {} as T;
                  }
                } else {
                  // Retry still failed, will throw original error
                  console.warn(
                    `[API Interceptor] Retry after token refresh still failed for ${endpoint} with status ${retryResponse.status}`
                  );
                }
              } else {
                console.warn(
                  `[API Interceptor] No fresh token received after refresh attempt for ${endpoint}`
                );
              }
            }
          } catch (refreshError) {
            // If refresh failed or retry still failed, log and continue to throw original error
            console.error(
              `[API Interceptor] Token refresh/retry failed for ${endpoint}:`,
              refreshError
            );
          }
        }

        throw new Error(errorMessage);
      }

      // Handle empty responses
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const jsonResponse = await response.json();
        console.log(`API Response [${endpoint}]:`, jsonResponse);
        return jsonResponse;
      } else {
        console.log(`API Response [${endpoint}]: No JSON content`);
        return {} as T;
      }
    } catch (error) {
      // Handle network errors and fetch failures
      // If we have a token and it's not a public endpoint,
      // the error might be due to expired token, try refreshing once
      if (
        error instanceof TypeError &&
        (error.message.includes("fetch") ||
          error.message.includes("network")) &&
        !isPublicEndpoint &&
        (this.accessToken || localStorage.getItem("accessToken"))
      ) {
        console.warn(
          `[API] Network error on ${endpoint}, checking if token refresh is needed...`
        );

        // Check if we have refresh token available
        const refreshTokenToUse =
          this.refreshToken || localStorage.getItem("refreshToken");

        if (refreshTokenToUse) {
          try {
            // Try to refresh token once before giving up
            await this.refreshAccessToken();
            const freshToken = await this.waitForTokenRefresh();

            if (freshToken) {
              // Retry the request with fresh token
              const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${freshToken}`,
              };
              const retryConfig: RequestInit = {
                ...config,
                headers: retryHeaders,
              };

              console.log(
                `[API] Retrying request to ${endpoint} after token refresh (network error recovery)`
              );

              const retryResponse = await fetch(url, retryConfig);

              if (retryResponse.ok) {
                const contentType = retryResponse.headers.get("Content-Type");
                if (contentType && contentType.includes("application/json")) {
                  return await retryResponse.json();
                } else {
                  return {} as T;
                }
              }
            }
          } catch (refreshError) {
            console.error(
              "[API] Token refresh failed during network error recovery:",
              refreshError
            );
            // Continue to throw original error
          }
        }
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Response interceptor: Handle 401 Unauthorized or 403 Forbidden - refresh token and retry
  private async handleUnauthorizedResponse<T>(
    endpoint: string,
    url: string,
    originalConfig: RequestInit,
    originalHeaders: Record<string, string>,
    originalErrorMessage: string
  ): Promise<T> {
    // Check if this is a refresh token endpoint (avoid infinite loop)
    if (endpoint.includes("/auth/refresh-token")) {
      console.error(
        "[API Interceptor] Refresh token endpoint returned 401/403, logging out"
      );
      this.logout();
      throw new Error("Session expired. Please login again.");
    }

    // Check for refresh token
    const refreshTokenToUse =
      this.refreshToken || localStorage.getItem("refreshToken");

    if (!refreshTokenToUse) {
      console.warn("[API Interceptor] No refresh token available, logging out");
      if (this.accessToken || localStorage.getItem("accessToken")) {
        this.logout();
      }
      throw new Error("Session expired. Please login again.");
    }

    try {
      console.log(
        `[API Interceptor] Unauthorized/Forbidden response for ${endpoint}, attempting token refresh...`
      );

      // Refresh token (will wait if already refreshing)
      await this.refreshAccessToken();

      // Wait for token refresh to complete and get fresh token
      const freshToken = await this.waitForTokenRefresh();

      if (!freshToken) {
        throw new Error("Failed to get new token after refresh");
      }

      // Retry the original request with new token
      const retryHeaders = {
        ...originalHeaders,
        Authorization: `Bearer ${freshToken}`,
      };

      const retryConfig: RequestInit = {
        ...originalConfig,
        headers: retryHeaders,
      };

      console.log(
        `[API Interceptor] Retrying request to ${endpoint} with refreshed token`
      );
      const retryResponse = await fetch(url, retryConfig);

      if (retryResponse.ok) {
        const contentType = retryResponse.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const jsonResponse = await retryResponse.json();
          console.log(`[API Interceptor] Request succeeded after retry:`, {
            endpoint,
            status: retryResponse.status,
          });
          return jsonResponse;
        } else {
          return {} as T;
        }
      } else {
        // Retry also failed
        let retryErrorMessage = `HTTP ${retryResponse.status}: ${retryResponse.statusText}`;
        try {
          const retryErrorData = await retryResponse.json();
          retryErrorMessage =
            retryErrorData.message || retryErrorData.error || retryErrorMessage;
        } catch (parseError) {
          // Ignore parse errors
        }

        // If still 401 after refresh, token is invalid
        if (retryResponse.status === 401) {
          console.error(
            "[API Interceptor] Still unauthorized after token refresh, logging out"
          );
          this.logout();
          throw new Error("Session expired. Please login again.");
        }

        throw new Error(retryErrorMessage);
      }
    } catch (refreshError) {
      // Refresh failed, logout user
      console.error("[API Interceptor] Token refresh failed:", refreshError);

      // Only logout if not already logged out
      if (this.accessToken || localStorage.getItem("accessToken")) {
        this.logout();
      }

      // Re-throw with user-friendly message
      if (refreshError instanceof Error) {
        if (
          refreshError.message.includes("No refresh token") ||
          refreshError.message.includes("Session expired") ||
          refreshError.message.includes("expired")
        ) {
          throw new Error("Session expired. Please login again.");
        }
        throw refreshError;
      }
      throw new Error("Session expired. Please login again.");
    }
  }

  // Refresh access token using refresh token - with queue for concurrent requests
  private async refreshAccessToken(): Promise<void> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Always check localStorage for fresh refresh token
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem("refreshToken");
    }

    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    // Set refreshing flag and create promise
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        console.log("[API Interceptor] Attempting to refresh access token...");
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = "Failed to refresh token";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If not valid JSON, use the text as error message
            errorMessage = errorText || errorMessage;
          }

          if (response.status === 404) {
            throw new Error("Refresh endpoint not implemented");
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Extract tokens from response - handle different response formats
        const newAccessToken = data.data?.accessToken || data.accessToken;
        const newRefreshToken =
          data.data?.refreshToken || data.refreshToken || this.refreshToken;

        if (!newAccessToken) {
          throw new Error("No access token received from refresh");
        }

        // Update tokens before notifying subscribers
        this.setTokens(newAccessToken, newRefreshToken);
        console.log("[API Interceptor] Token refreshed successfully", {
          hasNewAccessToken: !!newAccessToken,
          hasNewRefreshToken: !!newRefreshToken,
          tokenPreview: newAccessToken?.substring(0, 20) + "...",
        });

        // Notify all subscribers (queued requests) that token is refreshed
        // Use newAccessToken directly since we just set it
        const subscribers = [...this.refreshSubscribers]; // Copy array to avoid issues during iteration
        this.refreshSubscribers = []; // Clear before calling to prevent double calls
        subscribers.forEach((callback) => {
          try {
            callback(newAccessToken);
          } catch (err) {
            console.error("Error in refresh subscriber callback:", err);
          }
        });
      } catch (error) {
        // If refresh fails, clear tokens and logout
        console.error("[API Interceptor] Token refresh failed:", error);
        this.logout();
        throw error;
      } finally {
        // Reset refreshing state
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // Wait for token refresh to complete (for queued requests)
  private async waitForTokenRefresh(): Promise<string | null> {
    // If already refreshing, subscribe to get notified when token is ready
    if (this.isRefreshing && this.refreshPromise) {
      return new Promise((resolve, reject) => {
        let resolved = false;

        // Subscribe to get notified immediately when token is ready
        this.refreshSubscribers.push((token) => {
          if (!resolved) {
            resolved = true;
            resolve(token);
          }
        });

        // Also wait for the promise to complete as fallback
        this.refreshPromise!.then(() => {
          if (!resolved) {
            resolved = true;
            // After refresh completes, get the latest token
            const token =
              this.accessToken || localStorage.getItem("accessToken");
            resolve(token);
          }
        }).catch((error) => {
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        });
      });
    }

    // If not refreshing, check if we just finished refreshing
    // Wait a small amount to ensure token is synced to localStorage
    if (!this.isRefreshing && this.refreshPromise) {
      // Wait for the promise if it's still pending
      try {
        await this.refreshPromise;
        // Get token after refresh completes
        return this.accessToken || localStorage.getItem("accessToken");
      } catch (error) {
        // Refresh failed, return current token (will likely fail on retry)
        return this.accessToken || localStorage.getItem("accessToken");
      }
    }

    // If not refreshing, return current token immediately
    return this.accessToken || localStorage.getItem("accessToken");
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest("/health");
  }

  // Authentication endpoints
  async requestForgotPassword(email: string): Promise<{ message: string }> {
    return this.makeRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async verifyForgotPasswordPin(
    email: string,
    code: string
  ): Promise<{ message: string; token: string }> {
    return this.makeRequest("/auth/verify-reset-code", {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
  }

  async resetPassword(
    email: string,
    newPassword: string
  ): Promise<{ message: string }> {
    return this.makeRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, password: newPassword }),
    });
  }

  // Change Password
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    // Always get fresh token from localStorage to ensure we have the latest
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("[API] changePassword: No token found in localStorage");
      throw new Error("Authentication required. Please login again.");
    }

    // Update internal token
    if (token !== this.accessToken) {
      this.accessToken = token;
      console.log("[API] changePassword: Updated token from localStorage");
    }

    console.log("[API] changePassword: Token available:", !!token);
    console.log(
      "[API] changePassword: Full URL:",
      `${API_BASE_URL}/auth/change-password`
    );

    return this.makeRequest<{ success: boolean; message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }
    );
  }

  // Two-Factor Authentication (2FA)
  async generate2FASecret(): Promise<{
    success: boolean;
    message: string;
    data: {
      secret: string;
      qrCodeUrl: string;
      backupCodes: string[];
    };
  }> {
    return this.makeRequest("/auth/2fa/generate", {
      method: "GET",
    });
  }

  async enable2FA(token: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      backupCodes: string[];
    };
  }> {
    return this.makeRequest("/auth/2fa/enable", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async verify2FA(token: string): Promise<{
    success: boolean;
    message: string;
    data: {
      verified: boolean;
    };
  }> {
    return this.makeRequest("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  async disable2FA(): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.makeRequest("/auth/2fa/disable", {
      method: "POST",
    });
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log("Sending login request:", { email: credentials.email });
    const response = await this.makeRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    console.log("Login response received:", response);
    console.log("Response keys:", Object.keys(response));
    console.log(
      "Response.data keys:",
      response.data ? Object.keys(response.data) : "no data"
    );

    const responseAny = response as any;

    // Check if 2FA is required FIRST - before checking for tokens
    // Handle format: {"success":true,"message":"Login successful","data":{"requires2FA":true}}
    const requires2FA =
      response.data?.requires2FA ||
      responseAny.data?.requires2FA ||
      responseAny.requires2FA ||
      false;

    console.log("Checking 2FA requirement:", {
      requires2FA,
      responseData: response.data,
      responseAnyData: responseAny.data,
      responseKeys: Object.keys(responseAny),
    });

    if (requires2FA === true) {
      // Return response indicating 2FA is required (without tokens)
      // Skip token validation since tokens are not present in 2FA response
      console.log(
        "[API] 2FA is required for this user - skipping token validation"
      );
      return {
        data: {
          requires2FA: true,
        },
        message:
          response.message || responseAny.message || "2FA token required",
        success: responseAny.success || true,
      } as AuthResponse;
    }

    // Only check for tokens if 2FA is NOT required
    // Handle different response formats for normal login
    // Format 1: {success: true, message: '...', data: {accessToken, refreshToken, user}}
    // Format 2: {data: {accessToken, refreshToken, user}}
    // Format 3: {accessToken, refreshToken, user} (root level)
    // Format 4: {success: true, message: '...', data: {t verificationens: {accessToken, refreshToken}, user}}
    const accessToken =
      response.data?.accessToken ||
      responseAny.accessToken ||
      responseAny.data?.tokens?.accessToken ||
      responseAny.tokens?.accessToken;

    const refreshToken =
      response.data?.refreshToken ||
      responseAny.refreshToken ||
      responseAny.data?.tokens?.refreshToken ||
      responseAny.tokens?.refreshToken;

    const userData = response.data?.user || responseAny.user || response.data;

    console.log("AccessToken present:", !!accessToken);
    console.log("RefreshToken present:", !!refreshToken);
    console.log("User data present:", !!userData);

    if (!accessToken || !refreshToken) {
      console.error("Invalid login response: missing tokens", {
        response,
        hasData: !!response.data,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });

      // Check if there's an error message in the response
      if (response.message || (response as any).error) {
        throw new Error(
          response.message || (response as any).error || "Login failed"
        );
      }

      throw new Error(
        "Invalid response from server: missing authentication tokens"
      );
    }

    // Normalize response to ensure tokens are in the expected format
    const normalizedResponse: AuthResponse = {
      data: {
        accessToken,
        refreshToken,
        user: userData,
      },
      message: response.message || responseAny.message,
    };

    // Store the tokens
    this.setTokens(accessToken, refreshToken);

    console.log("[API] Login successful, tokens stored");

    return normalizedResponse;
  }

  async loginWith2FA(
    credentials: LoginRequest & { token: string }
  ): Promise<AuthResponse> {
    console.log("Sending login with 2FA request:", {
      email: credentials.email,
    });

    const response = await this.makeRequest<AuthResponse>("/auth/login/2fa", {
      method: "POST",
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        token: credentials.token, // Can be TOTP token or backup code
        rememberMe: credentials.rememberMe,
      }),
    });

    console.log("Login with 2FA response received:", response);

    const responseAny = response as any;

    // Extract tokens from response
    const accessToken =
      response.data?.accessToken ||
      responseAny.accessToken ||
      responseAny.data?.tokens?.accessToken ||
      responseAny.tokens?.accessToken;

    const refreshToken =
      response.data?.refreshToken ||
      responseAny.refreshToken ||
      responseAny.data?.tokens?.refreshToken ||
      responseAny.tokens?.refreshToken;

    const userData = response.data?.user || responseAny.user || response.data;

    if (!accessToken || !refreshToken) {
      console.error("Invalid 2FA login response: missing tokens", {
        response,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      if (response.message || (response as any).error) {
        throw new Error(
          response.message || (response as any).error || "2FA login failed"
        );
      }

      throw new Error(
        "Invalid response from server: missing authentication tokens"
      );
    }

    // Normalize response
    const normalizedResponse: AuthResponse = {
      data: {
        accessToken,
        refreshToken,
        user: userData,
      },
      message:
        response.message || responseAny.message || "Login with 2FA successful",
    };

    // Store the tokens
    this.setTokens(accessToken, refreshToken);

    console.log("[API] Login with 2FA successful, tokens stored");

    return normalizedResponse;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log("Sending register request:", {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
    });

    const response = await this.makeRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    console.log("Register response received:", response);
    console.log("Response keys:", Object.keys(response));
    console.log(
      "Response.data keys:",
      response.data ? Object.keys(response.data) : "no data"
    );
    console.log("AccessToken present:", !!response.data?.accessToken);
    console.log("RefreshToken present:", !!response.data?.refreshToken);

    if (!response.data?.accessToken || !response.data?.refreshToken) {
      console.error("Invalid register response: missing tokens", {
        response,
        hasData: !!response.data,
        hasAccessToken: !!response.data?.accessToken,
        hasRefreshToken: !!response.data?.refreshToken,
        responseKeys: Object.keys(response),
      });

      // Check if there's an error message in the response
      if (response.message || response.error) {
        throw new Error(
          response.message || response.error || "Registration failed"
        );
      }

      throw new Error(
        "Invalid response from server: missing authentication tokens"
      );
    }

    // Store the tokens from data object
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return response;
  }

  async loginWithPassport(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(
      "/auth/login-passport",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      }
    );

    // Store the tokens from data object
    if (response.data?.accessToken && response.data?.refreshToken) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response;
  }

  // User management endpoints (protected)
  async getCurrentUser(): Promise<CurrentUserResponse> {
    console.log(
      "Getting current user with token:",
      this.accessToken ? "present" : "missing"
    );
    const response = await this.makeRequest<CurrentUserResponse>("/users/me");
    if (response?.data?.currentPlan) {
      const plan = response.data.currentPlan;
      const { _id, ...planWithoutInternalId } = plan;
      const normalizedPlan: CurrentPlanDetails = {
        ...planWithoutInternalId,
        id:
          plan.id ||
          (typeof _id === "string" ? _id : (_id as any)?.toString?.()) ||
          undefined,
      };
      response.data = {
        ...response.data,
        currentPlan: normalizedPlan,
        plan: normalizedPlan.planType ?? response.data.plan ?? null,
        planType: normalizedPlan.planType ?? response.data.planType ?? null,
      };
    } else {
      response.data = {
        ...response.data,
        currentPlan: null,
        plan: response.data.plan ?? response.data.planType ?? null,
        planType: response.data.planType ?? response.data.plan ?? null,
      };
    }
    console.log("getCurrentUser response:", response);
    return response;
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return this.makeRequest("/users");
  }

  async getUserById(userId: string): Promise<UserProfile> {
    return this.makeRequest(`/users/${userId}`);
  }

  async getUserProfileWithReviews(userId: string): Promise<any> {
    return this.makeRequest(`/users/${userId}/profile`);
  }

  async updateUser(
    userId: string,
    userData: Partial<UserProfile>
  ): Promise<UserProfile> {
    return this.makeRequest(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.makeRequest(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  // Logout (clear tokens and all localStorage, reset Web3 wallets)
  async logout(): Promise<void> {
    try {
      // Reset all Web3 wallet states first
      await resetAllWeb3Wallets();

      // Clear tokens
      this.setTokens(null, null);

      // Clear all localStorage items using utility function
      clearAllLocalStorage();

      console.log("API service logout completed - all wallet states reset");
    } catch (error) {
      console.error("Error during API service logout:", error);
      // Still proceed with basic logout
      this.setTokens(null, null);
      clearAllLocalStorage();
    }
  }

  // Game Project endpoints
  async getGameProjects(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    // Add filter parameters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async getGameProjectById(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}`);
  }

  async getMyProjects(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    // Add filter parameters to query string
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/my-projects${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getFeaturedProjects(): Promise<any> {
    return this.makeRequest("/game-projects/featured");
  }

  async searchGameProjects(searchParams: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/search${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async createGameProject(projectData: any): Promise<any> {
    return this.makeRequest("/game-projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  async updateGameProject(id: string, projectData: any): Promise<any> {
    return this.makeRequest(`/game-projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(projectData),
    });
  }

  async deleteGameProject(id: string): Promise<void> {
    return this.makeRequest(`/game-projects/${id}`, {
      method: "DELETE",
    });
  }

  async publishGameProject(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/publish`, {
      method: "POST",
    });
  }

  async unpublishGameProject(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/unpublish`, {
      method: "POST",
    });
  }

  async likeGameProject(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/like`, {
      method: "POST",
    });
  }

  async purchaseGameProject(
    id: string,
    paymentDetails?: {
      paymentMethod?: string;
      paypalOrderId?: string;
      payerId?: string;
      paymentStatus?: string;
    }
  ): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/purchase`, {
      method: "POST",
      body: JSON.stringify(paymentDetails || {}),
    });
  }

  // Payment API - Create payment for project purchase
  async createPayment(data: {
    paymentType:
      | "project_purchase"
      | "subscription"
      | "collaboration_budget"
      | "contract_advance"
      | "contract_milestone"
      | "contract_completion";
    projectId?: string;
    collaborationId?: string;
    contractId?: string;
    planType?: string; // For subscription payments
    amount: number;
    currency?: string;
    description?: string;
    paymentMethod?: string;
  }): Promise<{
    success: boolean;
    data: {
      paymentId: string;
      approvalUrl: string;
      paypalOrderId: string;
    };
  }> {
    return this.makeRequest("/payment", {
      method: "POST",
      body: JSON.stringify({
        paymentType: data.paymentType,
        projectId: data.projectId,
        collaborationId: data.collaborationId,
        contractId: data.contractId,
        planType: data.planType,
        amount: data.amount,
        currency: data.currency || "USD",
        description: data.description,
        paymentMethod: data.paymentMethod || "paypal",
      }),
    });
  }

  // Payment API - Complete payment after user approval
  async completePayment(orderId: string): Promise<{
    success: boolean;
    data: {
      _id: string;
      payerId: string;
      payeeId: string;
      paymentType: string;
      status: string;
      paymentMethod: string;
      amount: number;
      currency: string;
      description: string;
      paypalOrderId: string;
      paypalCaptureId: string;
      projectId?: string;
      collaborationId?: string;
      contractId?: string;
      completedAt: string;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.makeRequest("/payment/complete", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
  }

  // ========== SUBSCRIPTION API ==========

  /**
   * Get all subscription plans
   * GET /subscription/plans
   */
  async getSubscriptionPlans(): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      planType: "free" | "pro" | "business";
      name: string;
      description: string;
      price: number;
      currency: string;
      billingPeriod: string;
      maxPrototypes: number;
      maxPrototypesPerMonth: number;
      maxAIRequests: number;
      maxAIRequestsPerMonth: number;
      maxTotalPrototypes: number;
      hasAdvancedFeatures: boolean;
      hasAnalyticsAccess: boolean;
      hasPrioritySupport: boolean;
      has247Support: boolean;
      hasCustomIntegrations: boolean;
      hasAdvancedAnalytics: boolean;
      isActive: boolean;
      isPopular: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    return this.makeRequest("/subscription/plans", { method: "GET" });
  }

  /**
   * Get current user's subscription plan
   * GET /subscription/my-plan
   */
  async getMySubscriptionPlan(): Promise<{
    success: boolean;
    data: {
      plan: {
        _id: string;
        planType: "free" | "pro" | "business";
        name: string;
        description: string;
        price: number;
        currency: string;
        billingPeriod: string;
        maxPrototypes: number;
        maxPrototypesPerMonth: number;
        maxAIRequests: number;
        maxAIRequestsPerMonth: number;
        maxTotalPrototypes: number;
        hasAdvancedFeatures: boolean;
        hasAnalyticsAccess: boolean;
        hasPrioritySupport: boolean;
        has247Support: boolean;
        hasCustomIntegrations: boolean;
        hasAdvancedAnalytics: boolean;
        isActive: boolean;
        isPopular: boolean;
      };
      subscription: {
        _id: string;
        userId: string;
        planId: string;
        planType: "free" | "pro" | "business";
        status: string;
        startDate: string;
        endDate: string | null;
        cancelledAt: string | null;
        expiresAt: string | null;
        paymentId: string | null;
        paymentMethod: string | null;
        autoRenew: boolean;
        prototypesCreated: number;
        aiRequestsUsed: number;
        lastResetDate: string;
        createdAt: string;
        updatedAt: string;
      };
      usage: {
        prototypesCreated: number;
        aiRequestsUsed: number;
        plan: any;
        limits: {
          maxPrototypes: number;
          maxPrototypesPerMonth: number;
          maxAIRequests: number;
          maxAIRequestsPerMonth: number;
          maxTotalPrototypes: number;
        };
      };
    };
  }> {
    return this.makeRequest("/subscription/my-plan", { method: "GET" });
  }

  /**
   * Get usage statistics
   * GET /subscription/usage
   */
  async getSubscriptionUsage(): Promise<{
    success: boolean;
    data: {
      prototypesCreated: number;
      aiRequestsUsed: number;
      plan: {
        planType: string;
        name: string;
        maxPrototypes: number;
        maxPrototypesPerMonth: number;
        maxAIRequests: number;
        maxAIRequestsPerMonth: number;
        maxTotalPrototypes: number;
      };
      limits: {
        maxPrototypes: number;
        maxPrototypesPerMonth: number;
        maxAIRequests: number;
        maxAIRequestsPerMonth: number;
        maxTotalPrototypes: number;
      };
    };
  }> {
    return this.makeRequest("/subscription/usage", { method: "GET" });
  }

  // Payment API - Refund payment
  async refundPayment(
    paymentId: string,
    data?: {
      amount?: number;
      reason?: string;
    }
  ): Promise<{
    success: boolean;
    data: {
      _id: string;
      status: string;
      refundDetails: {
        amount: string;
        refundId: string;
        status: string;
        reason?: string;
        refundedAt: string;
      };
    };
  }> {
    return this.makeRequest("/payment/refund", {
      method: "POST",
      body: JSON.stringify({
        paymentId,
        amount: data?.amount,
        reason: data?.reason,
      }),
    });
  }

  // Payment API - Get payment details
  async getPaymentDetails(paymentId: string): Promise<{
    success: boolean;
    data: {
      _id: string;
      payerId: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      payeeId: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      paymentType: string;
      status: string;
      amount: number;
      currency: string;
      projectId?: {
        id: string;
        title: string;
      };
      collaborationId?: string;
      contractId?: string;
      completedAt: string;
      createdAt: string;
    };
  }> {
    return this.makeRequest(`/payment/${paymentId}`);
  }

  // Payment API - Get payment list
  async getPayments(filters?: {
    paymentType?: string;
    status?: string;
    projectId?: string;
    collaborationId?: string;
    contractId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      paymentType: string;
      status: string;
      amount: number;
      currency: string;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/payment${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest(endpoint);
  }

  // Purchase and Inventory Management APIs - Updated to match documentation
  async getInventory(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/inventory${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPurchaseHistory(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/purchase-history${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  // Legacy endpoint for purchased projects
  async getPurchasedProjects(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/purchased${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getProjectsForSale(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/for-sale${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPublisherStats(): Promise<any> {
    return this.makeRequest("/game-projects/publisher-stats");
  }

  // Enhanced Inventory Management APIs
  async getInventoryItem(projectId: string): Promise<any> {
    return this.makeRequest(`/game-projects/inventory/${projectId}`);
  }

  async updateInventoryItem(projectId: string, updateData: any): Promise<any> {
    return this.makeRequest(`/game-projects/inventory/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  }

  async deleteInventoryItem(projectId: string): Promise<void> {
    return this.makeRequest(`/game-projects/inventory/${projectId}`, {
      method: "DELETE",
    });
  }

  async getInventoryByCategory(
    category: string,
    filters: any = {}
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append("category", category);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/inventory/category${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async searchInventory(searchQuery: string, filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append("q", searchQuery);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/inventory/search${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  // Enhanced Purchase History APIs
  async getPurchaseHistoryItem(transactionId: string): Promise<any> {
    return this.makeRequest(`/game-projects/purchase-history/${transactionId}`);
  }

  async getPurchaseHistoryByDateRange(
    startDate: string,
    endDate: string,
    filters: any = {}
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append("startDate", startDate);
    queryParams.append("endDate", endDate);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/game-projects/purchase-history/date-range${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async exportPurchaseHistory(format: "csv" | "json" = "json"): Promise<any> {
    return this.makeRequest(
      `/game-projects/purchase-history/export?format=${format}`
    );
  }

  // Bulk Operations
  async bulkUpdateInventory(
    updates: Array<{ id: string; data: any }>
  ): Promise<any> {
    return this.makeRequest("/game-projects/inventory/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({ updates }),
    });
  }

  async bulkDeleteInventory(projectIds: string[]): Promise<any> {
    return this.makeRequest("/game-projects/inventory/bulk-delete", {
      method: "DELETE",
      body: JSON.stringify({ projectIds }),
    });
  }

  async startCollaboration(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/start-collaboration`, {
      method: "POST",
    });
  }

  // Collaboration Management APIs
  async createCollaboration(collaborationData: any): Promise<any> {
    return this.makeRequest("/collaborations", {
      method: "POST",
      body: JSON.stringify(collaborationData),
    });
  }

  async getCollaborations(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/collaborations${queryString ? `?${queryString}` : ""}`;

    return this.makeRequest(endpoint);
  }

  async getCollaborationById(collaborationId: string): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}`);
  }

  async updateCollaboration(
    collaborationId: string,
    updateData: any
  ): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
  }

  async addCollaborationUpdate(
    collaborationId: string,
    updateData: any
  ): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}/updates`, {
      method: "POST",
      body: JSON.stringify(updateData),
    });
  }

  // Update Milestone Status
  // PATCH /api/collaborations/:id/milestones/status
  // Requires: milestoneIndex (number, min 0)
  // Optional: isCompleted (boolean), dueDate (ISO 8601 string), description (string), deliverables (string)
  async updateMilestoneStatus(
    collaborationId: string,
    milestoneData: {
      milestoneIndex: number; // Required: Index of milestone in milestones array (0-based)
      isCompleted?: boolean; // Optional: Completion status
      dueDate?: string; // Optional: ISO 8601 date string
      description?: string; // Optional: Milestone description
      deliverables?: string; // Optional: Deliverables for this milestone
    }
  ): Promise<any> {
    return this.makeRequest(
      `/collaborations/${collaborationId}/milestones/status`,
      {
        method: "PATCH",
        body: JSON.stringify(milestoneData),
      }
    );
  }

  // Collaboration Chat - Messages
  async getCollaborationMessages(collaborationId: string): Promise<any[]> {
    return this.makeRequest(`/collaborations/${collaborationId}/messages`, {
      method: "GET",
    });
  }

  async sendCollaborationMessage(
    collaborationId: string,
    payload: {
      content: string;
      type?: "text" | "file" | "system";
      attachments?: string[];
      replyTo?: string | null;
    }
  ): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Reports - Creator/Publisher: report a chat message in a collaboration
  async reportCollaborationMessage(
    collaborationId: string,
    messageId: string,
    payload: { reason: string; attachments?: string[] }
  ): Promise<any> {
    return this.makeRequest(
      `/collaborations/${collaborationId}/messages/${encodeURIComponent(
        messageId
      )}/report`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async acceptCollaboration(collaborationId: string): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}/accept`, {
      method: "POST",
    });
  }

  async rejectCollaboration(collaborationId: string): Promise<any> {
    return this.makeRequest(`/collaborations/${collaborationId}/reject`, {
      method: "POST",
    });
  }

  async getCollaborationStats(): Promise<any> {
    return this.makeRequest("/collaborations/stats");
  }

  // Publisher-specific collaboration endpoints
  async getPublisherCollaborations(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/collaborations/publisher/my-collaborations${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPublisherCollaborationStats(): Promise<any> {
    return this.makeRequest("/collaborations/publisher/stats");
  }

  // Creator-specific collaboration endpoints
  async getDeveloperCollaborations(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/collaborations/creator/my-collaborations${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPendingCollaborations(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/collaborations/creator/pending${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getDeveloperCollaborationStats(): Promise<any> {
    return this.makeRequest("/collaborations/creator/stats");
  }

  async getGameProjectStats(): Promise<any> {
    return this.makeRequest("/game-projects/stats");
  }

  async getMyDeveloperStats(): Promise<any> {
    return this.makeRequest("/game-projects/my-stats");
  }

  // File upload endpoints
  async getPresignedUrl(fileData: {
    fileName: string;
    fileType: "video" | "image" | "archive";
    contentType: string;
    fileSize: number;
  }): Promise<{ uploadUrl: string; fileKey: string }> {
    return this.makeRequest("/files/presigned-url", {
      method: "POST",
      body: JSON.stringify(fileData),
    });
  }

  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file to S3");
    }
  }

  // Enhanced project creation with file support
  async createProjectWithFiles(projectData: {
    title: string;
    shortDescription: string;
    projectType: "idea_sale" | "product_sale" | "dev_collaboration";
    ideaSaleData?: any;
    productSaleData?: any;
    creatorCollaborationData?: any;
    fileKeys?: string[]; // S3 keys from presigned-url response
    fileUrls?: string[]; // Upload URLs from presigned-url response
    attachments?: string[]; // Additional attachments like banner images
  }): Promise<any> {
    return this.makeRequest("/game-projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
  }

  // Get download URL for a file from S3
  async getDownloadUrl(fileKey: string): Promise<{ url: string }> {
    return this.makeRequest(`/s3/download-url/${encodeURIComponent(fileKey)}`);
  }

  // Analytics API endpoints
  async getAnalyticsOverview(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/overview${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPurchaseAnalytics(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/purchases${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getSpendingAnalytics(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/spending${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getCollaborationAnalytics(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/collaborations${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPurchaseActivity(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/purchase-activity${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getSpendingTrends(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/spending-trends${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getPublisherDashboard(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/publisher/dashboard${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getDeveloperDashboard(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/creator/dashboard${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  async getCreatorEarningsChart(filters: any = {}): Promise<any> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/analytics/creator/earnings-chart${
      queryString ? `?${queryString}` : ""
    }`;

    return this.makeRequest(endpoint);
  }

  // Publisher Analytics API Methods
  async getPublisherBudgetAnalytics(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/budget${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getPublisherCollaborationPerformance(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/collaboration-performance${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getPublisherProjectAnalytics(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/projects${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getPublisherROIAnalytics(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/roi${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getPublisherPaymentAnalytics(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/payments${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  async getPublisherExtendedDashboard(filters?: any) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/analytics/publisher/extended-dashboard${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    return this.makeRequest(endpoint);
  }

  // ========== USER-TO-USER CHAT ==========

  /**
   * Get all chats for current user
   * GET /chats
   */
  async getChats(): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      otherUser: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
      };
      lastMessage?: {
        id: string;
        content: string;
        messageType: string;
        senderId: string;
        attachments: string[];
        replyTo?: string;
        createdAt: string;
      };
      lastMessageAt?: string;
      unreadCount: number;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    return this.makeRequest("/chats", { method: "GET" });
  }

  /**
   * Create or get existing chat with a user
   * POST /chats
   */
  async createOrGetChat(userId: string): Promise<{
    success: boolean;
    data: {
      id: string;
      otherUser: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
      };
      lastMessage?: any;
      lastMessageAt?: string;
      unreadCount: number;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    return this.makeRequest("/chats", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  /**
   * Get messages for a chat
   * GET /chats/:chatId/messages
   */
  async getChatMessages(chatId: string): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      content: string;
      messageType: "text" | "file" | "system";
      senderId: string;
      attachments: string[];
      replyTo?: string;
      createdAt: string;
    }>;
  }> {
    return this.makeRequest(`/chats/${chatId}/messages`, { method: "GET" });
  }

  /**
   * Send message to a chat
   * POST /chats/:chatId/messages
   */
  async sendChatMessage(
    chatId: string,
    payload: {
      content: string;
      type?: "text" | "file" | "system";
      attachments?: string[];
      replyTo?: string;
    }
  ): Promise<{
    success: boolean;
    data: {
      id: string;
      content: string;
      messageType: string;
      senderId: string;
      attachments: string[];
      replyTo?: string;
      createdAt: string;
    };
  }> {
    return this.makeRequest(`/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Mark messages as read in a chat
   * POST /chats/:chatId/read
   */
  async markChatAsRead(chatId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.makeRequest(`/chats/${chatId}/read`, { method: "POST" });
  }

  /**
   * Get total unread count across all chats
   * GET /chats/unread/count
   */
  async getUnreadCount(): Promise<{
    success: boolean;
    data: { unreadCount: number };
  }> {
    return this.makeRequest("/chats/unread/count", { method: "GET" });
  }

  /**
   * Search users
   * GET /users?search=...&limit=...
   */
  async searchUsers(params?: { search?: string; limit?: number }): Promise<{
    success: boolean;
    data: Array<{
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      role?: string;
      avatar?: string;
      isActive: boolean;
      adminChatId?: string;
      createdAt: string;
      updatedAt: string;
    }>;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) {
      queryParams.append("search", params.search);
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }
    const queryString = queryParams.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ""}`;
    return this.makeRequest(endpoint, { method: "GET" });
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
