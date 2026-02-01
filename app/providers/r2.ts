import { joinURL } from 'ufo'
import { defineProvider } from '@nuxt/image/runtime'

export default defineProvider({
    getImage(src, { modifiers = {}, baseURL = '/images' } = {} as any) {
        const width = modifiers.width
        const widths = [160, 256, 512, 800, 1024]
        let selectedWidth: number = 1024

        if (width) {
            const w = parseInt(String(width))
            // Find the closest larger width or use the largest available
            selectedWidth = (widths.find(available => available >= w) || widths[widths.length - 1]) as number
        }

        // Our R2 implementation stores files as: imageId_widthw.webp
        // Example: acf7b..._512w.webp
        const filename = `${src}_${selectedWidth}w.webp`

        return {
            url: joinURL(baseURL as string, filename)
        }
    },
    validateDomains: true,
    supportsAlias: true
})
