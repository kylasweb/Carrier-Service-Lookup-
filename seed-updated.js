const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with updated schema...');

  // Get or create sample carriers
  let maersk = await prisma.carrier.findUnique({ where: { name: 'Maersk' } });
  if (!maersk) {
    maersk = await prisma.carrier.create({
      data: {
        name: 'Maersk',
        description: 'Global container shipping and logistics company',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Maersk_Logo.svg/1200px-Maersk_Logo.svg.png',
        carrierType: 'MLO'
      }
    });
  }

  let msc = await prisma.carrier.findUnique({ where: { name: 'MSC' } });
  if (!msc) {
    msc = await prisma.carrier.create({
      data: {
        name: 'MSC',
        description: 'Mediterranean Shipping Company, global container shipping line',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/MSC_Logo.svg/1200px-MSC_Logo.svg.png',
        carrierType: 'MLO'
      }
    });
  }

  let cosco = await prisma.carrier.findUnique({ where: { name: 'COSCO' } });
  if (!cosco) {
    cosco = await prisma.carrier.create({
      data: {
        name: 'COSCO',
        description: 'China Ocean Shipping Company, Chinese multinational transportation company',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/COSCO_LOGO.svg/1200px-COSCO_LOGO.svg.png',
        carrierType: 'MLO'
      }
    });
  }

  // Create sample services with multiple routes for Maersk
  const maerskPacificService = await prisma.service.create({
    data: {
      name: 'Pacific South Loop',
      partnerServices: 'Rail connections to major US cities',
      carrierId: maersk.id,
      routes: {
        create: [
          {
            pol: 'Shanghai',
            pod: 'Long Beach',
            transitTime: '15 days'
          },
          {
            pol: 'Ningbo',
            pod: 'Los Angeles',
            transitTime: '14 days'
          },
          {
            pol: 'Qingdao',
            pod: 'Oakland',
            transitTime: '16 days'
          }
        ]
      }
    }
  });

  const maerskAsiaEuropeService = await prisma.service.create({
    data: {
      name: 'Asia-Europe Network',
      partnerServices: 'Trucking services throughout Europe',
      carrierId: maersk.id,
      routes: {
        create: [
          {
            pol: 'Singapore',
            pod: 'Rotterdam',
            transitTime: '22 days'
          },
          {
            pol: 'Hong Kong',
            pod: 'Hamburg',
            transitTime: '24 days'
          },
          {
            pol: 'Shanghai',
            pod: 'Antwerp',
            transitTime: '23 days'
          }
        ]
      }
    }
  });

  // Create sample services with multiple routes for MSC
  const mscAsiaExpressService = await prisma.service.create({
    data: {
      name: 'Asia Express',
      partnerServices: 'Intermodal rail services',
      carrierId: msc.id,
      routes: {
        create: [
          {
            pol: 'Ningbo',
            pod: 'Los Angeles',
            transitTime: '14 days'
          },
          {
            pol: 'Shanghai',
            pod: 'Long Beach',
            transitTime: '15 days'
          }
        ]
      }
    }
  });

  const mscMediterraneanService = await prisma.service.create({
    data: {
      name: 'Mediterranean Service',
      partnerServices: 'East Coast distribution network',
      carrierId: msc.id,
      routes: {
        create: [
          {
            pol: 'Piraeus',
            pod: 'New York',
            transitTime: '18 days'
          },
          {
            pol: 'Valencia',
            pod: 'Norfolk',
            transitTime: '17 days'
          }
        ]
      }
    }
  });

  // Create sample services with multiple routes for COSCO
  const coscoChinaUSWestService = await prisma.service.create({
    data: {
      name: 'China-US West Coast',
      partnerServices: 'Pacific Northwest logistics',
      carrierId: cosco.id,
      routes: {
        create: [
          {
            pol: 'Qingdao',
            pod: 'Seattle',
            transitTime: '16 days'
          },
          {
            pol: 'Shanghai',
            pod: 'Tacoma',
            transitTime: '15 days'
          }
        ]
      }
    }
  });

  const coscoTransPacificService = await prisma.service.create({
    data: {
      name: 'Trans-Pacific Service',
      partnerServices: 'Northern California distribution',
      carrierId: cosco.id,
      routes: {
        create: [
          {
            pol: 'Yantian',
            pod: 'Oakland',
            transitTime: '15 days'
          },
          {
            pol: 'Xiamen',
            pod: 'Los Angeles',
            transitTime: '16 days'
          }
        ]
      }
    }
  });

  console.log('Database seeded successfully with updated schema!');
  console.log('Created 3 carriers and 6 services with multiple routes each');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });