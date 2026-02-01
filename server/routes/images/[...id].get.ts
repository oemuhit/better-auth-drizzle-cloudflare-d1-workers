export default defineEventHandler(async (event) => {
    const cloudflare = event.context.cloudflare;
    const id = event.context.params?.id;

    if (!id) return;

    if (!cloudflare?.env?.BUCKET) {
        throw createError({
            statusCode: 500,
            statusMessage: 'R2 Bucket not configured',
        });
    }

    // Expecting format like id_512w.webp
    const object = await cloudflare.env.BUCKET.get(id);

    if (!object) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Image not found',
        });
    }

    setResponseHeader(event, 'Content-Type', 'image/webp');
    setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable');

    return object.body;
});
