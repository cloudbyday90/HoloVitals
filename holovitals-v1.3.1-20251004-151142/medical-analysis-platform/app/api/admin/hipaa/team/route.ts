/**
 * HIPAA Compliance Team API
 * GET /api/admin/hipaa/team - Get compliance team members
 * PUT /api/admin/hipaa/team - Update team configuration
 * POST /api/admin/hipaa/team - Add team member (legacy)
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

    // Get team members
    const teamMembers = await prisma.hipaaComplianceTeam.findMany({
      orderBy: { role: 'asc' },
    });

    return NextResponse.json({
      team: teamMembers.map(member => ({
        role: member.role,
        email: member.email,
        name: member.name || '',
        phone: member.phone || '',
        notificationEnabled: member.notificationEnabled ?? true,
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

export async function PUT(request: NextRequest) {
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

    const { team } = await request.json();

    if (!team || !Array.isArray(team)) {
      return NextResponse.json(
        { error: 'Invalid team data' },
        { status: 400 }
      );
    }

    // Validate that all required fields are present
    for (const member of team) {
      if (!member.email || !member.role) {
        return NextResponse.json(
          { error: 'Email and role are required for all team members' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        return NextResponse.json(
          { error: `Invalid email format: ${member.email}` },
          { status: 400 }
        );
      }
    }

    // Update each team member
    const updatePromises = team.map((member) =>
      prisma.hipaaComplianceTeam.upsert({
        where: { role: member.role },
        update: {
          email: member.email,
          name: member.name || '',
          phone: member.phone || '',
          notificationEnabled: member.notificationEnabled ?? true,
          updatedAt: new Date(),
        },
        create: {
          role: member.role,
          email: member.email,
          name: member.name || '',
          phone: member.phone || '',
          notificationEnabled: member.notificationEnabled ?? true,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'HIPAA team configuration updated successfully',
    });
  } catch (error) {
    console.error('Failed to update HIPAA team:', error);
    return NextResponse.json(
      { error: 'Failed to update team configuration' },
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