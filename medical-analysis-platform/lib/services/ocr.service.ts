import pdf from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { DocumentType, ProcessingResult, TestResult } from '@/lib/types';

export class OCRService {
  /**
   * Extract text from PDF buffer
   */
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from image using Tesseract OCR
   */
  async extractTextFromImage(buffer: Buffer): Promise<{ text: string; confidence: number }> {
    const worker = await createWorker('eng');
    
    try {
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      
      return {
        text: data.text,
        confidence: data.confidence
      };
    } catch (error) {
      await worker.terminate();
      console.error('Image OCR error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Classify document type based on content
   */
  async classifyDocument(text: string): Promise<DocumentType> {
    const lowerText = text.toLowerCase();
    
    // Bloodwork indicators
    if (
      lowerText.includes('hemoglobin') ||
      lowerText.includes('wbc') ||
      lowerText.includes('platelet') ||
      lowerText.includes('glucose') ||
      lowerText.includes('cholesterol') ||
      lowerText.includes('lab results') ||
      lowerText.includes('blood test')
    ) {
      return 'bloodwork';
    }
    
    // Imaging indicators
    if (
      lowerText.includes('x-ray') ||
      lowerText.includes('mri') ||
      lowerText.includes('ct scan') ||
      lowerText.includes('ultrasound') ||
      lowerText.includes('radiology') ||
      lowerText.includes('imaging')
    ) {
      return 'imaging';
    }
    
    // Aftercare indicators
    if (
      lowerText.includes('aftercare') ||
      lowerText.includes('post-operative') ||
      lowerText.includes('follow-up') ||
      lowerText.includes('recovery instructions')
    ) {
      return 'aftercare';
    }
    
    // Prescription indicators
    if (
      lowerText.includes('prescription') ||
      lowerText.includes('medication') ||
      lowerText.includes('rx') ||
      lowerText.includes('dosage')
    ) {
      return 'prescription';
    }
    
    // Discharge indicators
    if (
      lowerText.includes('discharge') ||
      lowerText.includes('discharge summary')
    ) {
      return 'discharge';
    }
    
    return 'other';
  }

  /**
   * Parse bloodwork results from text
   */
  parseBloodwork(text: string): TestResult[] {
    const results: TestResult[] = [];
    const lines = text.split('\n');
    
    // Common patterns for lab results
    // Pattern 1: "Test Name: Value Unit (Min-Max)"
    // Pattern 2: "Test Name Value Unit Min-Max"
    
    for (const line of lines) {
      // Try pattern with colon
      let match = line.match(
        /([A-Za-z0-9\s\-\/]+):\s*([\d.]+)\s*([A-Za-z\/%]+)?\s*\(?([\d.-]+)?\s*-?\s*([\d.]+)?\)?/
      );
      
      if (!match) {
        // Try pattern without colon
        match = line.match(
          /([A-Za-z0-9\s\-\/]+)\s+([\d.]+)\s+([A-Za-z\/%]+)\s+([\d.-]+)\s*-\s*([\d.]+)/
        );
      }
      
      if (match) {
        const testName = match[1].trim();
        const value = parseFloat(match[2]);
        const unit = match[3] || '';
        const referenceMin = match[4] ? parseFloat(match[4]) : undefined;
        const referenceMax = match[5] ? parseFloat(match[5]) : undefined;
        
        const isAbnormal = this.checkAbnormal(value, referenceMin, referenceMax);
        
        results.push({
          testName,
          value,
          unit,
          referenceMin,
          referenceMax,
          isAbnormal
        });
      }
    }
    
    return results;
  }

  /**
   * Check if a value is abnormal based on reference range
   */
  private checkAbnormal(
    value: number,
    min?: number,
    max?: number
  ): boolean {
    if (min !== undefined && value < min) return true;
    if (max !== undefined && value > max) return true;
    return false;
  }

  /**
   * Extract dates from text
   */
  extractDates(text: string): Date[] {
    const dates: Date[] = [];
    
    // Common date patterns
    const patterns = [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,  // MM/DD/YYYY
      /\d{4}-\d{2}-\d{2}/g,         // YYYY-MM-DD
      /\d{1,2}-\d{1,2}-\d{4}/g,     // MM-DD-YYYY
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        }
      }
    }
    
    return dates;
  }

  /**
   * Extract key-value pairs from text
   */
  extractKeyValuePairs(text: string): Record<string, string> {
    const pairs: Record<string, string> = {};
    const lines = text.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        pairs[key] = value;
      }
    }
    
    return pairs;
  }

  /**
   * Process document and extract structured data
   */
  async processDocument(
    buffer: Buffer,
    mimeType: string
  ): Promise<ProcessingResult> {
    try {
      let text: string;
      let confidence: number | undefined;
      
      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        text = await this.extractTextFromPDF(buffer);
      } else if (mimeType.startsWith('image/')) {
        const result = await this.extractTextFromImage(buffer);
        text = result.text;
        confidence = result.confidence;
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Classify document type
      const documentType = await this.classifyDocument(text);
      
      // Extract structured data based on type
      let dataPoints = 0;
      if (documentType === 'bloodwork') {
        const results = this.parseBloodwork(text);
        dataPoints = results.length;
      }
      
      return {
        success: true,
        documentType,
        dataPoints
      };
    } catch (error) {
      console.error('Document processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Lazy initialization to prevent build-time errors
let ocrServiceInstance: OCRService | null = null;

export function getOCRService(): OCRService {
  if (!ocrServiceInstance) {
    ocrServiceInstance = new OCRService();
  }
  return ocrServiceInstance;
}

// For backward compatibility
export const ocrService = new OCRService();