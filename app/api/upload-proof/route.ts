import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { StorageService } from '@/lib/storage'
import { withTransaction, query } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image (JPG/PNG) or PDF' },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `payment-proofs/${session.user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Check payment status
    const result = await query(
      'SELECT p.payment_status FROM profiles p WHERE p.id = $1',
      [session.user.id]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (result.rows[0].payment_status === 'completed') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 })
    }

    try {
      const storage = StorageService.getInstance()
      const fileUrl = await storage.uploadFile(buffer, fileName, file.type)

      await withTransaction(async (client) => {
        // Delete old payment proof if exists
        const oldProof = await client.query(
          'SELECT payment_proof FROM profiles WHERE id = $1',
          [session.user.id]
        )
        
        if (oldProof.rows[0]?.payment_proof) {
          try {
            await storage.deleteFile(oldProof.rows[0].payment_proof)
          } catch (error) {
            console.error('Failed to delete old payment proof:', error)
          }
        }

        await client.query(
          `UPDATE profiles 
           SET payment_proof = $1,
               payment_status = 'proof_submitted',
               updated_at = NOW()
           WHERE id = $2`,
          [fileUrl, session.user.id]
        )
      })

      revalidatePath('/payment')
      revalidatePath('/participant/dashboard')
      revalidatePath('/admin/payments')

      return NextResponse.json({ success: true, url: fileUrl })
    } catch (storageError: any) {
      console.error('Storage error:', storageError)
      if (storageError.name === 'CredentialsProviderError') {
        return NextResponse.json(
          { error: 'Storage configuration issue. Please contact support.' },
          { status: 500 }
        )
      } else if (storageError.name === 'NoSuchBucket') {
        return NextResponse.json(
          { error: 'Storage bucket not found. Please contact support.' },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to upload file. Please try again.' },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}