-- Migration to add barcode and payment info to orders table
ALTER TABLE "order" ADD COLUMN "barcode" text;
ALTER TABLE "order" ADD COLUMN "transaction_id" text;
ALTER TABLE "order" ADD COLUMN "amount_charged" text;
ALTER TABLE "order" ADD COLUMN "currency" text;
