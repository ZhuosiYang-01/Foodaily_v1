import ExifReader from 'exifreader';

/**
 * Compresses an image from a base64 string or File.
 * Returns a base64 string of the compressed image.
 */
export async function compressImage(
  source: string | File,
  maxWidth = 1080,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = (err) => reject(err);

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }
  });
}

/**
 * Extracts the shooting date from a File's EXIF data.
 * Returns a string in YYYY-MM-DD format, or null if not found.
 */
export async function extractPhotoDate(file: File): Promise<string | null> {
  try {
    const tags = await ExifReader.load(file);
    
    // Try to find the original date/time
    const dateTime = tags['DateTimeOriginal'] || tags['DateTime'] || tags['CreateDate'];
    
    if (dateTime && dateTime.description) {
      // EXIF dates are usually in "YYYY:MM:DD HH:MM:SS" format
      const parts = dateTime.description.split(' ')[0].split(':');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    
    // Fallback to file modification date if EXIF is missing
    if (file.lastModified) {
      const date = new Date(file.lastModified);
      return date.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    console.error('Failed to extract EXIF data:', error);
    // Fallback to file modification date
    if (file.lastModified) {
      const date = new Date(file.lastModified);
      return date.toISOString().split('T')[0];
    }
    return null;
  }
}
