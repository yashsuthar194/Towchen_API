import { PrismaClient } from '@prisma/client';
import { Hash } from './src/shared/helper/hash';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await Hash.hashAsync('admin123');
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@towchen.com' },
    update: {},
    create: {
      email: 'admin@towchen.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SuperAdmin',
    },
  });

  console.log('Seeded admin:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
