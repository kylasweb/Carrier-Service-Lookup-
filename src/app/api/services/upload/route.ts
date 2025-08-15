import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import csv from 'csv-parser'
import { Readable } from 'stream'

interface ServiceRow {
  'Service Name'?: string
  'Carrier'?: string
  'POL'?: string
  'POD'?: string
  'Transit Time'?: string
  'Partner Services'?: string
  'Route Name'?: string
  [key: string]: any
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  data?: any
}

interface ParsedService {
  name: string
  carrierName: string
  partnerServices?: string
  routes: Array<{
    routeName?: string
    pol: string
    pod: string
    transitTime: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/json' // .json
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload Excel, CSV, or JSON files.' },
        { status: 400 }
      )
    }

    // Parse file based on type
    let rawData: ServiceRow[] = []
    
    if (file.type === 'application/json') {
      const text = await file.text()
      rawData = JSON.parse(text)
    } else if (file.type === 'text/csv') {
      const text = await file.text()
      rawData = await parseCSV(text)
    } else {
      // Excel files
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      rawData = XLSX.utils.sheet_to_json(worksheet)
    }

    // Validate and parse the data
    const validationResult = await validateAndParseData(rawData)
    
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        data: validationResult.data
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: validationResult.data,
      warnings: validationResult.warnings,
      summary: {
        totalServices: validationResult.data?.length || 0,
        totalRoutes: validationResult.data?.reduce((sum, service) => sum + service.routes.length, 0) || 0
      }
    })

  } catch (error) {
    console.error('Error processing file upload:', error)
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    )
  }
}

async function parseCSV(text: string): Promise<ServiceRow[]> {
  return new Promise((resolve, reject) => {
    const results: ServiceRow[] = []
    const stream = Readable.from([text])
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject)
  })
}

async function validateAndParseData(rawData: ServiceRow[]): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []
  const parsedServices: ParsedService[] = []
  
  // Get all carriers and ports for validation
  const carriers = await db.carrier.findMany({
    select: { name: true }
  })
  const ports = await db.port.findMany({
    select: { name: true, country: true }
  })
  
  const carrierNames = carriers.map(c => c.name.toLowerCase())
  const portNames = ports.map(p => p.name.toLowerCase())

  // Group data by service name
  const serviceGroups = groupByServiceName(rawData)

  for (const [serviceName, rows] of Object.entries(serviceGroups)) {
    if (!serviceName || serviceName.trim() === '') {
      errors.push(`Row ${rows[0].__rowNum__ || 'unknown'}: Service name is required`)
      continue
    }

    const serviceRows = rows as ServiceRow[]
    const firstRow = serviceRows[0]
    
    // Validate carrier
    const carrierName = firstRow['Carrier'] || firstRow['carrier']
    if (!carrierName) {
      errors.push(`Service "${serviceName}": Carrier is required`)
      continue
    }
    
    if (!carrierNames.includes(carrierName.toLowerCase())) {
      errors.push(`Service "${serviceName}": Carrier "${carrierName}" not found in database`)
      continue
    }

    const parsedService: ParsedService = {
      name: serviceName.trim(),
      carrierName: carrierName.trim(),
      partnerServices: firstRow['Partner Services'] || firstRow['partnerServices'] || '',
      routes: []
    }

    // Process routes
    for (const row of serviceRows) {
      const pol = row['POL'] || row['pol']
      const pod = row['POD'] || row['pod']
      const transitTime = row['Transit Time'] || row['transitTime']
      const routeName = row['Route Name'] || row['routeName']

      // Validate required route fields
      if (!pol || !pod) {
        errors.push(`Service "${serviceName}": POL and POD are required for each route`)
        continue
      }

      // Validate ports
      if (!portNames.includes(pol.toLowerCase())) {
        errors.push(`Service "${serviceName}": Port "${pol}" not found in database`)
        continue
      }

      if (!portNames.includes(pod.toLowerCase())) {
        errors.push(`Service "${serviceName}": Port "${pod}" not found in database`)
        continue
      }

      // Validate transit time
      if (!transitTime) {
        warnings.push(`Service "${serviceName}": Transit time is recommended`)
      }

      parsedService.routes.push({
        routeName: routeName?.trim() || '',
        pol: pol.trim(),
        pod: pod.trim(),
        transitTime: transitTime?.trim() || 'TBD'
      })
    }

    if (parsedService.routes.length === 0) {
      errors.push(`Service "${serviceName}": No valid routes found`)
      continue
    }

    parsedServices.push(parsedService)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    data: parsedServices
  }
}

function groupByServiceName(rows: ServiceRow[]): Record<string, ServiceRow[]> {
  const groups: Record<string, ServiceRow[]> = {}
  
  rows.forEach((row, index) => {
    // Create a new object with row data and row number for error reporting
    const rowWithNum = { ...row, __rowNum__: index + 2 } // +2 because Excel rows are 1-indexed and header is row 1
    
    const serviceName = row['Service Name'] || row['serviceName'] || ''
    if (!groups[serviceName]) {
      groups[serviceName] = []
    }
    groups[serviceName].push(rowWithNum)
  })
  
  return groups
}