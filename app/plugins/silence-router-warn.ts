export default defineNuxtPlugin(() => {
  if (process.dev) {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('[Vue Router warn]: No match found for location with path')) {
        return;
      }
      originalWarn(...args);
    };
  }
});
