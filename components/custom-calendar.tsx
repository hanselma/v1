"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns"
import { id } from "date-fns/locale"

interface CustomCalendarProps {
  selectedDate: Date | undefined
  onSelect: (date: Date) => void
}

export function CustomCalendar({ selectedDate, onSelect }: CustomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Generate years (from current year - 100 to current year + 10)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 111 }, (_, i) => currentYear - 100 + i)
  
  // Generate months
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), "MMMM", { locale: id })
  }))

  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: new Date(startDate.getTime() + 41 * 24 * 60 * 60 * 1000) // 6 weeks
  })

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(parseInt(year))
    setCurrentDate(newDate)
  }

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(parseInt(month))
    setCurrentDate(newDate)
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Select
            value={currentDate.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pilih bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDate.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Pilih tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          
          return (
            <button
              key={i}
              onClick={() => onSelect(day)}
              className={`
                h-9 w-9 rounded-full text-sm
                ${isCurrentMonth ? "text-gray-900" : "text-gray-400"}
                ${isSelected ? "bg-teal-500 text-white" : "hover:bg-gray-100"}
                flex items-center justify-center
              `}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
} 