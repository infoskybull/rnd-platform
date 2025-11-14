export interface ProjectDetails {
  title: string;
  description: string;
  price: string;
  seller: string;
}

export interface CurrentPlanDetails {
  _id?: string;
  id?: string;
  planType: "free" | "pro" | "business" | string;
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  billingPeriod?: string;
  maxPrototypes?: number;
  maxPrototypesPerMonth?: number;
  maxAIRequests?: number;
  maxAIRequestsPerMonth?: number;
  maxTotalPrototypes?: number;
  hasAdvancedFeatures?: boolean;
  hasAnalyticsAccess?: boolean;
  hasPrioritySupport?: boolean;
  has247Support?: boolean;
  hasCustomIntegrations?: boolean;
  hasAdvancedAnalytics?: boolean;
}

export interface User {
  id: string; // Internal use, mapped from _id
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Computed property for display
  role?: "publisher" | "creator" | "admin"; // User role
  isKYCVerified: boolean;
  plan?: "free" | "pro" | "business" | string | null; // Derived plan code for legacy UI flows
  currentPlan?: CurrentPlanDetails | null; // Full plan details for access control
  createdAt: string; // ISO string for Redux serialization
  adminChatId?: string; // Admin chat ID for user-to-admin support chats
  // Wallet addresses
  tonWalletAddress?: string;
  ethereumWalletAddress?: string;
  suiWalletAddress?: string;
  solanaWalletAddress?: string;
  authProviders?: string[]; // List of auth providers: ["local", "ton_wallet", etc.]
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorToken?: string; // Optional 2FA token or backup code
}

export interface ForgotPasswordState {
  email: string;
  pin: string;
  newPassword: string;
  confirmPassword: string;
  verificationToken: string | null;
  step: "email" | "pin" | "password";
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "publisher" | "creator";
  confirmPassword: string;
}

// Auth-related types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  requires2FA?: boolean;
  pending2FA?: {
    email: string;
    password: string;
    rememberMe?: boolean;
  } | null;
}

// Game Project Types
export type ProjectType = "idea_sale" | "product_sale" | "dev_collaboration";
export type ProjectStatus =
  | "draft"
  | "published"
  | "sold"
  | "in_collaboration"
  | "completed"
  | "cancelled";

export interface IdeaSaleData {
  description: string;
  videoUrl?: string;
  prototypeImages: string[];
  askingPrice: number;
  gameGenre?: string;
  targetPlatform?: string;
  tags: string[];
}

export interface ProductSaleData {
  description: string;
  codeFolderPath: string;
  screenshots: string[];
  demoUrl?: string;
  askingPrice: number;
  gameGenre?: string;
  targetPlatform?: string;
  tags: string[];
  techStack?: string;
  isPlayable: boolean;
}

export interface CreatorCollaborationData {
  description: string;
  proposal: string;
  budget: number;
  timeline: string;
  prototypeImages: string[];
  videoUrl?: string;
  gameGenre?: string;
  targetPlatform?: string;
  tags: string[];
  skills: string[];
}

export interface GameProject {
  _id: string;
  creatorId: string;
  owner?: User;
  originalDeveloper?: User; // Creator who originally created the project
  title: string;
  shortDescription: string;
  projectType: ProjectType;
  status: ProjectStatus;
  ideaSaleData?: IdeaSaleData;
  productSaleData?: ProductSaleData;
  creatorCollaborationData?: CreatorCollaborationData;
  publisherId?: string;
  soldAt?: Date;
  collaborationStartDate?: Date;
  collaborationEndDate?: Date;
  viewCount: number;
  likeCount: number;
  likedBy: string[];
  publishedAt?: Date;
  isFeatured: boolean;
  searchKeywords: string[];
  attachments: string[];
  fileUrls?: string[]; // URLs to project source files
  averageRating: number;
  reviewCount: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameProjectListResponse {
  projects: GameProject[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GameProjectFilters {
  projectType?: ProjectType;
  status?: ProjectStatus;
  creatorId?: string;
  publisherId?: string;
  search?: string;
  gameGenre?: string;
  targetPlatform?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  minBudget?: number;
  maxBudget?: number;
  isFeatured?: boolean;
  sortBy?:
    | "createdAt"
    | "publishedAt"
    | "viewCount"
    | "likeCount"
    | "askingPrice"
    | "budget";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// File Upload Types
export interface FileUploadResult {
  fileKey: string;
  uploadUrl: string;
  error?: string;
}

export interface PresignedUrlRequest {
  fileName: string;
  fileType: "video" | "image" | "archive";
  contentType: string;
  fileSize: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  bucket: string;
  expiresIn: number;
}

// Project Creation Types
export interface ProjectCreationData {
  title: string;
  shortDescription: string;
  projectType: ProjectType;
  ideaSaleData?: {
    description: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  productSaleData?: {
    description: string;
    codeFolderPath: string;
    askingPrice: number;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
  };
  creatorCollaborationData?: {
    description: string;
    proposal: string;
    budget: number;
    timeline: string;
    gameGenre?: string;
    targetPlatform?: string;
    tags?: string[];
    skills?: string[];
  };
  fileKeys?: string[]; // S3 keys from presigned-url response
  fileUrls?: string[]; // Upload URLs from presigned-url response
  attachments?: string[]; // Additional attachments like banner images
  thumbnail?: string; // Project banner/thumbnail image URL
}

export interface ProjectCreationResult {
  success: boolean;
  projectId?: string;
  error?: string;
}

// Purchase and Inventory Types
export interface PurchaseResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    status: ProjectStatus;
    publisherId: string;
    soldAt: string;
    creatorId: string;
    owner: User;
    originalDeveloper: User;
  };
}

export interface InventoryFilters {
  page?: number;
  limit?: number;
  projectType?: "idea_sale" | "product_sale" | "dev_collaboration";
  status?: "sold" | "in_collaboration" | "completed";
  search?: string;
  gameGenre?: string;
  targetPlatform?: string;
  tag?: string;
  sortBy?: "soldAt" | "createdAt" | "askingPrice" | "title";
  sortOrder?: "asc" | "desc";
}

export interface PurchaseHistoryFilters {
  page?: number;
  limit?: number;
  projectType?: "idea_sale" | "product_sale" | "dev_collaboration";
  search?: string;
  sortBy?: "soldAt" | "createdAt" | "askingPrice" | "title";
  sortOrder?: "asc" | "desc";
}

export interface ProjectsForSaleFilters {
  page?: number;
  limit?: number;
  projectType?: ProjectType;
  gameGenre?: string;
  targetPlatform?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?:
    | "createdAt"
    | "publishedAt"
    | "askingPrice"
    | "viewCount"
    | "likeCount";
  sortOrder?: "asc" | "desc";
}

// Enhanced Inventory Types - Updated to match API documentation
export interface InventoryItem {
  _id: string;
  title: string;
  shortDescription: string;
  projectType: "idea_sale" | "product_sale" | "dev_collaboration";
  status: "sold" | "in_collaboration" | "completed";
  soldAt: string;
  ideaSaleData?: {
    description: string;
    askingPrice: number;
    gameGenre: string;
    targetPlatform: string;
    tags: string[];
  };
  productSaleData?: {
    description: string;
    askingPrice: number;
    gameGenre: string;
    targetPlatform: string;
    tags: string[];
    demoUrl?: string;
    screenshots?: string[];
  };
  creatorCollaborationData?: {
    description: string;
    budget: number;
    gameGenre: string;
    targetPlatform: string;
    tags: string[];
    collaborationType: string;
    estimatedDuration: string;
  };
  creatorId: string;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  originalDeveloper?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  viewCount: number;
  likeCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface InventoryResponse {
  projects: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PurchaseHistoryResponse {
  projects: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  byProjectType: Record<ProjectType, number>;
  byStatus: Record<string, number>;
  recentPurchases: number;
  averagePurchasePrice: number;
  mostExpensiveItem: InventoryItem;
  leastExpensiveItem: InventoryItem;
}

export interface PurchaseHistoryItem {
  _id: string;
  projectId: string;
  project: GameProject;
  purchaseDate: string;
  purchasePrice: number;
  paymentMethod?: string;
  transactionId?: string;
  status: "completed" | "pending" | "failed" | "refunded";
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PurchaseHistoryStats {
  totalPurchases: number;
  totalSpent: number;
  averagePurchasePrice: number;
  byProjectType: Record<ProjectType, { count: number; total: number }>;
  byMonth: Record<string, { count: number; total: number }>;
  recentActivity: PurchaseHistoryItem[];
}

export interface InventoryUpdateData {
  status?: "active" | "archived" | "deleted";
  notes?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface BulkInventoryUpdate {
  id: string;
  data: InventoryUpdateData;
}

export interface InventorySearchFilters {
  projectType?: ProjectType;
  status?: string;
  gameGenre?: string;
  targetPlatform?: string;
  minPrice?: number;
  maxPrice?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  sortBy?: "purchaseDate" | "purchasePrice" | "projectTitle" | "lastAccessed";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Collaboration Types
export interface Collaboration {
  _id: string;
  projectId: string;
  project: {
    _id: string;
    title: string;
    shortDescription: string;
    projectType: "idea_sale" | "product_sale" | "dev_collaboration";
    status: "sold" | "in_collaboration" | "completed";
  };
  publisherId: string;
  publisher: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  creatorId: string;
  creator: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  status: "pending" | "active" | "completed" | "cancelled";
  currentPhase:
    | "planning"
    | "development"
    | "testing"
    | "deployment"
    | "completed";
  budget: number;
  timeline: string;
  description: string;
  deliverables: string;
  milestones: string[];
  startDate: string;
  endDate: string;
  communicationChannels: string[];
  communicationDetails: string;
  progressPercentage: number;
  completedMilestones: string[];
  pendingTasks: string[];
  sharedFiles: string[];
  deliveredFiles: string[];
  paidAmount: number;
  paymentHistory: PaymentRecord[];
  updates: CollaborationUpdate[];
  termsAndConditions: string;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollaborationUpdate {
  _id: string;
  type: "milestone" | "progress" | "message" | "file_upload";
  title: string;
  description: string;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  _id: string;
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface CollaborationFilters {
  page?: number;
  limit?: number;
  projectId?: string;
  publisherId?: string;
  creatorId?: string;
  status?: "pending" | "active" | "completed" | "cancelled";
  currentPhase?:
    | "planning"
    | "development"
    | "testing"
    | "deployment"
    | "completed";
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "budget" | "progressPercentage";
  sortOrder?: "asc" | "desc";
}

export interface CollaborationResponse {
  collaborations: Collaboration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CollaborationStats {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  pendingCollaborations: number;
  totalBudget: number;
  totalPaid: number;
  averageRating: number;
}

export interface CreateCollaborationRequest {
  projectId: string;
  description: string;
  deliverables: string;
  budget: number;
  timeline: string;
  milestones: string[];
  communicationChannels: string[];
  communicationDetails: string;
  termsAndConditions: string;
  startDate: string;
  endDate: string;
}

export interface UpdateCollaborationRequest {
  status?: "pending" | "active" | "completed" | "cancelled";
  currentPhase?:
    | "planning"
    | "development"
    | "testing"
    | "deployment"
    | "completed";
  progressPercentage?: number;
  completedMilestones?: string[];
  pendingTasks?: string[];
  sharedFiles?: string[];
  communicationDetails?: string;
}

export interface AddUpdateRequest {
  type: "milestone" | "progress" | "message" | "file_upload";
  title: string;
  description: string;
  attachments?: string[];
}

export interface UpdateMilestoneStatusRequest {
  milestoneIndex: number; // Required: Index of milestone in milestones array (0-based)
  isCompleted?: boolean; // Optional: Completion status
  dueDate?: string; // Optional: ISO 8601 date string
  description?: string; // Optional: Milestone description
  deliverables?: string; // Optional: Deliverables for this milestone
}

// Analytics API Types - Updated to match API documentation
export interface AnalyticsFilters {
  dateFrom?: string; // ISO 8601 format
  dateTo?: string; // ISO 8601 format
  projectType?: "IDEA_SALE" | "PRODUCT_SALE" | "DEV_COLLABORATION";
  period?: "6months" | "12months" | "24months";
  page?: number;
  limit?: number;
}

export interface AnalyticsOverview {
  totalPurchases: number;
  totalSpent: number;
  activeCollaborations: number;
  completedContracts: number;
  recentPurchases: Array<{
    id: string;
    projectTitle: string;
    amount: number;
    purchaseDate: string;
  }>;
  spendingThisMonth: number;
  lastUpdated: string;
}

export interface PurchaseAnalytics {
  totalPurchases: number;
  totalSpent: number;
  averagePurchaseValue: number;
  topPurchasedCategories: Array<{
    category: string;
    count: number;
    totalSpent: number;
  }>;
  purchaseTrends: Array<{
    period: string;
    count: number;
    totalSpent: number;
  }>;
  lastUpdated: string;
}

export interface SpendingAnalytics {
  totalSpent: number;
  spendingThisMonth: number;
  spendingLastMonth: number;
  monthlyGrowth: number;
  averageMonthlySpending: number;
  spendingByCategory: Array<{
    category: string;
    totalSpent: number;
    count: number;
  }>;
  spendingTrends: Array<{
    period: string;
    count: number;
    totalSpent: number;
  }>;
  lastUpdated: string;
}

export interface CollaborationAnalytics {
  activeCollaborations: number;
  completedContracts: number;
  totalCollaborationValue: number;
  averageCollaborationDuration: number;
  collaborationSuccessRate: number;
  collaborationTrends: Array<{
    period: string;
    count: number;
    totalValue: number;
  }>;
  lastUpdated: string;
}

export interface PurchaseActivity {
  activities: Array<{
    id: string;
    projectTitle: string;
    projectType: string;
    amount: number;
    seller: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
    buyer: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
    };
    purchaseDate: string;
    status: string;
    thumbnail?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastUpdated: string;
}

export interface SpendingTrends {
  period: string;
  trends: Array<{
    period: string;
    spending: number;
    growth: number; // Phần trăm tăng trưởng
  }>;
  lastUpdated: Date | string;
}

export interface EarningsChartData {
  period: string; // "6months" | "12months" | "24months"
  data: Array<{
    month: string; // Format: "YYYY-MM" (e.g., "2024-01")
    monthLabel: string; // Format: "Jan 2024" hoặc "Tháng 1/2024"
    projectCount: number; // Số project trong tháng
    totalEarnings: number; // Tổng earnings của tháng (USD)
    averageEarningsPerProject?: number; // Trung bình earnings mỗi project (optional)
    growth?: number; // Growth percentage so với tháng trước (optional)
  }>;
  summary?: {
    totalProjects: number; // Tổng số project trong period
    totalEarnings: number; // Tổng earnings trong period
    averageMonthlyEarnings: number; // Trung bình earnings mỗi tháng
    bestMonth?: {
      month: string;
      earnings: number;
    };
  };
  lastUpdated?: string; // ISO 8601 timestamp
}

// Publisher-specific analytics interfaces
export interface PublisherBudgetAnalytics {
  totalBudgetAllocated: number;
  totalBudgetSpent: number;
  remainingBudget: number;
  budgetUtilizationRate: number;
  averageProjectBudget: number;
  budgetByProjectType: Array<{
    projectType: string;
    totalBudget: number;
    spentBudget: number;
    projectCount: number;
  }>;
  monthlyBudgetTrends: Array<{
    period: string;
    allocated: number;
    spent: number;
    remaining: number;
  }>;
  lastUpdated: string;
}

export interface PublisherCollaborationPerformance {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  cancelledCollaborations: number;
  averageCollaborationDuration: number;
  collaborationSuccessRate: number;
  averageProjectRating: number;
  topPerformingDevelopers: Array<{
    creatorId: string;
    developerName: string;
    completedProjects: number;
    averageRating: number;
    totalBudget: number;
  }>;
  collaborationTimeline: Array<{
    period: string;
    started: number;
    completed: number;
    cancelled: number;
  }>;
  lastUpdated: string;
}

export interface PublisherProjectAnalytics {
  totalProjectsPurchased: number;
  totalProjectsInDevelopment: number;
  totalProjectsCompleted: number;
  averageProjectValue: number;
  totalProjectInvestment: number;
  projectsByStatus: Array<{
    status: string;
    count: number;
    totalValue: number;
  }>;
  projectsByType: Array<{
    projectType: string;
    count: number;
    totalValue: number;
    averageValue: number;
  }>;
  projectCompletionRates: Array<{
    projectType: string;
    completionRate: number;
    averageDuration: number;
  }>;
  lastUpdated: string;
}

export interface PublisherROIAnalytics {
  totalInvestment: number;
  totalRevenue: number;
  netROI: number;
  averageROI: number;
  roiByProjectType: Array<{
    projectType: string;
    investment: number;
    revenue: number;
    roi: number;
  }>;
  roiTrends: Array<{
    period: string;
    investment: number;
    revenue: number;
    roi: number;
  }>;
  lastUpdated: string;
}

export interface PublisherPaymentAnalytics {
  totalPaymentsMade: number;
  totalAmountPaid: number;
  averagePaymentAmount: number;
  paymentsByStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    totalAmount: number;
  }>;
  paymentTimeline: Array<{
    period: string;
    count: number;
    totalAmount: number;
  }>;
  pendingPayments: number;
  overduePayments: number;
  lastUpdated: string;
}

export interface PublisherDashboard {
  overview: AnalyticsOverview;
  purchaseAnalytics: PurchaseAnalytics;
  spendingAnalytics: SpendingAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
}

// Creator-specific analytics interfaces
export interface DeveloperCollaborationProjects {
  totalProjects: number;
  projects: Array<{
    collaborationId: string;
    projectId: string;
    projectTitle: string;
    projectType: string;
    projectStatus: string;
    publisherName: string;
    publisherEmail: string;
    budget: number;
    status: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>;
}

export interface DeveloperCollaborationDetails {
  totalCollaborations: number;
  activeCollaborations: number;
  completedCollaborations: number;
  totalEarnings: number;
  averageProjectValue: number;
  topPublishers: Array<{
    publisherId: string;
    publisherName: string;
    publisherEmail: string;
    collaborationCount: number;
    totalBudget: number;
    completedProjects: number;
  }>;
  successRate: number;
}

export interface DeveloperDashboard {
  overview: AnalyticsOverview;
  purchaseAnalytics: PurchaseAnalytics;
  spendingAnalytics: SpendingAnalytics;
  collaborationAnalytics: CollaborationAnalytics;
}

// Contract Management Types
export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  budget: number;
  dueDate: Date;
  deliverables: string[];
  paymentPercentage: number;
  isCompleted: boolean;
  completedAt?: Date;
  paymentStatus: "pending" | "paid" | "overdue";
}

export interface ContractSignature {
  userId?: string; // Optional - may not be in response
  signatureData: string;
  ipAddress: string;
  userAgent: string;
  signedAt: Date | string; // Can be Date or ISO string
}

export interface Contract {
  _id: string;
  collaborationId: string;
  publisherId: string;
  creatorId?: string; // Alternative field name
  contractTitle: string;
  contractDescription: string;
  contractType:
    | "development"
    | "publishing"
    | "marketing"
    | "support"
    | "maintenance"
    | "consulting"; // Added consulting type from docs
  status:
    | "draft"
    | "pending_signature"
    | "active"
    | "completed"
    | "terminated"
    | "expired";
  totalBudget: number;
  advancePayment: number;
  paymentSchedule:
    | "monthly"
    | "quarterly"
    | "milestone_based"
    | "time_based" // Added from docs
    | "completion_based" // Added from docs
    | "upfront"
    | "completion";
  milestones: ContractMilestone[];
  termsAndConditions: string;
  contractStartDate: Date;
  contractEndDate: Date;
  signedAt?: Date;
  activatedAt?: Date;
  completedAt?: Date;
  publisherSignature?: ContractSignature;
  creatorSignature?: ContractSignature;
  signatures?: ContractSignature[]; // Legacy field
  isFullySigned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContractFilters {
  page?: number;
  limit?: number;
  status?: Contract["status"];
  contractType?: Contract["contractType"];
  collaborationId?: string;
  publisherId?: string;
  creatorId?: string;
  search?: string;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "totalBudget"
    | "contractStartDate"
    | "contractEndDate";
  sortOrder?: "asc" | "desc";
}

export interface ContractResponse {
  contracts: Contract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  pendingContracts: number;
  totalBudget: number;
  totalPaid: number;
  averageContractValue: number;
  contractsByType: Record<string, number>;
  contractsByStatus: Record<string, number>;
}

export interface CreateContractRequest {
  collaborationId: string;
  contractTitle: string;
  contractDescription: string;
  contractType: Contract["contractType"];
  totalBudget: number;
  advancePayment: number;
  paymentSchedule: Contract["paymentSchedule"];
  milestones: Omit<
    ContractMilestone,
    "id" | "isCompleted" | "completedAt" | "paymentStatus"
  >[];
  termsAndConditions: string;
  contractStartDate: string;
  contractEndDate: string;
}

export interface UpdateContractRequest {
  contractTitle?: string;
  contractDescription?: string;
  totalBudget?: number;
  advancePayment?: number;
  paymentSchedule?: Contract["paymentSchedule"];
  termsAndConditions?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

export interface SignContractRequest {
  signatureData: string;
  ipAddress: string;
  userAgent: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  budget?: number;
  dueDate?: string; // ISO 8601 format
  deliverables?: string[];
  paymentPercentage?: number; // 0-100
  isCompleted?: boolean;
  completedAt?: string; // Auto-set when isCompleted is true
}

export interface MilestoneProgressResponse {
  contractId: string;
  completedMilestones: number;
  progressPercentage: number; // Changed from totalProgress
  upcomingMilestones: ContractMilestone[];
  overdueMilestones: ContractMilestone[];
  totalBudget: number;
  paidAmount: number; // Changed from totalPaid
  pendingAmount: number; // Added from docs
  // Legacy fields for backward compatibility
  milestones?: ContractMilestone[];
  totalProgress?: number;
  totalMilestones?: number;
  totalPaid?: number;
}

// TON Connect Types
export interface TonConnectWallet {
  appName: string;
  name: string;
  imageUrl: string;
  aboutUrl: string;
  universalLink: string;
  jsBridgeKey: string;
  bridgeUrl: string;
  platforms: string[];
}

export interface TonConnectAccount {
  address: string;
  chain: string;
  publicKey: string;
  walletStateInit: string;
}

export interface TonConnectAuthData {
  walletAddress: string;
  publicKey: string;
  walletStateInit: string;
  signature?: string;
}

export interface TonConnectLoginCredentials {
  walletAddress: string;
  publicKey: string;
  walletStateInit: string;
  signature?: string;
}

// Web3 Wallet Authentication Types
export interface Web3WalletCredentials {
  walletAddress: string;
  walletType: "ton" | "sui" | "ethereum" | "solana" | "ethereum";
  signature: string;
  message?: string;
}

export interface WalletCheckResult {
  exists: boolean;
  hasPassword: boolean;
  authProviders: string[];
  userId?: string;
}

export interface WalletCheckRequest {
  address: string;
  walletType: string;
}

export interface WalletCheckResponse {
  success: boolean;
  message: string;
  data: WalletCheckResult | null;
}

// User Profile and Reviews Types
export interface Review {
  _id: string;
  collaborationId: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  projectId: string;
  projectTitle: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfileStats {
  createdProjects: number;
  purchasedProjects: number;
  creatorCollaborations: number;
  publisherCollaborations: number;
}

export interface UserProfileProject {
  id: string;
  title: string;
  shortDescription: string;
  projectType: "idea_sale" | "product_sale" | "dev_collaboration";
  status: string;
  viewCount: number;
  likeCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface UserProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: "publisher" | "creator";
  isActive: boolean;
  authProviders: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileResponse {
  success: boolean;
  data: {
    user: UserProfileUser;
    stats: UserProfileStats;
    createdProjects: UserProfileProject[];
    purchasedProjects: UserProfileProject[];
    creatorCollaborations: any[];
    publisherCollaborations: any[];
  };
}
