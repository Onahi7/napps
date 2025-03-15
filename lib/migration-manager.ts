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
    const client = await this.pool.connect()
    try {
      // Create migrations table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } finally {
      client.release()
    }
  }

  async getAppliedMigrations(): Promise<string[]> {
    const { rows } = await this.pool.query(
      'SELECT name FROM migrations ORDER BY applied_at'
    )
    return rows.map(row => row.name)
  }

  async getMigrationFiles(): Promise<string[]> {
    // Get all SQL files that don't end with .down.sql
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql') && !file.endsWith('.down.sql'))
      .sort() // Sort alphabetically so they run in order
    return files
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
    } catch (err: unknown) {
      const error = err as Error;
      await client.query('ROLLBACK')
      console.error(`Migration failed: ${fileName}`, error);
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
    } catch (err: unknown) {
      const error = err as Error;
      await client.query('ROLLBACK')
      console.error('Rollback failed:', error);
      throw error
    } finally {
      client.release()
    }
  }
}