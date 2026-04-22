import { watch } from 'node:fs'
import { spawn } from 'node:child_process'
import { join, resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '../../..')
const migrationsDir = join(projectRoot, 'infra', 'db', 'migrations')

let running = false
let pending = false
let debounceTimer

function runMigrations() {
  if (running) {
    pending = true
    return
  }

  running = true
  const child = spawn('node', ['./apps/web-nuxt/scripts/run-migrations.mjs'], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
  })

  child.on('exit', () => {
    running = false
    if (pending) {
      pending = false
      runMigrations()
    }
  })
}

function scheduleRun(reason) {
  if (debounceTimer)
    clearTimeout(debounceTimer)

  debounceTimer = setTimeout(() => {
    console.log(`[db:watch:sql] ${reason}`)
    runMigrations()
  }, 300)
}

console.log(`[db:watch:sql] Watching ${migrationsDir}`)
runMigrations()

watch(migrationsDir, { persistent: true }, (eventType, filename) => {
  if (!filename || !filename.endsWith('.sql'))
    return
  scheduleRun(`Migration change detected (${eventType} ${filename})`)
})
