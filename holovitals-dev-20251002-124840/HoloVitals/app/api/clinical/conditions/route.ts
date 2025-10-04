import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clinical/conditions
 * Fetch conditions/diagnoses for the authenticated patient
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
    const patientId = searchParams.get('patientId') || session.user.id;
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      repository: {
        userId: patientId,
      },
    };

    if (status) {
      where.status = status;
    }

    // Fetch conditions
    const conditions = await prisma.customerDiagnosis.findMany({
      where,
      include: {
        repository: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { diagnosedDate: 'desc' },
      ],
    });

    // Transform to API format
    const transformedConditions = conditions.map((condition) => ({
      id: condition.id,
      patientId,
      condition: condition.condition,
      icd10Code: condition.icd10Code,
      category: 'diagnosis',
      severity: condition.severity,
      clinicalStatus: condition.status,
      verificationStatus: 'CONFIRMED',
      onsetDate: condition.diagnosedDate,
      notes: condition.notes,
    }));

    return NextResponse.json({
      conditions: transformedConditions,
      total: conditions.length,
    });
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conditions' },
      { status: 500 }
    );
  }
}