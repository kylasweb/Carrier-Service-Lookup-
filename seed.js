const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample carriers
  const maersk = await prisma.carrier.create({
    data: {
      name: 'Maersk',
      description: 'Global container shipping and logistics company',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Maersk_Logo.svg/1200px-Maersk_Logo.svg.png',
      carrierType: 'MLO'
    }
  });

  const msc = await prisma.carrier.create({
    data: {
      name: 'MSC',
      description: 'Mediterranean Shipping Company, global container shipping line',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/MSC_Logo.svg/1200px-MSC_Logo.svg.png',
      carrierType: 'MLO'
    }
  });

  const cosco = await prisma.carrier.create({
    data: {
      name: 'COSCO',
      description: 'China Ocean Shipping Company, Chinese multinational transportation company',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/COSCO_LOGO.svg/1200px-COSCO_LOGO.svg.png',
      carrierType: 'MLO'
    }
  });

  // Create sample services for Maersk
  await prisma.service.create({
    data: {
      name: 'Pacific South Loop',
      pol: 'Shanghai',
      pod: 'Long Beach',
      transitTime: '15 days',
      partnerServices: 'Rail connections to major US cities',
      carrierId: maersk.id
    }
  });

  await prisma.service.create({
    data: {
      name: 'Asia-Europe Network',
      pol: 'Singapore',
      pod: 'Rotterdam',
      transitTime: '22 days',
      partnerServices: 'Trucking services throughout Europe',
      carrierId: maersk.id
    }
  });

  // Create sample services for MSC
  await prisma.service.create({
    data: {
      name: 'Asia Express',
      pol: 'Ningbo',
      pod: 'Los Angeles',
      transitTime: '14 days',
      partnerServices: 'Intermodal rail services',
      carrierId: msc.id
    }
  });

  await prisma.service.create({
    data: {
      name: 'Mediterranean Service',
      pol: 'Piraeus',
      pod: 'New York',
      transitTime: '18 days',
      partnerServices: 'East Coast distribution network',
      carrierId: msc.id
    }
  });

  // Create sample services for COSCO
  await prisma.service.create({
    data: {
      name: 'China-US West Coast',
      pol: 'Qingdao',
      pod: 'Seattle',
      transitTime: '16 days',
      partnerServices: 'Pacific Northwest logistics',
      carrierId: cosco.id
    }
  });

  await prisma.service.create({
    data: {
      name: 'Trans-Pacific Service',
      pol: 'Yantian',
      pod: 'Oakland',
      transitTime: '15 days',
      partnerServices: 'Northern California distribution',
      carrierId: cosco.id
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });