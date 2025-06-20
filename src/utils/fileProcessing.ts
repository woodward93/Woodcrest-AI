import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ProcessedData {
  data: any[]
  fileName: string
  columns: string[]
  rowCount: number
}

export function processFile(file: File): Promise<ProcessedData> {
  return new Promise((resolve, reject) => {
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      // Process CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
            return
          }

          const data = results.data as any[]
          const columns = Object.keys(data[0] || {})
          
          resolve({
            data,
            fileName,
            columns,
            rowCount: data.length
          })
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`))
        }
      })
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      // Process Excel file
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          
          // Convert to JSON
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          if (data.length < 2) {
            reject(new Error('Excel file must have at least 2 rows (header + data)'))
            return
          }
          
          // First row as headers
          const headers = data[0] as string[]
          const rows = data.slice(1) as any[][]
          
          // Convert to object format
          const processedData = rows.map(row => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index]
            })
            return obj
          }).filter(row => Object.values(row).some(val => val !== undefined && val !== ''))
          
          resolve({
            data: processedData,
            fileName,
            columns: headers,
            rowCount: processedData.length
          })
        } catch (error) {
          reject(new Error(`Failed to process Excel file: ${(error as Error).message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsArrayBuffer(file)
    } else {
      reject(new Error('Unsupported file format. Please upload CSV or Excel files.'))
    }
  })
}