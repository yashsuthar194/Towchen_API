import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parsePgArray(val: any): string[] {
  if (!val || typeof val !== 'string') return Array.isArray(val) ? val : [];
  if (val.startsWith('{') && val.endsWith('}')) {
    return val
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [val];
}

function parsePgString(val: any): string | null {
  if (!val) return null;
  if (typeof val !== 'string') return String(val);
  if (val.startsWith('{') && val.endsWith('}')) {
    const arr = val
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return arr[0] || null;
  }
  return val;
}

function mapAvailabilityStatus(status: string): any {
  if (!status) return 'Available';
  if (status === 'Onboard Pending' || status === 'Onboard_Pending') return 'Onboard_Pending';
  if (status.toLowerCase() === 'unavailable') return 'Unavailable';
  return 'Available'; // Default
}

function mapFleetType(type: string): number {
  return 1; // Default sub-service ID as placeholder
}

async function main() {
  const exportDir = path.join(process.cwd(), 'db_export');

  const locations = JSON.parse(fs.readFileSync(path.join(exportDir, 'location.json'), 'utf-8'));
  const vendors = JSON.parse(fs.readFileSync(path.join(exportDir, 'vendor.json'), 'utf-8'));
  const vendorBankDetails = JSON.parse(fs.readFileSync(path.join(exportDir, 'vendor_bank_detail.json'), 'utf-8'));
  const vehicles = JSON.parse(fs.readFileSync(path.join(exportDir, 'vehicle.json'), 'utf-8'));
  const drivers = JSON.parse(fs.readFileSync(path.join(exportDir, 'driver.json'), 'utf-8'));
  const customers = JSON.parse(fs.readFileSync(path.join(exportDir, 'customer.json'), 'utf-8'));
  const customerVehicles = JSON.parse(fs.readFileSync(path.join(exportDir, 'customer_vehicle.json'), 'utf-8'));
  const orders = JSON.parse(fs.readFileSync(path.join(exportDir, 'order.json'), 'utf-8'));
  const orderLocations = JSON.parse(fs.readFileSync(path.join(exportDir, 'order_location.json'), 'utf-8'));
  const orderOtps = JSON.parse(fs.readFileSync(path.join(exportDir, 'order_otp.json'), 'utf-8'));

  // Fetch new service/sub-service mappings
  const allServices = await prisma.service.findMany({ include: { sub_services: true } });
  const serviceMap = new Map(allServices.map((s) => [s.name, s]));
  const subServiceMap = new Map();
  allServices.forEach((s) => s.sub_services.forEach((ss) => subServiceMap.set(ss.name, ss)));

  console.log('Migrating data...');

  // 1. Locations
  console.log('  -> Locations');
  for (const loc of locations) {
    await prisma.location.create({ data: { ...loc } });
  }

  // 2. Vendors
  console.log('  -> Vendors');
  for (const v of vendors) {
    const { services, ...vData } = v;
    const serviceNames = parsePgArray(services);
    const serviceConnects = serviceNames
      .map((name) => {
        const s = serviceMap.get(name);
        return s ? { id: s.id } : null;
      })
      .filter((s) => s !== null) as { id: number }[];

    const serviceIds = serviceConnects.map((s) => s.id);

    await prisma.vendor.create({
      data: {
        ...vData,
        service_ids: serviceIds.length > 0 ? serviceIds : [1],
      },
    });
  }

  // 3. Vendor Bank Details
  console.log('  -> Vendor Bank Details');
  for (const bd of vendorBankDetails) {
    await prisma.vendor_bank_detail.create({ data: { ...bd } });
  }

  // 4. Vehicles
  console.log('  -> Vehicles');
  for (const vh of vehicles) {
    await prisma.vehicle.create({
      data: {
        ...vh,
        fleet_type: mapFleetType(vh.fleet_type),
        vehical_image_url: parsePgArray(vh.vehical_image_url),
        chassis_image_url: parsePgString(vh.chassis_image_url),
        tax_image_url: parsePgString(vh.tax_image_url),
        insurance_image_url: parsePgString(vh.insurance_image_url),
        fitness_image_url: parsePgString(vh.fitness_image_url),
        puc_image_url: parsePgString(vh.puc_image_url),
        availability_status: mapAvailabilityStatus(vh.availability_status),
      },
    });
  }

  // 5. Drivers
  console.log('  -> Drivers');
  for (const d of drivers) {
    const { services, ...dData } = d;
    const subServiceConnects = services
      ? services
          .split(',')
          .map((name) => {
            const ss = subServiceMap.get(name.trim());
            return ss ? { id: ss.id } : null;
          })
          .filter((ss) => ss !== null) as { id: number }[]
      : [];

    const subServiceIds = subServiceConnects.map((ss) => ss.id);

    await prisma.driver.create({
      data: {
        ...dData,
        availability_status: mapAvailabilityStatus(dData.availability_status),
        sub_service_id: 1,
      },
    });
  }

  // 6. Customers
  console.log('  -> Customers');
  for (const c of customers) {
    await prisma.customer.create({ data: { ...c } });
  }

  // 7. Customer Vehicles
  console.log('  -> Customer Vehicles');
  for (const cv of customerVehicles) {
    await prisma.customer_vehicle.create({ data: { ...cv } });
  }

  // 8. Orders
  console.log('  -> Orders');
  for (const o of orders) {
    const { service_type, fleet_type, ...oData } = o;
    const s = serviceMap.get(service_type);
    await prisma.order.create({
      data: {
        ...oData,
        fleet_type: mapFleetType(fleet_type),
        service_id: s ? s.id : 1, // Fallback to 1 if not found
      },
    });
  }

  // 9. Order Locations
  console.log('  -> Order Locations');
  for (const ol of orderLocations) {
    await prisma.order_location.create({ data: { ...ol } });
  }

  // 10. Order OTPs
  console.log('  -> Order OTPs');
  for (const otp of orderOtps) {
    await prisma.order_otp.create({ data: { ...otp } });
  }

  // Reset Postgres sequences
  console.log('Resetting sequences...');
  const tables = [
    'location',
    'vendor',
    'vendor_bank_detail',
    'vehicle',
    'driver',
    'customer',
    'customer_vehicle',
    'order',
    'order_location',
    'order_otp',
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM "${table}";`
    );
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
