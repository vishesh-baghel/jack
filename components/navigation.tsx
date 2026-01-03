/**
 * Navigation Component
 * Main app navigation with Lucide icons
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Lightbulb, FileText, Users, Settings, LogOut, Eye, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getUserSession, clearUserSession } from '@/lib/auth-client';

const navItems = [
  { href: '/', label: 'ideas', icon: Lightbulb },
  { href: '/posts', label: 'posts', icon: FileText },
  { href: '/creators', label: 'creators', icon: Users },
  { href: '/settings', label: 'settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkGuestStatus = () => {
      const session = getUserSession();
      setIsGuest(session.isGuest);
    };
    
    // Check on mount and whenever pathname changes (handles navigation)
    checkGuestStatus();
    
    // Listen for session changes (custom event from setUserSession)
    window.addEventListener('session-changed', checkGuestStatus);
    // Also listen for storage changes (in case of login/logout in another tab)
    window.addEventListener('storage', checkGuestStatus);
    
    return () => {
      window.removeEventListener('session-changed', checkGuestStatus);
      window.removeEventListener('storage', checkGuestStatus);
    };
  }, [pathname]);

  // Don't show navigation on auth page
  if (pathname === '/auth') {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearUserSession();
      router.push('/auth');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">jack</span>
            </Link>
            {/* Visitor Mode Indicator */}
            {isGuest && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-500 bg-amber-500/10 rounded-full border border-amber-500/20">
                <Eye className="h-3 w-3" />
                visitor mode
              </div>
            )}
          </div>

          {/* Nav Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="ml-2 text-muted-foreground hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 text-base font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium justify-start text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                  logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
