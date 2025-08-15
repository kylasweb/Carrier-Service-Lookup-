import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const services = await db.service.findMany({
      orderBy: {
        createdAt: "desc"
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

    return NextResponse.json(services)
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const service = await db.service.create({
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

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    )
  }
}