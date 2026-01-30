import { useDb } from "../../utils/db";
import { taxRate } from "../../db/schema";

export default defineEventHandler(async (event) => {
  const db = useDb(event);

  const taxRates = await db.select().from(taxRate).orderBy(taxRate.title);

  return {
    data: taxRates,
    total: taxRates.length,
  };
});
