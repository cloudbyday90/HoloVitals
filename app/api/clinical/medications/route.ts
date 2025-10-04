import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { MedicationStatus } from '@/lib/types/clinical-data';

/**
 * GET /api/clinical/medications
 * Fetch medications for the authenticated customer
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
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      repository: {
        userId: customerId,
      },
    };

    if (status) {
      where.status = status;
    }

    // Fetch medications
    const medications = await prisma.customerMedication.findMany({
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
        { startDate: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count
    const total = await prisma.customerMedication.count({ where });

    // Transform to API format
    const transformedMedications = medications.map((med) => ({
      id: med.id,
      customerId,
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      route: 'oral', // Default, should be added to schema
      startDate: med.startDate,
      endDate: med.endDate,
      prescribedBy: med.prescribedBy || 'Unknown',
      prescribedDate: med.startDate,
      purpose: med.purpose,
      status: med.status as MedicationStatus,
    }));

    return NextResponse.json({
      medications: transformedMedications,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medications' },
      { status: 500 }
    );
  }
}