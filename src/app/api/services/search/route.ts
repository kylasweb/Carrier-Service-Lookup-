import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pol = searchParams.get("pol")
    const pod = searchParams.get("pod")

    if (!pol || !pod) {
      return NextResponse.json(
        { error: "POL and POD parameters are required" },
        { status: 400 }
      )
    }

    // Find ports that match the POL and POD search terms
    const polPorts = await db.port.findMany({
      where: {
        OR: [
          {
            name: {
              contains: pol
            }
          },
          {
            unloc: {
              contains: pol
            }
          },
          {
            country: {
              contains: pol
            }
          }
        ]
      }
    })

    const podPorts = await db.port.findMany({
      where: {
        OR: [
          {
            name: {
              contains: pod
            }
          },
          {
            unloc: {
              contains: pod
            }
          },
          {
            country: {
              contains: pod
            }
          }
        ]
      }
    })

    const polPortIds = polPorts.map(port => port.id)
    const podPortIds = podPorts.map(port => port.id)

    if (polPortIds.length === 0 || podPortIds.length === 0) {
      return NextResponse.json([])
    }

    const services = await db.service.findMany({
      where: {
        routes: {
          some: {
            polId: {
              in: polPortIds
            },
            podId: {
              in: podPortIds
            }
          }
        }
      },
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
    console.error("Error searching services:", error)
    return NextResponse.json(
      { error: "Failed to search services" },
      { status: 500 }
    )
  }
}