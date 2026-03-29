import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** ESM shim for __dirname. Pass import.meta.url from the calling module. */
export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl))
}
