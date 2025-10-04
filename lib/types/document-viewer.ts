/**
 * TypeScript interfaces for Clinical Document Viewer
 */

// ============================================================================
// Document Types
// ============================================================================

export interface Document {
  id: string;
  customerId: string;
  title: string;
  description?: string;
  type: DocumentType;
  category: string;
  date: Date;
  provider?: string;
  facility?: string;
  contentType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  status: DocumentStatus;
  tags?: string[];
  isFavorite?: boolean;
  metadata?: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  LAB_REPORT = 'LAB_REPORT',
  IMAGING = 'IMAGING',
  CLINICAL_NOTE = 'CLINICAL_NOTE',
  DISCHARGE_SUMMARY = 'DISCHARGE_SUMMARY',
  OPERATIVE_REPORT = 'OPERATIVE_REPORT',
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  PRESCRIPTION = 'PRESCRIPTION',
  REFERRAL = 'REFERRAL',
  CONSENT_FORM = 'CONSENT_FORM',
  INSURANCE = 'INSURANCE',
  BILLING = 'BILLING',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  AVAILABLE = 'AVAILABLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
  ARCHIVED = 'ARCHIVED',
}

export interface DocumentMetadata {
  pageCount?: number;
  width?: number;
  height?: number;
  format?: string;
  encrypted?: boolean;
  signed?: boolean;
  version?: string;
  relatedDocuments?: string[];
  [key: string]: any;
}

// ============================================================================
// Document Viewer Types
// ============================================================================

export interface ViewerState {
  currentPage: number;
  totalPages: number;
  zoom: number;
  rotation: number;
  viewMode: ViewMode;
  showThumbnails: boolean;
  showAnnotations: boolean;
}

export enum ViewMode {
  FIT_WIDTH = 'FIT_WIDTH',
  FIT_PAGE = 'FIT_PAGE',
  ACTUAL_SIZE = 'ACTUAL_SIZE',
  CUSTOM = 'CUSTOM',
}

export interface Annotation {
  id: string;
  documentId: string;
  userId: string;
  type: AnnotationType;
  page: number;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AnnotationType {
  HIGHLIGHT = 'HIGHLIGHT',
  NOTE = 'NOTE',
  UNDERLINE = 'UNDERLINE',
  STRIKETHROUGH = 'STRIKETHROUGH',
  DRAWING = 'DRAWING',
}

// ============================================================================
// Document Filter Types
// ============================================================================

export interface DocumentFilter {
  searchQuery?: string;
  types?: DocumentType[];
  categories?: string[];
  providers?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  isFavorite?: boolean;
  status?: DocumentStatus[];
}

export interface DocumentSort {
  field: DocumentSortField;
  direction: SortDirection;
}

export enum DocumentSortField {
  DATE = 'DATE',
  TITLE = 'TITLE',
  TYPE = 'TYPE',
  SIZE = 'SIZE',
  PROVIDER = 'PROVIDER',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

// ============================================================================
// Document Actions Types
// ============================================================================

export interface DocumentAction {
  id: string;
  label: string;
  icon: string;
  action: (document: Document) => void;
  disabled?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  action: (documents: Document[]) => void;
  confirmMessage?: string;
}

// ============================================================================
// Document Upload Types
// ============================================================================

export interface DocumentUpload {
  file: File;
  title: string;
  description?: string;
  type: DocumentType;
  category: string;
  date: Date;
  provider?: string;
  tags?: string[];
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}

// ============================================================================
// Document Share Types
// ============================================================================

export interface DocumentShare {
  documentId: string;
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  expiresAt?: Date;
  allowDownload?: boolean;
  requirePassword?: boolean;
}

export interface ShareLink {
  id: string;
  documentId: string;
  url: string;
  expiresAt?: Date;
  accessCount: number;
  createdAt: Date;
}

// ============================================================================
// Document Collection Types
// ============================================================================

export interface DocumentCollection {
  id: string;
  name: string;
  description?: string;
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Document Statistics Types
// ============================================================================

export interface DocumentStats {
  totalDocuments: number;
  documentsByType: Record<DocumentType, number>;
  totalSize: number;
  recentDocuments: number;
  favoriteDocuments: number;
}