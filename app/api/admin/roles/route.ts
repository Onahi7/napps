import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isAdmin } from '@/lib/auth'
import { query, withTransaction } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Get roles with their permissions
    const result = await query(`
      SELECT 
        r.id,
        r.name,
        COALESCE(
          ARRAY_AGG(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL),
          '{}'
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY r.id, r.name
      ORDER BY r.name
    `)

    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { roleId, permissions } = await request.json()

    // Validate input
    if (!roleId || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      // Remove existing permissions
      await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId]
      )

      // Add new permissions
      if (permissions.length > 0) {
        const values = permissions.map((p: string, i: number) => `($1, $${i + 2})`).join(',')
        const params = [roleId, ...permissions]
        
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${values}
        `, params)
      }
    })

    // Revalidate paths
    revalidatePath('/admin/settings')
    revalidatePath('/admin/users')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating role permissions:', error)
    return NextResponse.json(
      { error: 'Failed to update role permissions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { name, permissions } = await request.json()

    // Validate input
    if (!name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      )
    }

    const result = await withTransaction(async (client) => {
      // Create new role
      const roleResult = await client.query(
        'INSERT INTO roles (name) VALUES ($1) RETURNING id',
        [name]
      )
      const roleId = roleResult.rows[0].id

      // Add permissions if provided
      if (permissions && permissions.length > 0) {
        const values = permissions.map((p: string, i: number) => `($1, $${i + 2})`).join(',')
        const params = [roleId, ...permissions]
        
        await client.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${values}
        `, params)
      }

      return roleId
    })

    // Revalidate paths
    revalidatePath('/admin/settings')
    revalidatePath('/admin/users')

    return NextResponse.json({ id: result })
  } catch (error: any) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin access
    const admin = await isAdmin(session.user.id)
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const { roleId } = await request.json()

    // Validate input
    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      )
    }

    await withTransaction(async (client) => {
      // Remove role permissions
      await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId]
      )

      // Remove role
      await client.query(
        'DELETE FROM roles WHERE id = $1',
        [roleId]
      )
    })

    // Revalidate paths
    revalidatePath('/admin/settings')
    revalidatePath('/admin/users')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}