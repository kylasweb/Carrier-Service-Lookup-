import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const ports = await db.port.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(ports)
  } catch (error) {
    console.error('Error fetching ports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ports' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, country, unloc, code, latitude, longitude } = body

    // Validate required fields
    if (!name || !country || !unloc) {
      return NextResponse.json(
        { error: 'Name, country, and UNLOC are required' },
        { status: 400 }
      )
    }

    // Check if UNLOC already exists
    const existingPort = await db.port.findUnique({
      where: { unloc }
    })

    if (existingPort) {
      return NextResponse.json(
        { error: 'Port with this UNLOC already exists' },
        { status: 409 }
      )
    }

    // Create the port
    const port = await db.port.create({
      data: {
        name,
        country,
        unloc,
        code: code || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null
      }
    })

    return NextResponse.json(port, { status: 201 })
  } catch (error) {
    console.error('Error creating port:', error)
    return NextResponse.json(
      { error: 'Failed to create port' },
      { status: 500 }
    )
  }
}