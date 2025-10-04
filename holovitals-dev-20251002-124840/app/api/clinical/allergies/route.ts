import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clinical/allergies
 * Fetch allergies for the authenticated patient
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

    // Fetch allergies
    const allergies = await prisma.customerAllergy.findMany({
      where: {
        repository: {
          userId: patientId,
        },
      },
      include: {
        repository: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
      orderBy: {
        severity: 'desc',
      },
    });

    // Transform to API format
    const transformedAllergies = allergies.map((allergy) => ({
      id: allergy.id,
      patientId,
      allergen: allergy.allergen,
      type: allergy.type,
      category: allergy.type,
      reaction: [allergy.reaction],
      severity: allergy.severity,
      diagnosedDate: allergy.diagnosedDate,
      verificationStatus: 'CONFIRMED',
    }));

    return NextResponse.json({
      allergies: transformedAllergies,
      total: allergies.length,
    });
  } catch (error) {
    console.error('Error fetching allergies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allergies' },
      { status: 500 }
    );
  }
}