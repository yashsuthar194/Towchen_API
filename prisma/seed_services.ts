import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding services and sub-services...');

  // 1. Towing
  const towing = await prisma.service.upsert({
    where: { name: 'Towing' },
    update: {},
    create: {
      name: 'Towing',
      description: 'Vehicle recovery and transport services',
      sub_services: {
        create: [
          { name: 'Underlift' },
          { name: 'Flatbed' },
        ],
      },
    },
  });

  // 2. Hydra
  const hydra = await prisma.service.upsert({
    where: { name: 'Hydra' },
    update: {},
    create: {
      name: 'Hydra',
      description: 'Heavy lifting and crane services',
      sub_services: {
        create: [
          { name: 'Hydra (40 ton)' },
          { name: 'Hydra (110 ton)' },
        ],
      },
    },
  });

  // 3. Custody
  const custody = await prisma.service.upsert({
    where: { name: 'Custody' },
    update: {},
    create: {
      name: 'Custody',
      description: 'Vehicle storage and custody services',
      sub_services: {
        create: [
          { name: 'Safe Storage' },
        ],
      },
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
