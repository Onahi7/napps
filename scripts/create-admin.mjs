import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Create user and admin in a transaction
    const { user, admin } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: 'hardytechabuja@gmail.com',
          password: await hash('SUMMIT@2025', 12),
          fullName: 'Admin User',
          phone: '0000000000', // Placeholder phone number
          role: 'ADMIN'
        }
      })

      const admin = await tx.admin.create({
        data: {
          userId: user.id
        }
      })

      return { user, admin }
    })

    console.log('Admin user created successfully')
    console.log('Email:', user.email)
    console.log('Password: SUMMIT@2025')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()