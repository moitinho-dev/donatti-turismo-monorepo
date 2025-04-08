"use client"
import { useState } from "react"
import { Download, Calendar, FileText } from "lucide-react"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

interface CSVExportProps {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
}

export function CSVExport({ dateRange }: CSVExportProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleExportAll = () => {
    window.location.href = "/api/promos/csv?type=all"
    setIsPopoverOpen(false)
  }

  const handleExportToday = () => {
    window.location.href = "/api/promos/csv?type=today"
    setIsPopoverOpen(false)
  }

  const handleExportCustomRange = () => {
    if (dateRange.from && dateRange.to) {
      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")
      window.location.href = `/api/promos/csv?type=custom&startDate=${startDate}&endDate=${endDate}`
    }
    setIsPopoverOpen(false)
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-primary-blue rounded-md hover:bg-gray-50 transition-colors font-mon"
        >
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-left font-normal" onClick={handleExportAll}>
            <FileText className="mr-2 h-4 w-4" />
            Todas as promoções
          </Button>
          <Button variant="ghost" className="w-full justify-start text-left font-normal" onClick={handleExportToday}>
            <Calendar className="mr-2 h-4 w-4" />
            Promoções de hoje
          </Button>
          {dateRange.from && dateRange.to && (
            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal"
              onClick={handleExportCustomRange}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Período selecionado
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
