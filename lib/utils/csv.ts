/**
 * CSV utility functions for import/export
 */

import Papa from 'papaparse'

/**
 * Export data to CSV and download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create CSV string
  const csv = Papa.unparse(data, {
    columns: csvHeaders,
    header: true,
  })

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Parse CSV file
 */
export function parseCSV<T = any>(
  file: File,
  onComplete: (results: Papa.ParseResult<T>) => void,
  onError?: (error: Error) => void
): void {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
    transform: (value) => value.trim(),
    complete: (results) => {
      if (results.errors.length > 0 && onError) {
        const error = new Error(
          `CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`
        )
        onError(error)
      } else {
        onComplete(results as Papa.ParseResult<T>)
      }
    },
    error: (error) => {
      if (onError) {
        onError(new Error(`CSV parsing failed: ${error.message}`))
      }
    },
  })
}

/**
 * Validate CSV data structure
 */
export function validateCSVData<T>(
  data: T[],
  requiredFields: string[],
  validator?: (row: T, index: number) => { valid: boolean; errors: string[] }
): { valid: boolean; errors: Array<{ row: number; errors: string[] }> } {
  const errors: Array<{ row: number; errors: string[] }> = []

  data.forEach((row, index) => {
    const rowErrors: string[] = []

    // Check required fields
    requiredFields.forEach((field) => {
      if (!(row as any)[field] || String((row as any)[field]).trim() === '') {
        rowErrors.push(`Missing required field: ${field}`)
      }
    })

    // Run custom validator if provided
    if (validator) {
      const validation = validator(row, index)
      if (!validation.valid) {
        rowErrors.push(...validation.errors)
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: index + 2, errors: rowErrors }) // +2 because row 1 is header, index is 0-based
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Generate CSV template
 */
export function generateCSVTemplate(headers: string[], filename: string): void {
  const template = headers.join(',')
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

