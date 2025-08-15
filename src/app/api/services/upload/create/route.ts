import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ServiceCreationData {
  name: string
  carrierName: string
  partnerServices?: string
  routes: Array<{
    routeName?: string
    pol: string
    pod: string
    transitTime: string
  }>
}

interface CreationResult {
  success: boolean
  serviceId?: string
  errors: string[]
  warnings: string[]
}

export async function POST(request: NextRequest) {
  try {
    const services: ServiceCreationData[] = await request.json()
    
    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: 'No services data provided' },
        { status: 400 }
      )
    }

    const results: CreationResult[] = []
    let createdCount = 0
    let errorCount = 0

    for (const serviceData of services) {
      const result = await createSingleService(serviceData)
      results.push(result)
      
      if (result.success) {
        createdCount++
      } else {
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalServices: services.length,
        createdServices: createdCount,
        errorServices: errorCount
      },
      results
    })

  } catch (error) {
    console.error('Error creating services from upload:', error)
    return NextResponse.json(
      { error: 'Failed to create services' },
      { status: 500 }
    )
  }
}

async function createSingleService(serviceData: ServiceCreationData): Promise<CreationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Validate required fields
    if (!serviceData.name || !serviceData.carrierName) {
      errors.push('Service name and carrier are required')
      return { success: false, errors, warnings }
    }

    if (!serviceData.routes || serviceData.routes.length === 0) {
      errors.push('At least one route is required')
      return { success: false, errors, warnings }
    }

    // Find carrier
    const carrier = await db.carrier.findFirst({
      where: {
        name: {
          equals: serviceData.carrierName,
          mode: 'insensitive'
        }
      }
    })

    if (!carrier) {
      errors.push(`Carrier "${serviceData.carrierName}" not found`)
      return { success: false, errors, warnings }
    }

    // Check for duplicate service
    const existingService = await db.service.findFirst({
      where: {
        name: {
          equals: serviceData.name,
          mode: 'insensitive'
        },
        carrierId: carrier.id
      }
    })

    if (existingService) {
      errors.push(`Service "${serviceData.name}" already exists for carrier "${serviceData.carrierName}"`)
      return { success: false, errors, warnings }
    }

    // Create service
    const service = await db.service.create({
      data: {
        name: serviceData.name.trim(),
        carrierId: carrier.id,
        partnerServices: serviceData.partnerServices?.trim() || null
      }
    })

    // Create routes
    for (const routeData of serviceData.routes) {
      try {
        // Find POL and POD ports
        const polPort = await db.port.findFirst({
          where: {
            name: {
              equals: routeData.pol,
              mode: 'insensitive'
            }
          }
        })

        const podPort = await db.port.findFirst({
          where: {
            name: {
              equals: routeData.pod,
              mode: 'insensitive'
            }
          }
        })

        if (!polPort) {
          errors.push(`Port "${routeData.pol}" not found`)
          continue
        }

        if (!podPort) {
          errors.push(`Port "${routeData.pod}" not found`)
          continue
        }

        await db.serviceRoute.create({
          data: {
            serviceId: service.id,
            polId: polPort.id,
            podId: podPort.id,
            transitTime: routeData.transitTime || 'TBD'
          }
        })

      } catch (routeError) {
        console.error('Error creating route:', routeError)
        errors.push(`Failed to create route from ${routeData.pol} to ${routeData.pod}`)
      }
    }

    // Verify that at least one route was created successfully
    const createdRoutes = await db.serviceRoute.count({
      where: {
        serviceId: service.id
      }
    })

    if (createdRoutes === 0) {
      // Delete the service if no routes were created
      await db.service.delete({
        where: { id: service.id }
      })
      errors.push('No valid routes were created for the service')
      return { success: false, errors, warnings }
    }

    return {
      success: true,
      serviceId: service.id,
      errors,
      warnings
    }

  } catch (error) {
    console.error('Error creating service:', error)
    errors.push('Failed to create service due to database error')
    return { success: false, errors, warnings }
  }
}