import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const carrier = await db.carrier.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            routes: true
          }
        }
      }
    })

    if (!carrier) {
      return NextResponse.json(
        { error: "Carrier not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(carrier)
  } catch (error) {
    console.error("Error fetching carrier:", error)
    return NextResponse.json(
      { error: "Failed to fetch carrier" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, logoUrl, carrierType } = body

    if (!name) {
      return NextResponse.json(
        { error: "Carrier name is required" },
        { status: 400 }
      )
    }

    const existingCarrier = await db.carrier.findUnique({
      where: { id }
    })

    if (!existingCarrier) {
      return NextResponse.json(
        { error: "Carrier not found" },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it conflicts with existing carrier
    if (name !== existingCarrier.name) {
      const nameExists = await db.carrier.findFirst({
        where: {
          name,
          NOT: { id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: "Carrier name already exists" },
          { status: 400 }
        )
      }
    }

    const carrier = await db.carrier.update({
      where: { id },
      data: {
        name,
        description,
        logoUrl,
        carrierType
      },
      include: {
        services: true
      }
    })

    return NextResponse.json(carrier)
  } catch (error) {
    console.error("Error updating carrier:", error)
    return NextResponse.json(
      { error: "Failed to update carrier" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existingCarrier = await db.carrier.findUnique({
      where: { id }
    })

    if (!existingCarrier) {
      return NextResponse.json(
        { error: "Carrier not found" },
        { status: 404 }
      )
    }

    await db.carrier.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Carrier deleted successfully" })
  } catch (error) {
    console.error("Error deleting carrier:", error)
    return NextResponse.json(
      { error: "Failed to delete carrier" },
      { status: 500 }
    )
  }
}