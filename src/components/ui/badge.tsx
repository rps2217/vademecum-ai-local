import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'muted' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "bg-primary/10 text-primary font-medium",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    outline: "border border-gray-300 text-gray-600",
    muted: "bg-gray-100 text-gray-500"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
