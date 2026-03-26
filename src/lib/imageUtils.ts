import ExifReader from 'exifreader';

/**
 * Compresses an image from a base64 string or File.
 * Returns a base64 string of the compressed image.
 */
export async function compressImage(
  source: string | File,
  maxWidth = 1080,
  quality = 0.85
): Promise<string> {
  // Build an object URL so Safari can decode any format it supports (incl. HEIC)
  let objectURL: string;
  let needsRevoke = false;
  if (source instanceof File) {
    objectURL = URL.createObjectURL(source);
    needsRevoke = true;
  } else {
    objectURL = source;
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    let done = false;

    // Safety timeout: if Safari never fires onload/onerror, reject after 12s
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      if (needsRevoke) URL.revokeObjectURL(objectURL);
      reject(new Error('Image load timeout'));
    }, 12000);

    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (needsRevoke) URL.revokeObjectURL(objectURL);

      let width = img.naturalWidth;
      let height = img.naturalHeight;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (needsRevoke) URL.revokeObjectURL(objectURL);
      reject(new Error('Failed to load image'));
    };

    img.src = objectURL;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  maxWidth = 1080,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      
      let targetWidth = pixelCrop.width;
      let targetHeight = pixelCrop.height;
      
      if (targetWidth > maxWidth) {
        targetHeight = (targetHeight * maxWidth) / targetWidth;
        targetWidth = maxWidth;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        targetWidth,
        targetHeight
      );

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = (e) => reject(e);
    image.src = imageSrc;
  });
}

/**
 * Extracts the shooting date from a File's EXIF data.
 * Returns a string in YYYY-MM-DD format, or null if not found.
 */
export async function extractPhotoDate(file: File): Promise<string | null> {
  try {
    // Only read the first 64KB — EXIF data is always at the start of the file
    const slice = file.slice(0, 64 * 1024);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ExifReader timeout')), 3000)
    );
    const tags = await Promise.race([ExifReader.load(slice), timeoutPromise]);
    
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
