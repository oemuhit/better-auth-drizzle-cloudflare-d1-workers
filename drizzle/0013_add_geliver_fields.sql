-- Add Geliver cargo tracking fields to orders
ALTER TABLE "order" ADD COLUMN "geliver_shipment_id" text;
ALTER TABLE "order" ADD COLUMN "tracking_number" text;
ALTER TABLE "order" ADD COLUMN "tracking_url" text;
ALTER TABLE "order" ADD COLUMN "label_url" text;
