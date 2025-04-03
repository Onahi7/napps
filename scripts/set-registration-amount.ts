import { updateConfig } from '../lib/config-service'

async function setRegistrationAmount() {
  try {
    const result = await updateConfig('registrationAmount', 20000)
    if (result.success) {
      console.log('Registration amount set successfully')
    } else {
      console.error('Failed to set registration amount:', result.error)
    }
  } catch (error) {
    console.error('Error setting registration amount:', error)
  }
}

setRegistrationAmount()