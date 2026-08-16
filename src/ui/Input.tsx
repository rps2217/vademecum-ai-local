/**
 * Input - Campo de texto
 * 
 * Input con variantes y estados.
 */

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    wrapperClassName,
    id,
    ...props 
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              `flex w-full rounded-lg border bg-background px-4 py-2.5 text-[15px]
              transition-colors duration-150
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1
              disabled:cursor-not-allowed disabled:opacity-50
              h-12`,
              error
                ? 'border-destructive focus:ring-destructive'
                : 'border-input',
              leftIcon && 'pl-11',
              rightIcon && 'pr-11',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

