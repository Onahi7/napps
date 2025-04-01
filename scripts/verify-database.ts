import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  }
});

async function verifyDatabase() {
  try {
    // Check if tables exist
    console.log('\nChecking database tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Existing tables:');
    console.log(tables.rows.map(r => r.table_name).join('\n'));

    // Check config values
    console.log('\nChecking configuration values...');
    const config = await pool.query('SELECT key, value FROM config');
    console.log('Configuration values:');
    console.log(JSON.stringify(config.rows, null, 2));

    // Check if extensions are installed
    console.log('\nChecking installed extensions...');
    const extensions = await pool.query(`
      SELECT extname 
      FROM pg_extension;
    `);
    console.log('Installed extensions:');
    console.log(extensions.rows.map(r => r.extname).join('\n'));

    // Check users table structure
    console.log('\nChecking users table structure...');
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `);
    console.log('Users table columns:');
    console.log(JSON.stringify(userColumns.rows, null, 2));

    // Check profiles table structure
    console.log('\nChecking profiles table structure...');
    const profileColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles';
    `);
    console.log('Profiles table columns:');
    console.log(JSON.stringify(profileColumns.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyDatabase();