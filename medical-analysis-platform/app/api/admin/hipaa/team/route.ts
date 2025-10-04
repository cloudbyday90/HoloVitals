/**
 * HIPAA Compliance Team API
 * GET /api/admin/hipaa/team - Get compliance team members
 * POST /api/admin/hipaa/team - Add team member
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has HIPAA compliance access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - HIPAA Compliance access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    // Get team members
    const teamMembers = await prisma.hipaaComplianceTeam.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      teamMembers: teamMembers.map(member => ({
        ...member,
        notificationPreferences: member.notificationPreferences 
          ? JSON.parse(member.notificationPreferences as string)
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching HIPAA compliance team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HIPAA compliance team' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has HIPAA compliance access
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - HIPAA Compliance access required' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();

    // Create team member
    const teamMember = await prisma.hipaaComplianceTeam.create({
      data: {
        userId: body.userId,
        role: body.role,
        email: body.email,
        phone: body.phone,
        notificationPreferences: body.notificationPreferences 
          ? JSON.stringify(body.notificationPreferences)
          : null,
        active: body.active !== undefined ? body.active : true,
      },
    });

    return NextResponse.json({
      ...teamMember,
      notificationPreferences: teamMember.notificationPreferences
        ? JSON.parse(teamMember.notificationPreferences as string)
        : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding HIPAA compliance team member:', error);
    return NextResponse.json(
      { error: 'Failed to add HIPAA compliance team member' },
      { status: 500 }
    );
  }
}