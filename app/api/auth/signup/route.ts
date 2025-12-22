/**
 * Signup API Route
 * Creates owner account with bcrypt-hashed passphrase
 * Only available when ALLOW_SIGNUP=true OR no owner exists in DB
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { isSignupAllowed } from '@/lib/auth-server';

const BCRYPT_SALT_ROUNDS = 12;

const signupSchema = z.object({
  email: z.string().email('valid email is required'),
  name: z.string().min(1, 'name is required').optional(),
  passphrase: z.string().min(8, 'passphrase must be at least 8 characters'),
  confirmPassphrase: z.string(),
}).refine((data) => data.passphrase === data.confirmPassphrase, {
  message: 'passphrases do not match',
  path: ['confirmPassphrase'],
});

export async function POST(request: NextRequest) {
  try {
    const signupAllowed = await isSignupAllowed();
    
    if (!signupAllowed) {
      return NextResponse.json(
        { error: 'signup is disabled. an owner account already exists.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = signupSchema.parse(body);

    const existingOwner = await prisma.user.findFirst({
      where: { isOwner: true },
    });

    if (existingOwner) {
      return NextResponse.json(
        { error: 'an owner account already exists. only one owner is allowed.' },
        { status: 409 }
      );
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'this email is already registered' },
        { status: 409 }
      );
    }

    const hashedPassphrase = await bcrypt.hash(validatedData.passphrase, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || null,
        passphrase: hashedPassphrase,
        isOwner: true,
        isGuest: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    await prisma.toneConfig.create({
      data: {
        userId: user.id,
        lowercase: true,
        noEmojis: true,
        noHashtags: true,
        showFailures: true,
        includeNumbers: true,
        learnedPatterns: {},
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: 'account created successfully. you can now login with your passphrase.',
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'something went wrong during signup. try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if signup is available
 * Used by frontend to conditionally show signup form
 */
export async function GET() {
  try {
    const signupAllowed = await isSignupAllowed();
    
    return NextResponse.json({
      signupAllowed,
    });
  } catch (error) {
    console.error('Check signup status error:', error);
    return NextResponse.json(
      { error: 'failed to check signup status' },
      { status: 500 }
    );
  }
}
