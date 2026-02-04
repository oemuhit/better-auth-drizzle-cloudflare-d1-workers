import resize from "@jsquash/resize";
import { encode as encodeWebP } from "@jsquash/webp";

export function useImageUpload() {
  const isUploading = ref(false);
  const targetWidths = [160, 256, 512, 800, 1024];

  async function uploadImage(file: File) {
    if (!file.type.startsWith('image/')) {
       throw new Error('File is not an image');
    }

    isUploading.value = true;
    try {
      const formData = new FormData();
      // Use standard 'image' field for all parts. 
      // Filename is provided by the File object itself.
      formData.append('image', file);

      // Create ImageData from the file using canvas
      let bitmap: ImageBitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch (err) {
        console.error('[useImageUpload] createImageBitmap failed:', err);
        throw new Error(`Failed to process image: ${err instanceof Error ? err.message : String(err)}`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      ctx.drawImage(bitmap, 0, 0);
      const originalImageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

      // Resized versions using jSquash
      await Promise.all(targetWidths.map(async (width) => {
        try {
          // Calculate height to maintain aspect ratio
          const aspectRatio = originalImageData.height / originalImageData.width;
          const height = Math.round(width * aspectRatio);
          
          // Resize using jSquash
          const resizedImageData = await resize(originalImageData, { width, height });
          
          // Encode to WebP using jSquash
          const webpBuffer = await encodeWebP(resizedImageData, { quality: 80 });
          
          // Create File from buffer
          const compressedFile = new File([webpBuffer], `${width}w.webp`, { type: 'image/webp' });
          formData.append('image', compressedFile);
        } catch (error) {
          console.error(`[useImageUpload] jSquash error for width ${width}:`, error);
          // We don't throw here to allow other sizes to succeed, but maybe we should log it
        }
      }));

      const response = await $fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      }) as any;

      if (response?.success) {
        return response;
      } else {
        console.error('[useImageUpload] Server returned error:', response);
        throw new Error(response?.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('[useImageUpload] Fatal Error:', err);
      throw err;
    } finally {
      isUploading.value = false;
    }
  }

  return {
    isUploading,
    uploadImage,
    targetWidths
  };
}
