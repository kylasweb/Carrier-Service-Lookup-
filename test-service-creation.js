const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testServiceCreation() {
  try {
    console.log('Testing service creation with multiple routes...');
    
    // Get a carrier
    const carrier = await prisma.carrier.findFirst();
    if (!carrier) {
      console.log('No carriers found. Creating a test carrier...');
      const newCarrier = await prisma.carrier.create({
        data: {
          name: 'Test Carrier',
          description: 'Test carrier for service creation',
        }
      });
      console.log('Created test carrier:', newCarrier);
    }
    
    const testCarrier = await prisma.carrier.findFirst();
    console.log('Using carrier:', testCarrier);
    
    // Create a service with multiple routes
    const serviceData = {
      name: 'Test Multi-Route Service',
      partnerServices: 'Test partner services',
      carrierId: testCarrier.id,
      routes: [
        { pol: 'Shanghai', pod: 'Los Angeles', transitTime: '15 days' },
        { pol: 'Ningbo', pod: 'Long Beach', transitTime: '14 days' },
        { pol: 'Qingdao', pod: 'Oakland', transitTime: '16 days' }
      ]
    };
    
    console.log('Creating service with data:', serviceData);
    
    const newService = await prisma.service.create({
      data: {
        name: serviceData.name,
        partnerServices: serviceData.partnerServices,
        carrierId: serviceData.carrierId,
        routes: {
          create: serviceData.routes.map(route => ({
            pol: route.pol,
            pod: route.pod,
            transitTime: route.transitTime
          }))
        }
      },
      include: {
        carrier: true,
        routes: true
      }
    });
    
    console.log('Created service:', newService);
    
    // Verify the service was created with routes
    const verifyService = await prisma.service.findUnique({
      where: { id: newService.id },
      include: {
        carrier: true,
        routes: true
      }
    });
    
    console.log('Verified service:', verifyService);
    console.log('Number of routes:', verifyService.routes.length);
    
    // Test retrieval
    const allServices = await prisma.service.findMany({
      include: {
        carrier: true,
        routes: true
      }
    });
    
    console.log('Total services in database:', allServices.length);
    allServices.forEach(service => {
      console.log(`- ${service.name} (${service.carrier.name}): ${service.routes.length} routes`);
      service.routes.forEach(route => {
        console.log(`  * ${route.pol} → ${route.pod} (${route.transitTime})`);
      });
    });
    
  } catch (error) {
    console.error('Error testing service creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServiceCreation();