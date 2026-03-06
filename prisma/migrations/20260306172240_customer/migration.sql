-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "formated_id" TEXT NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "number" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_vehicle" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "make" VARCHAR(255) NOT NULL,
    "model" VARCHAR(255) NOT NULL,
    "registration_number" VARCHAR(20) NOT NULL,
    "class" VARCHAR(255) NOT NULL,
    "fuel_type" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted_by" INTEGER,

    CONSTRAINT "customer_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_formated_id_key" ON "customer"("formated_id");

-- CreateIndex
CREATE INDEX "customer_vehicle_customer_id_idx" ON "customer_vehicle"("customer_id");

-- 1. Create the function
CREATE OR REPLACE FUNCTION set_customer_display_id()
RETURNS TRIGGER AS $$
BEGIN
  -- We set the formated_id to 'CUST' followed by 7 digit padded id
  NEW.formated_id := 'CUST' || LPAD(NEW.id::text, 7, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS trg_set_customer_display_id ON "customer";
CREATE TRIGGER trg_set_customer_display_id
BEFORE INSERT ON "customer"
FOR EACH ROW EXECUTE FUNCTION set_customer_display_id();
