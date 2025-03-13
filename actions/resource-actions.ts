'use server'

import { query } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { revalidatePath } from 'next/cache'

export async function getResources(includePrivate: boolean = false) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const sql = includePrivate 
    ? 'SELECT * FROM resources ORDER BY created_at DESC'
    : 'SELECT * FROM resources WHERE is_public = true ORDER BY created_at DESC'

  const result = await query(sql)
  return result.rows
}

export async function createResource(data: {
  title: string
  description?: string
  file_url: string
  type?: string
  is_public?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const result = await query(
    `INSERT INTO resources (title, description, file_url, type, is_public)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      data.title,
      data.description,
      data.file_url,
      data.type || 'document',
      data.is_public || false
    ]
  )

  revalidatePath('/admin/resources')
  revalidatePath('/participant/resources')
  return result.rows[0].id
}

export async function updateResource(resourceId: string, data: {
  title?: string
  description?: string
  file_url?: string
  type?: string
  is_public?: boolean
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const fields = Object.keys(data)
  const values = Object.values(data)
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ')

  await query(
    `UPDATE resources 
     SET ${setClause}, updated_at = NOW()
     WHERE id = $1`,
    [resourceId, ...values]
  )

  revalidatePath('/admin/resources')
  revalidatePath('/participant/resources')
  return { success: true }
}

export async function deleteResource(resourceId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  await query(
    'DELETE FROM resources WHERE id = $1',
    [resourceId]
  )

  revalidatePath('/admin/resources')
  revalidatePath('/participant/resources')
  return { success: true }
}

export async function getResourceStats() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Unauthorized')

  const stats = await query(`
    SELECT
      COUNT(*) as total_resources,
      COUNT(CASE WHEN is_public = true THEN 1 END) as public_resources,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent_resources
    FROM resources
  `)

  return stats.rows[0]
}

