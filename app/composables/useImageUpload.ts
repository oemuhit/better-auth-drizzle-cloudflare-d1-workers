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
      formData.append('original', file, file.name);

      // Create ImageData from the file using canvas
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
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
          formData.append(`${width}w`, compressedFile);
        } catch (error) {
          console.error(`jSquash error for width ${width}:`, error);
        }
      }));

      const response = await $fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      }) as any;

      if (response?.success) {
        return response;
      } else {
        throw new Error(response?.error || 'Upload failed');
      }
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
