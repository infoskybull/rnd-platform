const API_BASE_URL =
  (window as any).__API_BASE_URL__ ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

// API service for real database integration
import {
  clearAllLocalStorage,
  resetAllWeb3Wallets,
} from "../utils/storageUtils";

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
  role?: "publisher" | "creator";
  createdAt: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

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
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify-reset-code",
      "/auth/refresh-token",
      "/auth/login/2fa",
      "/health",
    ];

    const isPublicEndpoint = publicEndpoints.some((publicPath) =>
      endpoint.startsWith(publicPath)
    );

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

        try {
          const errorData = await response.json();
          console.error(`API Error [${endpoint}]:`, {
            status: response.status,
            statusText: response.statusText,
            errorData,
          });
          errorMessage = errorData.message || errorData.error || errorMessage;
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

        // If unauthorized and we have a refresh token, try to refresh
        // Note: Skip refresh for login/register/public endpoints, but allow for protected auth endpoints like change-password and 2FA
        const shouldSkipRefresh =
          endpoint.includes("/auth/login") ||
          endpoint.includes("/auth/register") ||
          endpoint.includes("/auth/forgot-password") ||
          endpoint.includes("/auth/reset-password") ||
          endpoint.includes("/auth/verify-reset-code") ||
          endpoint.includes("/auth/login/2fa") ||
          endpoint.includes("/auth/refresh-token");

        if (response.status === 401 && !shouldSkipRefresh) {
          // Check for refresh token in localStorage if not in memory
          const refreshTokenToUse =
            this.refreshToken || localStorage.getItem("refreshToken");

          if (refreshTokenToUse) {
            try {
              console.log(
                `[API] Token expired for ${endpoint}, attempting refresh...`
              );
              await this.refreshAccessToken();

              // Get fresh token after refresh
              const freshToken =
                this.accessToken || localStorage.getItem("accessToken");

              if (!freshToken) {
                throw new Error("Failed to get new token after refresh");
              }

              // Retry the original request with new token
              const retryHeaders = {
                ...headers,
                Authorization: `Bearer ${freshToken}`,
              };

              const retryConfig: RequestInit = {
                ...config,
                headers: retryHeaders,
              };

              console.log(
                `[API] Retrying request to ${endpoint} with refreshed token`
              );
              const retryResponse = await fetch(url, retryConfig);

              if (retryResponse.ok) {
                const contentType = retryResponse.headers.get("Content-Type");
                if (contentType && contentType.includes("application/json")) {
                  return await retryResponse.json();
                } else {
                  return {} as T;
                }
              } else {
                // Retry also failed, throw original error with retry response
                try {
                  const retryErrorData = await retryResponse.json();
                  throw new Error(retryErrorData.message || errorMessage);
                } catch (parseError) {
                  throw new Error(errorMessage);
                }
              }
            } catch (refreshError) {
              // Refresh failed, logout user
              console.warn("Token refresh failed:", refreshError);
              this.logout();
              throw new Error("Session expired. Please login again.");
            }
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
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error occurred");
    }
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    // Always check localStorage for fresh refresh token
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem("refreshToken");
    }

    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    console.log("[API] Attempting to refresh access token...");
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

    this.setTokens(newAccessToken, newRefreshToken);
    console.log("[API] Token refreshed successfully");
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
  async getCurrentUser(): Promise<UserProfile> {
    console.log(
      "Getting current user with token:",
      this.accessToken ? "present" : "missing"
    );
    const userProfile = await this.makeRequest<UserProfile>("/users/me");
    console.log("getCurrentUser response:", userProfile);
    return userProfile;
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

  async purchaseGameProject(id: string): Promise<any> {
    return this.makeRequest(`/game-projects/${id}/purchase`, {
      method: "POST",
    });
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
    devCollaborationData?: any;
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
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
