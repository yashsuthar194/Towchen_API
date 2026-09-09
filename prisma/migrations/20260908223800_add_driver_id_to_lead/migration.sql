ALTER TABLE "lead" DROP COLUMN "tag_locations_data";
DELETE FROM "lead";
ALTER TABLE "lead" ADD COLUMN "driver_id" INTEGER NOT NULL;
ALTER TABLE "lead" ADD CONSTRAINT "lead_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
