"use client"
import { useState } from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "../../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover"
import { Button } from "../../components/ui/button"

interface DateRangePickerProps {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  onClearFilters: () => void
}

export function DateRangePicker({ dateRange, onDateRangeChange, onClearFilters }: DateRangePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (!date) return

    const range = { ...dateRange }

    if (!range.from) {
      range.from = date
    } else if (!range.to && date >= range.from) {
      range.to = date
    } else {
      range.from = date
      range.to = undefined
    }

    onDateRangeChange(range)

    // Close popover if both dates are selected
    if (range.from && range.to) {
      setIsPopoverOpen(false)
    }
  }

  const handleClearFilters = () => {
    onClearFilters()
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full sm:w-auto justify-start text-left font-normal ${
              dateRange.from && dateRange.to ? "bg-primary-blue/10" : ""
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from && dateRange.to ? (
              <>
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </>
            ) : (
              "Filtrar por período"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              onDateRangeChange({
                from: range?.from,
                to: range?.to,
              })
            }}
            locale={ptBR}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {dateRange.from && dateRange.to && (
        <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4 mr-1" />
          Limpar filtro
        </Button>
      )}
    </div>
  )
}
