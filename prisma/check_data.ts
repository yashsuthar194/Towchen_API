import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking database status...');
  
  const vendorCount = await prisma.vendor.count();
  const driverCount = await prisma.driver.count();
  const serviceCount = await prisma.service.count();
  const subServiceCount = await prisma.sub_service.count();

  const firstVendor = await prisma.vendor.findFirst();

  const firstDriver = await prisma.driver.findFirst();

  console.log({
    vendorCount,
    driverCount,
    serviceCount,
    subServiceCount,
    firstVendorServices: firstVendor?.service_ids,
    firstDriverSubServices: firstDriver?.sub_service_id
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
