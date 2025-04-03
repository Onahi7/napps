import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setRegistrationAmount() {
  try {
    await prisma.config.upsert({
      where: { key: 'registrationAmount' },
      update: {
        value: '20000',
        description: 'Conference registration fee amount',
        updatedAt: new Date()
      },
      create: {
        key: 'registrationAmount',
        value: '20000',
        description: 'Conference registration fee amount'
      }
    })
    console.log('Registration amount set successfully')
  } catch (error) {
    console.error('Error setting registration amount:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setRegistrationAmount()