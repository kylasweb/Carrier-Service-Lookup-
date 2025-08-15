import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || !query.trim()) {
      return NextResponse.json([])
    }

    const ports = await db.port.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query
            }
          },
          {
            country: {
              contains: query
            }
          },
          {
            unloc: {
              contains: query
            }
          }
        ]
      },
      orderBy: {
        name: 'asc'
      },
      take: 20 // Limit results for better performance
    })

    return NextResponse.json(ports)
  } catch (error) {
    console.error("Error searching ports:", error)
    return NextResponse.json(
      { error: "Failed to search ports" },
      { status: 500 }
    )
  }
}