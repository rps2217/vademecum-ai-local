/**
 * Button - Componente de botón
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'md',
    isLoading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    ...props
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-150 ease-in-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      btn-press
    `;

    const variants = {
      default: `
        bg-primary text-primary-foreground
        hover:bg-primary-hover
        active:bg-primary-hover
        shadow-sm
      `,
      secondary: `
        bg-secondary text-secondary-foreground
        hover:bg-secondary-hover
        active:bg-secondary-hover
      `,
      outline: `
        border border-border bg-transparent
        hover:bg-accent hover:text-accent-foreground
        active:bg-accent
      `,
      ghost: `
        bg-transparent
        hover:bg-accent hover:text-accent-foreground
        active:bg-accent
      `,
      destructive: `
        bg-destructive text-destructive-foreground
        hover:bg-destructive-hover
        active:bg-destructive-hover
        shadow-sm
      `,
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 py-3 text-base',
      icon: 'h-10 w-10',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
