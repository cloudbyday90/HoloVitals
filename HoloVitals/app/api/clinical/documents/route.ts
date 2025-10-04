import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { DocumentType, DocumentStatus } from '@/lib/types/clinical-data';

/**
 * GET /api/clinical/documents
 * Fetch clinical documents for the authenticated customer
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const customerId = searchParams.get('customerId') || session.user.id;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get EHR connection for this customer
    const connection = await prisma.eHRConnection.findFirst({
      where: {
        userId: customerId,
        status: 'ACTIVE',
      },
    });

    if (!connection) {
      return NextResponse.json({ documents: [], total: 0 });
    }

    // Build where clause
    const where: any = {
      connectionId: connection.id,
      resourceType: 'DOCUMENT_REFERENCE',
    };

    if (category) {
      where.category = category;
    }

    // Fetch FHIR documents
    const documents = await prisma.fHIRResource.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.fHIRResource.count({ where });

    // Transform to API format
    const transformedDocuments = documents.map((doc) => ({
      id: doc.id,
      customerId,
      title: doc.title || 'Untitled Document',
      type: mapDocumentType(doc.category),
      category: doc.category || 'other',
      date: doc.date || doc.createdAt,
      description: doc.description,
      contentType: doc.contentType || 'application/pdf',
      fileSize: doc.contentSize || 0,
      url: doc.contentUrl || '',
      status: doc.documentDownloaded ? DocumentStatus.AVAILABLE : DocumentStatus.PROCESSING,
    }));

    return NextResponse.json({
      documents: transformedDocuments,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

function mapDocumentType(category?: string | null): DocumentType {
  if (!category) return DocumentType.OTHER;
  
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('lab')) return DocumentType.LAB_REPORT;
  if (categoryLower.includes('imaging') || categoryLower.includes('radiology')) return DocumentType.IMAGING;
  if (categoryLower.includes('discharge')) return DocumentType.DISCHARGE_SUMMARY;
  if (categoryLower.includes('operative')) return DocumentType.OPERATIVE_REPORT;
  if (categoryLower.includes('pathology')) return DocumentType.PATHOLOGY;
  if (categoryLower.includes('prescription')) return DocumentType.PRESCRIPTION;
  if (categoryLower.includes('referral')) return DocumentType.REFERRAL;
  if (categoryLower.includes('note')) return DocumentType.CLINICAL_NOTE;
  
  return DocumentType.OTHER;
}