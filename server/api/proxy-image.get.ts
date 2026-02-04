export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "URL is required",
    });
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: "Failed to fetch image",
    });
  }

  const blob = await response.blob();
  return sendStream(event, blob.stream());
});
