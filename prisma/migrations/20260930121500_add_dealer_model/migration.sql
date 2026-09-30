-- AlterEnum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'Dealer';

-- CreateTable
CREATE TABLE "dealer" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_deleted_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dealer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dealer_formated_id_key" ON "dealer"("formated_id");

-- CreateIndex
CREATE INDEX "dealer_id_formated_id_idx" ON "dealer"("id", "formated_id");

-- CreateIndex
CREATE INDEX "dealer_email_is_deleted_idx" ON "dealer"("email", "is_deleted");

-- Update Function to generate formatted ID with DLR prefix
CREATE OR REPLACE FUNCTION generate_formatted_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
BEGIN
    -- Determine the prefix based on the table name
    CASE TG_TABLE_NAME
        WHEN 'vendor' THEN prefix := 'VND';
        WHEN 'driver' THEN prefix := 'DRV';
        WHEN 'customer' THEN prefix := 'CST';
        WHEN 'order' THEN prefix := 'ORD';
        WHEN 'lead' THEN prefix := 'LED';
        WHEN 'dealer' THEN prefix := 'DLR';
        ELSE prefix := 'UNK';
    END CASE;

    -- Ensure the ID is populated (if using SERIAL/SEQUENCE)
    IF NEW.id IS NULL THEN
        NEW.id := nextval(pg_get_serial_sequence(TG_TABLE_NAME, 'id'));
    END IF;

    -- Generate the formatted ID: Prefix + 7 digits (padded with zeros)
    NEW.formated_id := prefix || LPAD(NEW.id::text, 7, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger for dealer
DROP TRIGGER IF EXISTS trg_dealer_formatted_id ON "dealer";
CREATE TRIGGER trg_dealer_formatted_id
BEFORE INSERT ON "dealer"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();
