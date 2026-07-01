import * as React from "react"
import { cn } from "../../lib/utils"

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'emerald' | 'sky' | 'violet' | 'amber' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "bg-stone-100 text-stone-700 border border-stone-200",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    danger: "bg-red-100 text-red-700 border border-red-200",
    outline: "border border-stone-300 text-stone-600 bg-transparent",
    emerald: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    sky: "bg-sky-100 text-sky-700 border border-sky-200",
    violet: "bg-violet-100 text-violet-700 border border-violet-200",
    amber: "bg-amber-100 text-amber-700 border border-amber-200"
  };

  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
Badge.displayName = "Badge"

export { Badge }
