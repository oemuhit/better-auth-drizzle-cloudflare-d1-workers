export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", async (error, { event }) => {
    console.error(`[Global Error Handler] Path: ${event?.path} - Error:`, error);
    
    // Capture raw Drizzle/SQLite generic errors and sanitize them for the frontend
    const errorString = String(error);

    if (errorString.includes("UNIQUE constraint failed: user.email")) {
      // Prevent messy SQL errors from leaking to the frontend UI
      throw createError({
        statusCode: 400,
        statusMessage: "Bu e-posta adresi zaten kullanımda.",
      });
    }

    if (errorString.includes("SQLITE_CONSTRAINT")) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bir veri kısıtlama hatası oluştu, lütfen zorunlu alanları kontrol edin.",
      });
    }

    // Default fallback - handled gracefully
  });
});
