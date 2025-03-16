```javascript
// Old cluster connection
const sourcePool = new Pool({
  connectionString: process.env.OLD_DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// New cluster connection
const targetPool = new Pool({
  connectionString: process.env.NEW_DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// Define migration steps
const migrationSteps = [
  {
    name: 'Migrate users',
    query: 'SELECT * FROM users ORDER BY created_at',
    insertQuery: `
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `,
    columns: ['id', 'email', 'password_hash', 'created_at', 'updated_at']
  },
  {
    name: 'Migrate profiles',
    query: 'SELECT * FROM profiles ORDER BY created_at',
    insertQuery: `
      INSERT INTO profiles (
        id, email, full_name, phone, role, school_name, school_state,
        napps_chapter, payment_status, payment_reference, payment_amount,
        payment_date, payment_proof, accreditation_status, accreditation_date,
        qr_code, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO NOTHING
    `,
    columns: [
      'id',
      'email',
      'full_name',
      'phone',
      'role',
      'organization', // maps to school_name
      'state', // maps to school_state
      'chapter', // maps to napps_chapter
      'payment_status',
      'payment_reference',
      'payment_amount',
      'payment_date',
      'payment_proof',
      'accreditation_status',
      'accreditation_date',
      'qr_code',
      'created_at',
      'updated_at'
    ]
  },
  {
    name: 'Migrate config',
    query: 'SELECT * FROM config',
    insertQuery: `
      INSERT INTO config (id, key, value, description, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        description = EXCLUDED.description
    `,
    columns: ['id', 'key', 'value', 'description', 'created_at']
  },
  {
    name: 'Migrate hotels',
    query: 'SELECT * FROM hotels ORDER BY created_at',
    insertQuery: `
      INSERT INTO hotels (
        id, name, description, address, price_per_night,
        available_rooms, amenities, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `,
    columns: [
      'id',
      'name',
      'description',
      'address',
      'price_per_night',
      'available_rooms',
      'amenities',
      'created_at',
      'updated_at'
    ]
  },
  {
    name: 'Migrate bookings',
    query: 'SELECT * FROM bookings ORDER BY created_at',
    insertQuery: `
      INSERT INTO bookings (
        id, user_id, hotel_id, check_in_date, check_out_date,
        status, payment_reference, payment_status, total_amount,
        payment_proof, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `,
    columns: [
      'id',
      'user_id',
      'hotel_id',
      'check_in_date',
      'check_out_date',
      'status',
      'payment_reference',
      'payment_status',
      'total_amount',
      'payment_proof',
      'created_at',
      'updated_at'
    ]
  },
  {
    name: 'Migrate scans',
    query: 'SELECT * FROM scans ORDER BY created_at',
    insertQuery: `
      INSERT INTO scans (
        id, user_id, scanned_by, scan_type,
        location, notes, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `,
    columns: [
      'id',
      'user_id',
      'scanned_by',
      'scan_type',
      'location',
      'notes',
      'created_at'
    ]
  }
];

async function migrateData() {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    // Start transaction in target database
    await targetClient.query('BEGIN');

    console.log('Starting data migration...');

    // Perform migration steps
    for (const step of migrationSteps) {
      console.log(`Migrating ${step.name}...`);
      const data = await sourceClient.query(step.query);
      for (const row of data.rows) {
        const values = step.columns.map(column => row[column]);
        await targetClient.query(step.insertQuery, values);
      }
    }

    // Create accreditation records from profiles
    console.log('Creating accreditation records...');
    await targetClient.query(`
      INSERT INTO accreditations (
        id, user_id, status, accreditation_date,
        created_at, updated_at
      )
      SELECT 
        uuid_generate_v4(),
        id,
        accreditation_status,
        accreditation_date,
        created_at,
        updated_at
      FROM profiles
      WHERE accreditation_status IS NOT NULL
      ON CONFLICT (user_id) DO NOTHING
    `);

    // Commit transaction
    await targetClient.query('COMMIT');
    console.log('Migration completed successfully!');

    // Verify counts
    const counts = await verifyMigration(sourceClient, targetClient);
    console.log('Data verification:', counts);

  } catch (error) {
    await targetClient.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

async function verifyMigration(sourceClient: any, targetClient: any) {
  const tables = ['users', 'profiles', 'config', 'hotels', 'bookings', 'scans'];
  const counts: Record<string, { source: number; target: number }> = {};

  for (const table of tables) {
    const sourceCount = await sourceClient.query(`SELECT COUNT(*) FROM ${table}`);
    const targetCount = await targetClient.query(`SELECT COUNT(*) FROM ${table}`);
    counts[table] = {
      source: parseInt(sourceCount.rows[0].count),
      target: parseInt(targetCount.rows[0].count)
    };
  }

  return counts;
}

if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```import { Pool } from 'pg';

// Old cluster connection
const sourcePool = new Pool({
  connectionString: process.env.OLD_DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

// New cluster connection
const targetPool = new Pool({
  connectionString: process.env.NEW_DATABASE_URL,
  ssl: {
    rejectUnauthorized: true
  }
});

async function migrateData() {
  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();

  try {
    // Start transaction in target database
    await targetClient.query('BEGIN');

    console.log('Starting data migration...');

    // 1. Migrate users
    console.log('Migrating users...');
    const users = await sourceClient.query('SELECT * FROM users ORDER BY created_at');
    for (const user of users.rows) {
      await targetClient.query(
        `INSERT INTO users (id, email, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.password_hash, user.created_at, user.updated_at]
      );
    }

    // 2. Migrate profiles
    console.log('Migrating profiles...');
    const profiles = await sourceClient.query('SELECT * FROM profiles ORDER BY created_at');
    for (const profile of profiles.rows) {
      await targetClient.query(
        `INSERT INTO profiles (
          id, email, full_name, phone, role, school_name, school_state,
          napps_chapter, payment_status, payment_reference, payment_amount,
          payment_date, payment_proof, accreditation_status, accreditation_date,
          qr_code, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (id) DO NOTHING`,
        [
          profile.id,
          profile.email,
          profile.full_name,
          profile.phone,
          profile.role,
          profile.organization, // maps to school_name
          profile.state, // maps to school_state
          profile.chapter, // maps to napps_chapter
          profile.payment_status,
          profile.payment_reference,
          profile.payment_amount,
          profile.payment_date,
          profile.payment_proof,
          profile.accreditation_status,
          profile.accreditation_date,
          profile.qr_code,
          profile.created_at,
          profile.updated_at
        ]
      );
    }

    // 3. Migrate config
    console.log('Migrating configuration...');
    const config = await sourceClient.query('SELECT * FROM config');
    for (const conf of config.rows) {
      await targetClient.query(
        `INSERT INTO config (id, key, value, description, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           description = EXCLUDED.description`,
        [conf.id, conf.key, conf.value, conf.description, conf.created_at]
      );
    }

    // 4. Migrate hotels
    console.log('Migrating hotels...');
    const hotels = await sourceClient.query('SELECT * FROM hotels ORDER BY created_at');
    for (const hotel of hotels.rows) {
      await targetClient.query(
        `INSERT INTO hotels (
          id, name, description, address, price_per_night,
          available_rooms, amenities, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          hotel.id,
          hotel.name,
          hotel.description,
          hotel.address,
          hotel.price_per_night,
          hotel.available_rooms,
          hotel.amenities,
          hotel.created_at,
          hotel.updated_at
        ]
      );
    }

    // 5. Migrate bookings
    console.log('Migrating bookings...');
    const bookings = await sourceClient.query('SELECT * FROM bookings ORDER BY created_at');
    for (const booking of bookings.rows) {
      await targetClient.query(
        `INSERT INTO bookings (
          id, user_id, hotel_id, check_in_date, check_out_date,
          status, payment_reference, payment_status, total_amount,
          payment_proof, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING`,
        [
          booking.id,
          booking.user_id,
          booking.hotel_id,
          booking.check_in_date,
          booking.check_out_date,
          booking.status,
          booking.payment_reference,
          booking.payment_status,
          booking.total_amount,
          booking.payment_proof,
          booking.created_at,
          booking.updated_at
        ]
      );
    }

    // 6. Migrate scans
    console.log('Migrating scans...');
    const scans = await sourceClient.query('SELECT * FROM scans ORDER BY created_at');
    for (const scan of scans.rows) {
      await targetClient.query(
        `INSERT INTO scans (
          id, user_id, scanned_by, scan_type,
          location, notes, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING`,
        [
          scan.id,
          scan.user_id,
          scan.scanned_by,
          scan.scan_type,
          scan.location,
          scan.notes,
          scan.created_at
        ]
      );
    }

    // 7. Create accreditation records from profiles
    console.log('Creating accreditation records...');
    await targetClient.query(
      `INSERT INTO accreditations (
        id, user_id, status, accreditation_date,
        created_at, updated_at
      )
      SELECT 
        uuid_generate_v4(),
        id,
        accreditation_status,
        accreditation_date,
        created_at,
        updated_at
      FROM profiles
      WHERE accreditation_status IS NOT NULL
      ON CONFLICT (user_id) DO NOTHING`
    );

    // Commit transaction
    await targetClient.query('COMMIT');
    console.log('Migration completed successfully!');

    // Verify counts
    const counts = await verifyMigration(sourceClient, targetClient);
    console.log('Data verification:', counts);

  } catch (error) {
    await targetClient.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

async function verifyMigration(sourceClient: any, targetClient: any) {
  const tables = ['users', 'profiles', 'config', 'hotels', 'bookings', 'scans'];
  const counts: Record<string, { source: number; target: number }> = {};

  for (const table of tables) {
    const sourceCount = await sourceClient.query(`SELECT COUNT(*) FROM ${table}`);
    const targetCount = await targetClient.query(`SELECT COUNT(*) FROM ${table}`);
    counts[table] = {
      source: parseInt(sourceCount.rows[0].count),
      target: parseInt(targetCount.rows[0].count)
    };
  }

  return counts;
}

if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}