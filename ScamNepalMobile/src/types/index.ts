// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'member' | 'moderator' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

// Report Types
export interface Report {
  id: string;
  identifierType: 'phone' | 'email' | 'website' | 'social_media' | 'other';
  identifierValue: string;
  category: 'phishing' | 'investment' | 'romance' | 'tech_support' | 'other';
  narrative: string;
  amountLost: number;
  currency: string;
  status: 'pending' | 'verified' | 'rejected' | 'under_review';
  riskScore: number;
  reporterUserId: string;
  reporterEmail: string;
  incidentDate?: string;
  incidentChannel?: string;
  contactMethod?: string;
  suspectedLinks?: string;
  additionalInfo?: string;
  createdAt: string;
  updatedAt: string;
  evidence?: Evidence[];
}

export interface Evidence {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  uploadedAt: string;
}

// Entity Types
export interface Entity {
  id: string;
  displayName: string;
  riskScore: number;
  status: 'alleged' | 'confirmed' | 'disputed' | 'cleared';
  reportCount: number;
  totalAmountLost: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Search Types
export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  riskScoreMin?: number;
  riskScoreMax?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult {
  id: string;
  type: 'report' | 'entity';
  title: string;
  description: string;
  relevance: number;
  metadata: Record<string, any>;
  url: string;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ReportDetails: { reportId: string };
  EntityDetails: { entityId: string };
  CreateReport: undefined;
  MyReports: undefined;
  FileUpload: { reportId: string };
  EditProfile: undefined;
  Notifications: undefined;
  Help: undefined;
  UserManagement: undefined;
  AddUser: undefined;
  ModerationQueue: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Reports: undefined;
  Profile: undefined;
  Admin?: undefined;
};

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    success: string;
    warning: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// File Upload Types
export interface FileUpload {
  uri: string;
  type: string;
  name: string;
  size: number;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}
