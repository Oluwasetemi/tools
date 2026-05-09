import { neon } from '@neondatabase/serverless'

let client: ReturnType<typeof neon>

export async function getClient() {
  if (!process.env.VITE_DATABASE_URL) {
    return undefined
  }
  if (!client) {
    client = await neon(process.env.VITE_DATABASE_URL!)
  }
  return client
}

// Re-export the drizzle db instance so `@/db` resolves to both the neon raw
// client helper (getClient) and the drizzle ORM instance (db / getDb).
export { db, getDb } from './db/index'
