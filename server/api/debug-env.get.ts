export default defineEventHandler((event) => {
    try {
        const cloudflare = event.context.cloudflare;
        return {
            contextKeys: Object.keys(event.context),
            hasCloudflare: !!cloudflare,
            envKeys: cloudflare?.env ? Object.keys(cloudflare.env) : null,
            isRemote: process.env.NUXT_REMOTE === 'true' || process.argv.includes('--remote')
        }
    } catch (err: any) {
        return {
            error: err.message,
            stack: err.stack
        }
    }
})
