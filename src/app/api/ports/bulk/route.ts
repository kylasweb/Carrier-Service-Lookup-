import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

interface PortData {
  name: string
  country: string
  unloc: string
  code?: string
  latitude?: number
  longitude?: number
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const text = await file.text()
    const ports: PortData[] = []
    const errors: string[] = []
    let successCount = 0
    let duplicateCount = 0

    // Parse based on file type
    if (file.name.endsWith('.json')) {
      try {
        const jsonData = JSON.parse(text)
        if (Array.isArray(jsonData)) {
          ports.push(...jsonData)
        } else {
          return NextResponse.json(
            { error: "JSON file must contain an array of ports" },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid JSON format" },
          { status: 400 }
        )
      }
    } else if (file.name.endsWith('.csv')) {
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV file must have at least a header and one data row" },
          { status: 400 }
        )
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const requiredFields = ['name', 'country', 'unloc']
      
      // Check required fields
      for (const field of requiredFields) {
        if (!headers.includes(field)) {
          return NextResponse.json(
            { error: `CSV must include ${field} column` },
            { status: 400 }
          )
        }
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
        const portData: any = {}
        
        headers.forEach((header, index) => {
          const value = values[index]
          if (header === 'latitude' || header === 'longitude') {
            portData[header] = value ? parseFloat(value) : undefined
          } else {
            portData[header] = value || undefined
          }
        })
        
        if (portData.name && portData.country && portData.unloc) {
          ports.push(portData)
        }
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please use JSON or CSV" },
        { status: 400 }
      )
    }

    // Process ports
    for (const portData of ports) {
      try {
        // Check if port already exists
        const existingPort = await db.port.findUnique({
          where: { unloc: portData.unloc }
        })

        if (existingPort) {
          duplicateCount++
          continue
        }

        // Validate required fields
        if (!portData.name || !portData.country || !portData.unloc) {
          errors.push(`Missing required fields for port: ${JSON.stringify(portData)}`)
          continue
        }

        await db.port.create({
          data: {
            name: portData.name,
            country: portData.country,
            unloc: portData.unloc,
            code: portData.code,
            latitude: portData.latitude,
            longitude: portData.longitude
          }
        })

        successCount++
      } catch (error) {
        console.error("Error processing port:", portData, error)
        errors.push(`Failed to process port: ${portData.name} (${portData.unloc})`)
      }
    }

    return NextResponse.json({
      message: "Bulk upload completed",
      totalProcessed: ports.length,
      successCount,
      duplicateCount,
      errorCount: errors.length,
      errors
    })

  } catch (error) {
    console.error("Error in bulk upload:", error)
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    )
  }
}