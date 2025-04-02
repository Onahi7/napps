import { setMaintenanceMode } from '../actions/config-actions'

async function enableMaintenance() {
  try {
    const result = await setMaintenanceMode(true)
    if (result) {
      console.log('Maintenance mode enabled successfully')
    } else {
      console.error('Failed to enable maintenance mode')
    }
  } catch (error) {
    console.error('Error enabling maintenance mode:', error)
  }
}

enableMaintenance()