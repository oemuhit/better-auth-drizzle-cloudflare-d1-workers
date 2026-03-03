import { geliverGetCities } from "../../utils/geliver";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";

  if (!token) {
    throw createError({ statusCode: 503, message: "Geliver token not configured" });
  }

  const cities = await geliverGetCities(token, "TR");

  // Normalize to { code, name } regardless of Geliver's exact field names
  return cities.map((c: any) => ({
    code: String(c.code ?? c.cityCode ?? c.id ?? ""),
    name: String(c.name ?? c.cityName ?? ""),
  })).filter(c => c.code && c.name)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
});
