import { Document, ExtractedData, AnalysisContext } from '@/lib/types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ContextBuilder {
  /**
   * Build comprehensive analysis context for a document
   */
  async buildAnalysisContext(
    currentDocumentId: string,
    userId: string
  ): Promise<AnalysisContext> {
    // 1. Get current document and its data
    const currentDoc = await prisma.document.findUnique({
      where: { id: currentDocumentId },
      include: {
        extractedData: true,
        ocrResults: true
      }
    });

    if (!currentDoc) {
      throw new Error('Document not found');
    }

    // 2. Find related documents
    const relatedDocs = await this.findRelatedDocuments(
      currentDocumentId,
      currentDoc.documentType || 'other',
      currentDoc.documentDate || new Date()
    );

    // 3. Get historical data for trend analysis
    const historicalData = await this.getHistoricalData(
      userId,
      currentDoc.documentType || 'other',
      currentDoc.documentDate || new Date()
    );

    // 4. Get metadata
    const metadata = await this.getMetadata(userId);

    return {
      currentDocument: currentDoc as any,
      currentData: currentDoc.extractedData as any,
      relatedDocuments: relatedDocs as any,
      historicalTrends: historicalData,
      similarDocuments: [], // TODO: Implement semantic similarity
      metadata
    };
  }

  /**
   * Find documents related to the current document
   */
  async findRelatedDocuments(
    documentId: string,
    documentType: string,
    documentDate: Date
  ): Promise<Document[]> {
    // Find explicitly linked documents
    const linked = await prisma.document.findMany({
      where: {
        OR: [
          {
            sourceLinks: {
              some: {
                targetDocumentId: documentId
              }
            }
          },
          {
            targetLinks: {
              some: {
                sourceDocumentId: documentId
              }
            }
          }
        ]
      }
    });

    // Find temporally related documents (same type within 30 days)
    const thirtyDaysAgo = new Date(documentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const thirtyDaysAfter = new Date(documentDate);
    thirtyDaysAfter.setDate(thirtyDaysAfter.getDate() + 30);

    const temporal = await prisma.document.findMany({
      where: {
        id: { not: documentId },
        documentType,
        documentDate: {
          gte: thirtyDaysAgo,
          lte: thirtyDaysAfter
        }
      },
      take: 5
    });

    // Combine and deduplicate
    const allDocs = [...linked, ...temporal];
    const uniqueDocs = Array.from(
      new Map(allDocs.map(doc => [doc.id, doc])).values()
    );

    return uniqueDocs as any;
  }

  /**
   * Get historical data for trend analysis
   */
  async getHistoricalData(
    userId: string,
    documentType: string,
    beforeDate: Date
  ): Promise<any[]> {
    const historicalDocs = await prisma.document.findMany({
      where: {
        userId,
        documentType,
        documentDate: {
          lt: beforeDate
        },
        status: 'completed'
      },
      include: {
        extractedData: true
      },
      orderBy: {
        documentDate: 'desc'
      },
      take: 10
    });

    return historicalDocs;
  }

  /**
   * Get user's document metadata
   */
  async getMetadata(userId: string) {
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        documentDate: true,
        documentType: true
      }
    });

    const dates = documents
      .map(d => d.documentDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    const types = Array.from(
      new Set(documents.map(d => d.documentType).filter(Boolean))
    );

    return {
      totalDocuments: documents.length,
      dateRange: {
        earliest: dates[0] || new Date(),
        latest: dates[dates.length - 1] || new Date()
      },
      documentTypes: types as string[]
    };
  }

  /**
   * Link two documents together
   */
  async linkDocuments(
    sourceId: string,
    targetId: string,
    relationshipType: string
  ): Promise<void> {
    await prisma.documentLink.create({
      data: {
        sourceDocumentId: sourceId,
        targetDocumentId: targetId,
        relationshipType
      }
    });
  }

  /**
   * Find documents by semantic similarity (placeholder for vector search)
   */
  async findSimilarDocuments(
    documentId: string,
    limit: number = 5
  ): Promise<Document[]> {
    // TODO: Implement vector similarity search
    // This would use document embeddings to find semantically similar documents
    return [];
  }
}

export const contextBuilder = new ContextBuilder();