import path from 'node:path'
import fs from 'node:fs/promises'
import { getDirname } from './helpers/dirname'

const __dirname = getDirname(import.meta.url)

export default async function globalTeardown() {
  // Auth files are cleaned up here. The DB is wiped by `docker compose down -v`
  // which the run-e2e.sh script handles.
  const authDir = path.join(__dirname, '.auth')
  await fs.rm(authDir, { recursive: true, force: true })
  console.log('[global-teardown] Cleaned up .auth directory')
}
