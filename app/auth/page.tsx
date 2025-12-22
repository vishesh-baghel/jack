/**
 * Auth Page
 * Single-user passphrase authentication with guest access
 * Supports signup when feature flag is enabled or no owner exists
 * Server component - no loading state needed
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSignupAllowed } from '@/lib/auth-server';
import { AuthForms } from './_components/auth-forms';

export default async function AuthPage() {
  const signupAllowed = await isSignupAllowed();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">jack</CardTitle>
          <CardDescription className="text-base">
            because writer&apos;s block is for normies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuthForms signupAllowed={signupAllowed} />
        </CardContent>
      </Card>
    </div>
  );
}
