/**
 * Guest Tooltip Button Component
 * Button that shows tooltip when disabled for visitors
 */

'use client';

import Link from 'next/link';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GuestTooltipButtonProps extends ButtonProps {
  isGuest: boolean;
  guestTooltip?: string;
}

export function GuestTooltipButton({
  isGuest,
  guestTooltip,
  disabled,
  children,
  className,
  ...props
}: GuestTooltipButtonProps) {
  const isDisabled = disabled || isGuest;

  if (isGuest) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex', className?.includes('flex-1') && 'flex-1', className?.includes('w-full') && 'w-full')}>
              <Button {...props} className={cn(className, 'w-full')} disabled={isDisabled}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-center">
            <p className="text-sm font-medium">visitor mode</p>
            <p className="text-xs text-muted-foreground mt-1">
              {guestTooltip || "this is my personal agent. want your own?"}
            </p>
            <Link
              href="https://squad.visheshbaghel.com/deploy/jack"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-2 block"
            >
              deploy your own jack
            </Link>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...props} className={className} disabled={isDisabled}>
      {children}
    </Button>
  );
}
