import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Utilities for handling file URLs
 */
export const fileUtils = {
  /**
   * Extract file name from a URL
   */
  getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove leading slash and potential 'uploads/' prefix
      const fullPath = urlObj.pathname.substring(1);
      return fullPath.replace(/^uploads\//, '');
    } catch {
      // If URL parsing fails, try to extract filename from the last part
      const parts = url.split('/');
      return parts[parts.length - 1];
    }
  },

  /**
   * Check if a file is an image
   */
  isImage(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  },

  /**
   * Check if a file is a PDF
   */
  isPdf(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  },

  /**
   * Get file extension from filename or URL
   */
  getExtension(fileNameOrUrl: string): string {
    const fileName = this.getFileNameFromUrl(fileNameOrUrl);
    return fileName.split('.').pop()?.toLowerCase() || '';
  },

  /**
   * Generate a file name for upload
   */
  generateFileName(originalName: string, prefix: string = 'uploads'): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = this.getExtension(originalName);
    const sanitizedName = originalName
      .split('.')[0]
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .toLowerCase();
    return `${prefix}/${timestamp}-${randomString}-${sanitizedName}.${extension}`;
  }
};
