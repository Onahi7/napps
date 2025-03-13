import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

export class MigrationManager {
  private pool: Pool
  private migrationsDir: string

  constructor(pool: Pool, migrationsDir: string) {
    this.pool = pool
    this.migrationsDir = migrationsDir
  }

  async initialize() {
    // Create migrations table if it doesn't exist
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT name FROM migrations ORDER BY id'
    )
    return result.rows.map(row => row.name)
  }

  async getMigrationFiles(): Promise<string[]> {
    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
  }

  async applyMigration(fileName: string): Promise<void> {
    const filePath = path.join(this.migrationsDir, fileName)
    const sql = fs.readFileSync(filePath, 'utf8')

    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      // Apply migration
      await client.query(sql)

      // Record migration
      await client.query(
        'INSERT INTO migrations (name) VALUES ($1)',
        [fileName]
      )

      await client.query('COMMIT')
      console.log(`Applied migration: ${fileName}`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async migrate(): Promise<void> {
    await this.initialize()

    const applied = await this.getAppliedMigrations()
    const files = await this.getMigrationFiles()

    for (const file of files) {
      if (!applied.includes(file)) {
        await this.applyMigration(file)
      }
    }
  }

  async rollback(steps: number = 1): Promise<void> {
    const applied = await this.getAppliedMigrations()
    const toRollback = applied.slice(-steps)

    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')

      for (const migration of toRollback) {
        const filePath = path.join(
          this.migrationsDir,
          migration.replace('.sql', '.down.sql')
        )

        if (fs.existsSync(filePath)) {
          const sql = fs.readFileSync(filePath, 'utf8')
          await client.query(sql)
          await client.query(
            'DELETE FROM migrations WHERE name = $1',
            [migration]
          )
          console.log(`Rolled back migration: ${migration}`)
        }
      }

      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}