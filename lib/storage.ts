// This file is deprecated as we are using Cloudinary for file storage.
// See cloudinary-service.ts for the active file storage implementation.

export class StorageError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'StorageError'
  }
}