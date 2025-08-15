import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const port = await db.port.findUnique({
      where: { id }
    })

    if (!port) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(port)
  } catch (error) {
    console.error("Error fetching port:", error)
    return NextResponse.json(
      { error: "Failed to fetch port" },
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
    const { name, country, unloc, code, latitude, longitude } = body

    if (!name || !country || !unloc) {
      return NextResponse.json(
        { error: "Port name, country, and UNLOC are required" },
        { status: 400 }
      )
    }

    const existingPort = await db.port.findUnique({
      where: { id }
    })

    if (!existingPort) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      )
    }

    // Check if UNLOC is being changed and if it conflicts with existing port
    if (unloc !== existingPort.unloc) {
      const unlocExists = await db.port.findFirst({
        where: {
          unloc,
          NOT: { id }
        }
      })

      if (unlocExists) {
        return NextResponse.json(
          { error: "Port with this UNLOC already exists" },
          { status: 400 }
        )
      }
    }

    const port = await db.port.update({
      where: { id },
      data: {
        name,
        country,
        unloc,
        code,
        latitude,
        longitude
      }
    })

    return NextResponse.json(port)
  } catch (error) {
    console.error("Error updating port:", error)
    return NextResponse.json(
      { error: "Failed to update port" },
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
    const existingPort = await db.port.findUnique({
      where: { id }
    })

    if (!existingPort) {
      return NextResponse.json(
        { error: "Port not found" },
        { status: 404 }
      )
    }

    // Check if port is used in any service routes
    const usedInRoutes = await db.serviceRoute.findFirst({
      where: {
        OR: [
          { polId: id },
          { podId: id }
        ]
      }
    })

    if (usedInRoutes) {
      return NextResponse.json(
        { error: "Cannot delete port: it is used in one or more service routes" },
        { status: 400 }
      )
    }

    await db.port.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Port deleted successfully" })
  } catch (error) {
    console.error("Error deleting port:", error)
    return NextResponse.json(
      { error: "Failed to delete port" },
      { status: 500 }
    )
  }
}