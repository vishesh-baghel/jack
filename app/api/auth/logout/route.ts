/**
 * Logout API Route
 * POST /api/auth/logout - Clear user session
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear all auth cookies
  response.cookies.set('userId', '', { path: '/', maxAge: 0 });
  response.cookies.set('userEmail', '', { path: '/', maxAge: 0 });
  response.cookies.set('isGuest', '', { path: '/', maxAge: 0 });
  response.cookies.set('demoUserId', '', { path: '/', maxAge: 0 });
  
  return response;
}
