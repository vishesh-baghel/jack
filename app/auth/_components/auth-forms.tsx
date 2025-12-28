/**
 * Auth Forms Client Component
 * Handles form interactions and submissions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setUserSession } from '@/lib/auth-client';

type AuthMode = 'login' | 'signup';

interface AuthFormsProps {
  signupAllowed: boolean;
}

export function AuthForms({ signupAllowed }: AuthFormsProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(signupAllowed ? 'signup' : 'login');
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

      setUserSession(data.user.id, data.user.email, false);
      router.push('/');
    } catch (err) {
      setError('something broke. try again');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const passphrase = formData.get('passphrase') as string;
    const confirmPassphrase = formData.get('confirmPassphrase') as string;

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, passphrase, confirmPassphrase }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'signup failed');
        return;
      }

      setUserSession(data.user.id, data.user.email, false);
      router.push('/');
    } catch (err) {
      setError('something broke during signup. try again');
      console.error('Signup error:', err);
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
        // Show specific error for visitor mode disabled
        if (response.status === 403) {
          setError('visitor mode is currently disabled by the owner');
        } else {
          setError(data.error || 'guest login failed');
        }
        return;
      }

      setUserSession(data.user.id, data.user.email, true, data.demoUserId);
      router.push('/');
    } catch (err) {
      setError('failed to sneak you in. try again');
      console.error('Guest login error:', err);
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleToggleMode = () => {
    setError('');
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <>
      {mode === 'signup' ? (
        <>
          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                name <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="your name"
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="name"
                />
              </div>
            </div>

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
                  placeholder="min 8 characters"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassphrase" className="text-sm font-medium">
                confirm passphrase
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassphrase"
                  name="confirmPassphrase"
                  type="password"
                  placeholder="type it again"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className="pl-10"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'creating account...' : 'create my account'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              this will be your owner account. signup is disabled after creation.
            </p>
          </form>

          {/* Toggle to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-sm text-muted-foreground hover:text-foreground underline"
              disabled={isLoading}
            >
              already have an account? login
            </button>
          </div>
        </>
      ) : (
        <>
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

          {/* Toggle to Signup (only if allowed) */}
          {signupAllowed && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-sm text-muted-foreground hover:text-foreground underline"
                disabled={isLoading}
              >
                need to create an account? signup
              </button>
            </div>
          )}
        </>
      )}

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
    </>
  );
}
