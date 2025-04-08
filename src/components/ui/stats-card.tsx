import type React from "react"
import { cn } from "@/lib/utils"

interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
}

export function StatsCard({ title, value, icon, trend, isLoading, className, ...props }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm p-6", className)} {...props}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
          ) : (
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          )}

          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn("text-xs font-medium", trend.isPositive ? "text-green-600" : "text-red-600")}>
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs. último mês</span>
            </div>
          )}
        </div>
        {icon && <div className="p-3 rounded-full bg-gray-50 text-donatti-blue">{icon}</div>}
      </div>
    </div>
  )
}
