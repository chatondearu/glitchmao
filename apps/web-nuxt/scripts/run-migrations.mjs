import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required to run SQL migrations.')
  process.exit(1)
}

const projectRoot = resolve(import.meta.dirname, '../../..')
const migrationsDir = join(projectRoot, 'infra', 'db', 'migrations')

const migrationFiles = (await readdir(migrationsDir))
  .filter(file => file.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b))

if (!migrationFiles.length) {
  console.log('No SQL migrations found.')
  process.exit(0)
}

const sql = postgres(databaseUrl, { prepare: false })

try {
  let lastAppliedMigration = ''
  for (const file of migrationFiles) {
    const fullPath = join(migrationsDir, file)
    const content = await readFile(fullPath, 'utf8')
    console.log(`Applying migration: ${file}`)
    await sql.unsafe(content)
    lastAppliedMigration = file
  }

  console.log('SQL migrations applied successfully.')
  console.log(`Schema version: ${lastAppliedMigration} (${migrationFiles.length} SQL files)`)
}
catch (error) {
  const message = error instanceof Error ? error.message : JSON.stringify(error)
  console.error(`Migration failed: ${message}`)
  if (error && typeof error === 'object')
    console.error(error)
  process.exitCode = 1
}
finally {
  await sql.end({ timeout: 5 })
}
