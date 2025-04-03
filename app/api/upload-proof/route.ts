import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { PrismaClient } from '@prisma/client'
import { CloudinaryService, uploadToCloudinary } from '@/lib/cloudinary-service'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 })
    }

    // Get participant record first
    const participant = await prisma.participant.findFirst({
      where: { userId: session.user.id }
    })

    if (!participant) {
      return new NextResponse('Participant not found', { status: 404 })
    }

    // Delete old proof if exists
    if (participant.paymentProof) {
      const cloudinaryService = CloudinaryService.getInstance()
      const publicId = cloudinaryService.getPublicIdFromUrl(participant.paymentProof)
      if (publicId) {
        await cloudinaryService.deleteFile(publicId)
      }
    }

    // Upload new proof
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await uploadToCloudinary(buffer, {
      folder: 'payment_proofs',
      allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxSize: 5 * 1024 * 1024 // 5MB
    })

    // Update participant record with new proof URL
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        paymentProof: result.secure_url,
        paymentStatus: 'PROOF_SUBMITTED',
        paymentDate: new Date()
      }
    })

    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[UploadAPI] Error:', error)
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}