// User and Authentication Types
export enum UserRole {
  VISITOR = 'visitor',
  MEMBER = 'member',
  VERIFIED_MEMBER = 'verified_member',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Identifier Types
export enum IdentifierType {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  WEBSITE = 'website'
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked'
}

export interface Identifier {
  id: string;
  type: IdentifierType;
  valueRaw: string;
  valueNormalized: string;
  countryCode?: string;
  metadata: Record<string, any>;
  verificationStatus: VerificationStatus;
  createdAt: Date;
}

// Report Types
export enum ScamCategory {
  PHISHING = 'phishing',
  ROMANCE = 'romance',
  INVESTMENT = 'investment',
  TECH_SUPPORT = 'tech_support',
  LOTTERY = 'lottery',
  JOB_SCAM = 'job_scam',
  RENTAL = 'rental',
  CRYPTO = 'crypto',
  FAKE_GOODS = 'fake_goods',
  EMPLOYMENT = 'employment',
  OTHER = 'other'
}

export enum IncidentChannel {
  CALL = 'call',
  SMS = 'sms',
  EMAIL = 'email',
  SOCIAL_DM = 'social_dm',
  SOCIAL_MEDIA = 'social_media',
  WEBSITE = 'website',
  APP = 'app',
  OTHER = 'other'
}

export enum ReportStatus {
  PENDING_MODERATION = 'pending_moderation',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MORE_INFO_NEEDED = 'more_info_needed',
  ESCALATED = 'escalated'
}

export interface Report {
  id: string;
  entityId?: string;
  reporterUserId: string;
  identifierType: IdentifierType;
  identifierValue: string;
  category: ScamCategory;
  amountLost?: number;
  currency?: string;
  incidentDate: Date;
  channel: IncidentChannel;
  narrative: string;
  suspectedLinks: string[];
  riskScore: number;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  additional_info?: Record<string, any>;
}

// Evidence Types
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  TEXT = 'text'
}

export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface Evidence {
  id: string;
  reportId: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  fileHash: string;
  perceptualHash?: string;
  ocrText?: string;
  processingStatus: ProcessingStatus;
  flags: Record<string, any>;
  createdAt: Date;
  uploadedAt?: Date;
}

// Entity Types
export enum EntityStatus {
  ALLEGED = 'alleged',
  CONFIRMED = 'confirmed',
  DISPUTED = 'disputed',
  REMOVED = 'removed'
}

export interface Entity {
  id: string;
  primaryIdentifierId: string;
  displayName?: string;
  riskScore: number;
  confidenceScore: number;
  status: EntityStatus;
  reportCount: number;
  totalAmountLost: number;
  firstReported?: Date;
  lastReported?: Date;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Moderation Types
export enum ModerationDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MORE_INFO = 'more_info',
  ESCALATED = 'escalated'
}

export interface ModerationQueue {
  id: string;
  reportId: string;
  assignedModeratorId?: string;
  priority: number;
  status: string;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  slaDeadline?: Date;
}

export interface ModerationDecisionRecord {
  id: string;
  reportId: string;
  moderatorId: string;
  decision: ModerationDecision;
  reasonCode: string;
  notes?: string;
  evidenceReviewed: Record<string, any>;
  createdAt: Date;
}

// Comment Types
export interface Comment {
  id: string;
  parentId?: string;
  entityId?: string;
  reportId?: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  flagsCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// Search and Analytics Types
export interface SearchQuery {
  query: string;
  type?: IdentifierType;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  entities: Entity[];
  reports: Report[];
  total: number;
  page: number;
  limit: number;
}

// Notification Types
export enum NotificationType {
  NEW_REPORT = 'new_report',
  STATUS_UPDATE = 'status_update',
  COMMENT_REPLY = 'comment_reply',
  MODERATION_DECISION = 'moderation_decision',
  SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

export enum DeliveryChannel {
  EMAIL = 'email',
  IN_APP = 'in_app',
  SMS = 'sms',
  PUSH = 'push'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  channels: DeliveryChannel[];
  status: string;
  createdAt: Date;
  sentAt?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}
