/**
 * Login API Route
 * Single-user passphrase authentication
 * Rate limited to prevent brute force attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';
import { 
  checkRateLimit, 
  getClientIp, 
  getRandomRateLimitMessage 
} from '@/lib/rate-limit';

const loginSchema = z.object({
  passphrase: z.string().min(1, 'passphrase is required'),
});

// Spicy auth error messages
const AUTH_ERROR_MESSAGES = [
  "nice try, but you're not vishesh",
  "wrong passphrase. skill issue detected",
  "that's not the magic word",
  "access denied. the grind requires the right key",
  "nope. try again (or don't, you're probably not supposed to be here)",
  "authentication failed. are you sure you're the owner?",
  "wrong passphrase. the algorithm is judging you",
];

const getRandomAuthError = (): string => {
  return AUTH_ERROR_MESSAGES[Math.floor(Math.random() * AUTH_ERROR_MESSAGES.length)];
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`auth:${clientIp}`, {
      windowMs: 60 * 1000, // 1 minute
      maxAttempts: 5, // 5 attempts per minute
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: getRandomRateLimitMessage(rateLimitResult.resetIn) },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.resetIn),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }

    const body = await request.json();
    const { passphrase } = loginSchema.parse(body);

    // Find owner user with matching passphrase
    const user = await prisma.user.findFirst({
      where: { 
        isOwner: true,
        passphrase: passphrase,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: getRandomAuthError() },
        { 
          status: 401,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'passphrase is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'something broke. probably not your fault (probably)' },
      { status: 500 }
    );
  }
}
