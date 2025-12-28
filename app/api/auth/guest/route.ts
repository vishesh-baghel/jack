/**
 * Guest Login API Route
 * POST /api/auth/guest - Login as guest user (read-only access)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { GUEST_USER_EMAIL } from '@/lib/auth-client';

export async function POST() {
  try {
    // First, check if visitor mode is enabled
    const owner = await prisma.user.findFirst({
      where: { isOwner: true },
      select: { id: true, allowVisitorMode: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Service not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    if (!owner.allowVisitorMode) {
      return NextResponse.json(
        { error: 'Visitor mode is currently disabled by the owner.' },
        { status: 403 }
      );
    }

    // Find the guest user (should exist if visitor mode is enabled)
    const guestUser = await prisma.user.findUnique({
      where: { email: GUEST_USER_EMAIL },
    });

    if (!guestUser) {
      // This shouldn't happen if visitor mode is properly enabled
      // But we'll create it just in case
      const newGuest = await prisma.user.create({
        data: {
          email: GUEST_USER_EMAIL,
          name: 'Guest User',
          isGuest: true,
        },
      });

      return NextResponse.json({
        user: {
          id: newGuest.id,
          email: newGuest.email,
          name: newGuest.name,
          isGuest: true,
        },
        demoUserId: owner.id,
      });
    }

    return NextResponse.json({
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        isGuest: true,
      },
      demoUserId: owner.id,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Failed to login as guest' },
      { status: 500 }
    );
  }
}
