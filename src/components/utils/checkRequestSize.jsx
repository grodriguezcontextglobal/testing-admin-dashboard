  export const checkRequestSize = (data) => {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    // Warn if approaching 10MB limit (most servers have 10-50MB limits)
    if (sizeInMB > 8) {
      console.warn(`Large request detected: ${sizeInMB.toFixed(2)} MB`);
      return { isLarge: true, size: sizeInMB };
    }

    return { isLarge: false, size: sizeInMB };
  };
