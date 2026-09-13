ALTER TABLE "lead" DROP COLUMN "lead_amount";
DELETE FROM "lead";
ALTER TABLE "lead" ADD COLUMN "formated_id" TEXT NOT NULL;
CREATE UNIQUE INDEX "lead_formated_id_key" ON "lead"("formated_id");
CREATE INDEX "lead_id_formated_id_idx" ON "lead"("id", "formated_id");

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

DROP TRIGGER IF EXISTS trg_lead_formatted_id ON "lead";
CREATE TRIGGER trg_lead_formatted_id
BEFORE INSERT ON "lead"
FOR EACH ROW
EXECUTE FUNCTION generate_formatted_id();
