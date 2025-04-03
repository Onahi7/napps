import { v2 as cloudinary } from 'cloudinary'

// Validate required environment variables
const requiredEnvVars = {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`)
}

// Initialize Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

export class CloudinaryService {
  private static instance: CloudinaryService

  private constructor() {
    // Validate configuration on instantiation
    if (!cloudinary.config().cloud_name) {
      throw new Error('Cloudinary configuration is missing or invalid')
    }
  }

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService()
    }
    return CloudinaryService.instance
  }

  async uploadFile(file: Buffer, options: {
    folder?: string
    allowedFormats?: string[]
    maxSize?: number // in bytes
    transformation?: any[]
  } = {}): Promise<CloudinaryUploadResult> {
    const {
      folder = 'payment-proofs',
      allowedFormats = ['jpg', 'jpeg', 'png', 'pdf'],
      maxSize = 5 * 1024 * 1024, // 5MB default
      transformation = []
    } = options

    return new Promise((resolve, reject) => {
      try {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            allowed_formats: allowedFormats,
            transformation
          },
          (error, result) => {
            if (error) {
              console.error('[CloudinaryService] Upload error:', error)
              reject(new Error(`Failed to upload to Cloudinary: ${error.message}`))
            } else if (!result) {
              reject(new Error('Upload failed: No result from Cloudinary'))
            } else {
              resolve(result as CloudinaryUploadResult)
            }
          }
        )

        uploadStream.end(file)
      } catch (error) {
        console.error('[CloudinaryService] Stream error:', error)
        reject(new Error(`Failed to initialize upload stream: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    })
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      return result.result === 'ok'
    } catch (error) {
      console.error('[CloudinaryService] Delete error:', error)
      return false
    }
  }

  getPublicIdFromUrl(url: string): string | null {
    if (!url.includes('cloudinary.com')) return null
    
    const urlParts = url.split('/')
    const fileNameWithExt = urlParts[urlParts.length - 1]
    const publicId = fileNameWithExt.split('.')[0]
    
    // If in a folder, include the folder path
    const folderPath = urlParts[urlParts.length - 2]
    return folderPath === 'upload' ? publicId : `${folderPath}/${publicId}`
  }
}

// Helper function for direct upload
export async function uploadToCloudinary(
  file: Buffer, 
  options: {
    folder?: string
    allowedFormats?: string[]
    maxSize?: number
    transformation?: any[]
  } = {}
): Promise<CloudinaryUploadResult> {
  try {
    const service = CloudinaryService.getInstance()
    return await service.uploadFile(file, options)
  } catch (error) {
    console.error('[CloudinaryService] Upload helper error:', error)
    throw error instanceof Error ? error : new Error('Failed to upload file to Cloudinary')
  }
}