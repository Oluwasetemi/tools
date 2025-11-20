import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'
import { config } from 'dotenv'

// Load .env file explicitly for server-side code
config()

// Lazy initialization to ensure env variables are loaded
let _db: ReturnType<typeof drizzle> | null = null

export const getDb = () => {
  if (_db) return _db

  const connectionString = process.env.VITE_DATABASE_URL

  if (!connectionString) {
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
    throw new Error('VITE_DATABASE_URL environment variable is not set')
  }

  const pool = new Pool({
    connectionString,
  })

  _db = drizzle(pool, { schema })
  return _db
}

// Export a getter that initializes on first use
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const dbInstance = getDb()
    return (dbInstance as any)[prop]
  }
})
