import type React from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  icon?: React.ReactNode
  footer?: React.ReactNode
  isLoading?: boolean
}

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  isLoading,
  children,
  className,
  ...props
}: DashboardCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden", className)} {...props}>
      {(title || description || icon) && (
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
      )}
      <div className={cn("p-6 pt-0", !title && !description && !icon && "pt-6")}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-donatti-blue"></div>
          </div>
        ) : (
          children
        )}
      </div>
      {footer && <div className="border-t border-gray-100 p-4 bg-gray-50">{footer}</div>}
    </div>
  )
}
