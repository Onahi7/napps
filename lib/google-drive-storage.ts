import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export class GoogleDriveStorageError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'GoogleDriveStorageError';
  }
}

export class GoogleDriveStorage {
  private static instance: GoogleDriveStorage;
  private drive: any;
  private folderId: string | null = null;

  private constructor() {
    try {
      const credentials = JSON.parse(
        process.env.GOOGLE_DRIVE_CREDENTIALS || 
        '{}'
      );

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;

      if (!this.folderId) {
        console.warn('[GoogleDriveStorage] No folder ID specified, files will be uploaded to the root directory');
      }

      console.log('[GoogleDriveStorage] Initialized successfully');
    } catch (error: any) {
      console.error('[GoogleDriveStorage] Initialization error:', error);
      throw new GoogleDriveStorageError('Failed to initialize Google Drive storage', error);
    }
  }

  public static getInstance(): GoogleDriveStorage {
    if (!GoogleDriveStorage.instance) {
      GoogleDriveStorage.instance = new GoogleDriveStorage();
    }
    return GoogleDriveStorage.instance;
  }

  /**
   * Create a folder in Google Drive if it doesn't exist
   */
  async ensureFolder(folderName: string): Promise<string> {
    try {
      // Check if folder exists
      const response = await this.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Create folder if it doesn't exist
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: this.folderId ? [this.folderId] : undefined
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error: any) {
      console.error('[GoogleDriveStorage] Error ensuring folder:', error);
      throw new GoogleDriveStorageError('Failed to create folder', error);
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(file: Buffer, originalName: string, mimeType: string): Promise<string> {
    try {
      // Generate a unique filename
      const fileName = `${uuidv4()}-${originalName}`;
      
      // Create temporary file
      const tempFilePath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tempFilePath, file);
      
      // Ensure payment-proofs folder exists
      const folderId = await this.ensureFolder('payment-proofs');

      // Upload file to Google Drive
      const fileMetadata = {
        name: fileName,
        parents: [folderId]
      };

      const media = {
        mimeType,
        body: fs.createReadStream(tempFilePath)
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      // Make file publicly accessible
      await this.drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      // Return the direct file URL
      return response.data.webContentLink;
    } catch (error: any) {
      console.error('[GoogleDriveStorage] Upload error:', error);
      throw new GoogleDriveStorageError('Failed to upload file to Google Drive', error);
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file ID from URL
      const fileId = this.getFileIdFromUrl(fileUrl);
      
      if (!fileId) {
        throw new GoogleDriveStorageError('Invalid file URL');
      }

      await this.drive.files.delete({
        fileId: fileId
      });

      console.log('[GoogleDriveStorage] File deleted successfully:', fileId);
    } catch (error: any) {
      console.error('[GoogleDriveStorage] Delete error:', error);
      // Don't throw on delete errors, just log them
      console.warn('[GoogleDriveStorage] Failed to delete file:', fileUrl);
    }
  }

  /**
   * Extract file ID from a Google Drive URL
   */
  private getFileIdFromUrl(url: string): string | null {
    // Handle webContentLink format: https://drive.google.com/uc?id=FILE_ID&export=download
    const contentMatch = url.match(/[?&]id=([^&]+)/);
    if (contentMatch && contentMatch[1]) {
      return contentMatch[1];
    }

    // Handle webViewLink format: https://drive.google.com/file/d/FILE_ID/view
    const viewMatch = url.match(/\/file\/d\/([^/]+)/);
    if (viewMatch && viewMatch[1]) {
      return viewMatch[1];
    }

    // Handle direct ID
    if (url.match(/^[a-zA-Z0-9_-]{25,}$/)) {
      return url;
    }

    return null;
  }
}