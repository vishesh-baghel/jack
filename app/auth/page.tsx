/**
 * Auth Page
 * Single-user passphrase authentication with guest access
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { setUserSession } from '@/lib/auth-client';

export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const passphrase = formData.get('passphrase') as string;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'authentication failed');
        return;
      }

      // Store user session (not a guest)
      setUserSession(data.user.id, data.user.email, false);
      
      // Client-side navigation (Navigation component re-checks on pathname change)
      router.push('/');
    } catch (err) {
      setError('something broke. try again');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'guest login failed');
        return;
      }

      // Store guest session
      setUserSession(data.user.id, data.user.email, true, data.demoUserId);
      
      // Client-side navigation (Navigation component re-checks on pathname change)
      router.push('/');
    } catch (err) {
      setError('failed to sneak you in. try again');
      console.error('Guest login error:', err);
    } finally {
      setIsGuestLoading(false);
    }
  };

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
          {/* Owner Login */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passphrase" className="text-sm font-medium">
                passphrase
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="passphrase"
                  name="passphrase"
                  type="password"
                  placeholder="enter the secret sauce"
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                if you&apos;re the owner, you know what goes here
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'checking...' : 'let me in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Visitor Mode */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGuestLogin}
              disabled={isGuestLoading || isLoading}
            >
              <Eye className="h-4 w-4 mr-2" />
              {isGuestLoading ? 'opening the kitchen...' : 'see what I\'m cooking'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              peek behind the scenes of my content creation
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
