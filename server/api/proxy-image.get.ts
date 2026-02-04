import { Readable } from "node:stream";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "URL is required",
    });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
        console.error(`[Proxy Image] Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        throw createError({
          statusCode: response.status,
          statusMessage: `Failed to fetch image: ${response.statusText}`,
        });
    }

    const arrayBuffer = await response.arrayBuffer();
    return sendStream(event, Readable.from(Buffer.from(arrayBuffer)));
  } catch (err: any) {
    console.error(`[Proxy Image] Error fetching ${url}:`, err);
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err.statusMessage || "Failed to proxy image",
    });
  }
});
