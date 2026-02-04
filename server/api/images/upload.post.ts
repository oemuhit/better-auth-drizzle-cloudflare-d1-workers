export default defineEventHandler(async (event) => {
    const contentType = getRequestHeader(event, 'content-type');
    const contentLength = getRequestHeader(event, 'content-length');
    console.log(`[Upload] Request received. Content-Type: ${contentType}, Content-Length: ${contentLength}`);

    try {
        const cloudflare = event.context.cloudflare;
        if (!cloudflare?.env?.BUCKET) {
            console.error('[Upload] BUCKET binding missing. Available env keys:', cloudflare?.env ? Object.keys(cloudflare.env) : 'None');
            return { success: false, error: 'BUCKET binding missing' };
        }

        console.log('[Upload] Parsing multipart data...');
        const formData = await readMultipartFormData(event);

        if (!formData || formData.length === 0) {
            console.warn('[Upload] No files found in multipart data');
            return { success: false, error: 'No files in request. Ensure you are sending FormData.' };
        }

        const imageId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

        const uploadedFiles: string[] = [];

        for (const part of formData) {
            if (!part.data || part.data.length === 0) continue;

            // Robust naming: use filename if available, fallback to field name
            const rawFileName = part.filename || part.name || 'file';
            console.log(`[Upload] Processing part: name="${part.name}", filename="${part.filename}", resolved="${rawFileName}"`);
            
            // 1. Remove ALL extensions (everything after the first dot if multiple, or just strip standard ones)
            // Splitting and taking the first part is safest for our use case where we generate controlled filenames
            let baseName = rawFileName.split('.')[0];
            
            // 2. Sanitize: replace non-alphanumeric with underscores and lowercase
            baseName = baseName
                .replace(/[^a-zA-Z0-9_\-]/g, "_") 
                .toLowerCase();

            // Fallback if baseName ends up empty
            if (!baseName) baseName = 'image';

            const key = `${imageId}_${baseName}.webp`;

            console.log(`[Upload] Sending ${key} to R2 (${part.data.length} bytes)`);

            // Convert to Uint8Array for safety
            const data = new Uint8Array(part.data);

            await cloudflare.env.BUCKET.put(key, data, {
                httpMetadata: {
                    contentType: 'image/webp', // We ensure it's webp
                }
            });
            uploadedFiles.push(key);
        }

        console.log(`[Upload] Success: ${imageId}`);
        return {
            success: true,
            imageId,
            files: uploadedFiles
        };
    } catch (err: any) {
        console.error('[Upload] Fatal Error:', err);
        return {
            success: false,
            error: err.message || 'Internal Server Error',
            details: String(err)
        };
    }
});
