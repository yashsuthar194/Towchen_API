/*
  Warnings:

  - A unique constraint covering the columns `[formated_id]` on the table `driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `formated_id` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "driver" ADD COLUMN     "formated_id" TEXT NOT NULL;

-- 1. Create the function
CREATE OR REPLACE FUNCTION set_driver_display_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.formated_id := 'DRI' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
CREATE TRIGGER trg_set_driver_display_id
BEFORE INSERT ON "driver"
FOR EACH ROW EXECUTE FUNCTION set_driver_display_id();


-- CreateIndex
CREATE UNIQUE INDEX "driver_formated_id_key" ON "driver"("formated_id");
