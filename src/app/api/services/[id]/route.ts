import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const service = await db.service.findUnique({
      where: { id },
      include: {
        carrier: true,
        routes: {
          include: {
            polPort: true,
            podPort: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json(
      { error: "Failed to fetch service" },
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
    const { name, partnerServices, carrierId, routes } = body

    if (!name || !carrierId || !routes || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields or routes" },
        { status: 400 }
      )
    }

    // Validate each route and get port IDs
    const processedRoutes: { polId: string; podId: string; transitTime: string }[] = []
    for (const route of routes) {
      if (!route.polId || !route.podId || !route.transitTime) {
        return NextResponse.json(
          { error: "Each route must have POL ID, POD ID, and transit time" },
          { status: 400 }
        )
      }

      // Verify ports exist
      const polPort = await db.port.findUnique({
        where: { id: route.polId }
      })

      const podPort = await db.port.findUnique({
        where: { id: route.podId }
      })

      if (!polPort || !podPort) {
        return NextResponse.json(
          { error: "Invalid POL or POD port ID" },
          { status: 400 }
        )
      }

      processedRoutes.push({
        polId: route.polId,
        podId: route.podId,
        transitTime: route.transitTime
      })
    }

    const existingService = await db.service.findUnique({
      where: { id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    // Update service and its routes
    // First, delete existing routes
    await db.serviceRoute.deleteMany({
      where: { serviceId: id }
    })

    // Then update the service and create new routes
    const service = await db.service.update({
      where: { id },
      data: {
        name,
        partnerServices,
        carrierId,
        routes: {
          create: processedRoutes
        }
      },
      include: {
        carrier: true,
        routes: {
          include: {
            polPort: true,
            podPort: true
          }
        }
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      { error: "Failed to update service" },
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
    const existingService = await db.service.findUnique({
      where: { id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      )
    }

    await db.service.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Service deleted successfully" })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    )
  }
}