import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'

    // Create template data
    const templateData = [
      {
        'Service Name': 'Asia-Europe Express',
        'Carrier': 'Maersk',
        'POL': 'Shanghai',
        'POD': 'Rotterdam',
        'Transit Time': '30 days',
        'Partner Services': 'Rail connections throughout Europe',
        'Route Name': 'Main Route'
      },
      {
        'Service Name': 'Asia-Europe Express',
        'Carrier': 'Maersk',
        'POL': 'Ningbo',
        'POD': 'Hamburg',
        'Transit Time': '28 days',
        'Partner Services': 'Rail connections throughout Europe',
        'Route Name': 'Alternative Route'
      },
      {
        'Service Name': 'Trans-Pacific Service',
        'Carrier': 'MSC',
        'POL': 'Qingdao',
        'POD': 'Los Angeles',
        'Transit Time': '18 days',
        'Partner Services': 'Intermodal rail services',
        'Route Name': 'Direct Route'
      }
    ]

    if (format === 'csv') {
      // Create CSV
      const headers = Object.keys(templateData[0])
      const csvContent = [
        headers.join(','),
        ...templateData.map(row => 
          headers.map(header => `"${row[header] || ''}"`).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="service-template.csv"'
        }
      })
    } else {
      // Create Excel file
      const worksheet = XLSX.utils.json_to_sheet(templateData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Services')

      // Add instructions sheet
      const instructionsData = [
        { 'Field': 'Service Name', 'Required': 'Yes', 'Description': 'Name of the service' },
        { 'Field': 'Carrier', 'Required': 'Yes', 'Description': 'Name of the carrier (must exist in database)' },
        { 'Field': 'POL', 'Required': 'Yes', 'Description': 'Port of Loading (must exist in database)' },
        { 'Field': 'POD', 'Required': 'Yes', 'Description': 'Port of Discharge (must exist in database)' },
        { 'Field': 'Transit Time', 'Required': 'No', 'Description': 'Transit time (e.g., "15 days", "3 weeks")' },
        { 'Field': 'Partner Services', 'Required': 'No', 'Description': 'Additional services or partners' },
        { 'Field': 'Route Name', 'Required': 'No', 'Description': 'Optional route name for multi-route services' }
      ]

      const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData)
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="service-template.xlsx"'
        }
      })
    }

  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}