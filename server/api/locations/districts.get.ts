import { geliverGetDistricts } from "../../utils/geliver";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const cityCode = query.cityCode as string;

  if (!cityCode) {
    throw createError({ statusCode: 400, message: "cityCode query parameter is required" });
  }

  const config = useRuntimeConfig(event);
  const token: string = (config as any).geliverToken ?? "";

  if (!token) {
    throw createError({ statusCode: 503, message: "Geliver token not configured" });
  }

  const districts = await geliverGetDistricts(token, cityCode, "TR");

  // Normalize to { id, name }
  return districts.map((d: any) => ({
    id: d.id ?? d.districtID ?? null,
    name: String(d.name ?? d.districtName ?? ""),
  })).filter(d => d.name)
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
});
