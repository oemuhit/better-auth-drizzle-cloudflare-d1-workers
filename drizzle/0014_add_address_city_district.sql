-- Add city code and district fields to customer_address
ALTER TABLE "customer_address" ADD COLUMN "city_code" text;
ALTER TABLE "customer_address" ADD COLUMN "district" text;
