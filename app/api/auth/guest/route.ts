/**
 * Guest Login API Route
 * POST /api/auth/guest - Login as guest user (read-only access)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { GUEST_USER_EMAIL, DEMO_USER_EMAIL } from '@/lib/auth';

export async function POST() {
  try {
    // Find or create the guest user
    let guestUser = await prisma.user.findUnique({
      where: { email: GUEST_USER_EMAIL },
    });

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          email: GUEST_USER_EMAIL,
          name: 'Guest User',
          isGuest: true,
        },
      });
    }

    // Find the demo user whose content guests will see
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: 'Demo content not available. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        isGuest: true,
      },
      demoUserId: demoUser.id,
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json(
      { error: 'Failed to login as guest' },
      { status: 500 }
    );
  }
}
