import { db } from './src/lib/db'

async function checkCarriers() {
  try {
    // Get total count
    const totalCount = await db.carrier.count()
    console.log(`Total carriers in database: ${totalCount}`)
    
    // Get all carriers
    const carriers = await db.carrier.findMany({
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log('\nAll carriers in database:')
    carriers.forEach(carrier => {
      console.log(`- ${carrier.name} (${carrier.carrierType || 'No type'})`)
    })
    
    // Check the most recently added carriers
    const recentCarriers = await db.carrier.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
    
    console.log('\nMost recently added carriers:')
    recentCarriers.forEach(carrier => {
      console.log(`- ${carrier.name} (${carrier.carrierType || 'No type'}) - ${carrier.createdAt}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await db.$disconnect()
  }
}

checkCarriers()