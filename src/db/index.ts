import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Lazy initialization to ensure env variables are loaded
let _db: ReturnType<typeof drizzle> | null = null

export const getDb = () => {
  if (_db) return _db

  // import.meta.env is injected by Vite for both client and SSR bundles;
  // process.env works in plain Node (e.g. scripts, tests).
  const connectionString
    = (import.meta.env?.VITE_DATABASE_URL as string | undefined)
    ?? process.env.VITE_DATABASE_URL

  if (!connectionString) {
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
  get(_target, prop) {
    const dbInstance = getDb()
    return (dbInstance as any)[prop]
  }
})
