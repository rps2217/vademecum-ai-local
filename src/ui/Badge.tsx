/**
 * Badge - Componente de insignia
 * 
 * Badge con variantes para diferentes contextos.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
    const variants = {
      default: 'bg-muted text-muted-foreground',
      primary: 'bg-primary/10 text-primary',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-success/10 text-success-foreground',
      warning: 'bg-warning/10 text-warning-foreground',
      danger: 'bg-danger/10 text-danger-foreground',
      outline: 'border border-border bg-transparent text-foreground',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
