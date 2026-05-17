import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "bg-muted text-foreground",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    danger: "bg-red-100 text-red-800 border border-red-200",
    outline: "border border-border text-muted-foreground bg-transparent"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
