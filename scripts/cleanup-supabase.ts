import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function cleanupSupabase() {
  console.log('Starting Supabase cleanup...')
  // Files to remove
  const filesToRemove = [
    'lib/supabase.ts',
    'lib/supabase-browser.ts',
    'app/utils/supabase-server.ts',
    'app/utils/supabase-server-component.ts',
    'components/supabase-auth-provider.tsx',
    'supabase-setup.sql',
  ]
  // Remove files
  for (const file of filesToRemove) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Removed ${file}`)
    }
  }
  // Remove Supabase dependencies
  const packagesToRemove = [
    '@supabase/ssr',
    '@supabase/supabase-js',
    '@auth/supabase-adapter'
  ]
  try {
    await execAsync(`npm uninstall ${packagesToRemove.join(' ')}`)
    console.log('Removed Supabase dependencies')
  } catch (error) {
    console.error('Error removing dependencies:', error)
  }
  console.log('Cleanup completed')
}
cleanupSupabase().catch(console.error)