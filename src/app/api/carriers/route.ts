import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const carriers = await db.carrier.findMany({
      orderBy: {
        name: "asc"
      },
      include: {
        services: true
      }
    })

    return NextResponse.json(carriers)
  } catch (error) {
    console.error("Error fetching carriers:", error)
    return NextResponse.json(
      { error: "Failed to fetch carriers" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, logoUrl, carrierType } = body

    if (!name) {
      return NextResponse.json(
        { error: "Carrier name is required" },
        { status: 400 }
      )
    }

    const carrier = await db.carrier.create({
      data: {
        name,
        description,
        logoUrl,
        carrierType
      }
    })

    return NextResponse.json(carrier, { status: 201 })
  } catch (error) {
    console.error("Error creating carrier:", error)
    return NextResponse.json(
      { error: "Failed to create carrier" },
      { status: 500 }
    )
  }
}