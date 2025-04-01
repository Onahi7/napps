import { v2 as cloudinary } from 'cloudinary'

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

  private constructor() {}

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
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          allowed_formats: allowedFormats,
          transformation
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as CloudinaryUploadResult)
        }
      )

      uploadStream.end(file)
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
  const service = CloudinaryService.getInstance()
  return service.uploadFile(file, options)
}