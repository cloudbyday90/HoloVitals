// Core Types for Medical Analysis Platform

export type DocumentType = 'bloodwork' | 'imaging' | 'aftercare' | 'prescription' | 'discharge' | 'other';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  userId: string;
  patientId?: string;
  filePath: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  documentType?: DocumentType;
  uploadDate: Date;
  documentDate?: Date;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResult {
  testName: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  isAbnormal: boolean;
}

export interface ExtractedData {
  id: string;
  documentId: string;
  dataType: string;
  fieldName: string;
  fieldValue: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  extractedAt: Date;
}

export interface OcrResult {
  id: string;
  documentId: string;
  rawText: string;
  confidenceScore?: number;
  processedAt: Date;
}

export interface AnalysisContext {
  currentDocument: Document;
  currentData: ExtractedData[];
  relatedDocuments: Document[];
  historicalTrends: any[];
  similarDocuments: Document[];
  metadata: {
    totalDocuments: number;
    dateRange: { earliest: Date; latest: Date };
    documentTypes: string[];
  };
}

export interface AIResponse {
  answer: string;
  sources: string[];
  confidence: number;
  relatedDocuments: string[];
}

export interface ProcessingResult {
  success: boolean;
  documentType?: DocumentType;
  dataPoints?: number;
  error?: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  buffer: Buffer;
}