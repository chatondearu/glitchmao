import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (dbInstance)
    return dbInstance

  const config = useRuntimeConfig()
  if (!config.databaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'DATABASE_URL is not configured' })
  }

  const client = postgres(config.databaseUrl, { prepare: false })
  dbInstance = drizzle(client, { schema })

  return dbInstance
}
