"use client"

import { TimeRange } from "@/lib/api/reporting"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateRangeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Time Range:</span>
      <Select value={value} onValueChange={(val) => onChange(val as TimeRange)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TimeRange.TODAY}>Today</SelectItem>
          <SelectItem value={TimeRange.WEEK}>Last 7 days</SelectItem>
          <SelectItem value={TimeRange.MONTH}>Last 30 days</SelectItem>
          <SelectItem value={TimeRange.YEAR}>Last year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

