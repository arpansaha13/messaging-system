import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { poll } from './poll'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../../')
const composeFile = path.join(repoRoot, 'compose.test.yaml')
const envFile = path.join(repoRoot, 'tests/resilience/.env.test')

function runCompose(args: string[], stdio: 'inherit' | 'pipe' = 'inherit'): void {
  const result = spawnSync(
    'docker',
    ['compose', '--env-file', envFile, '-f', composeFile, '--profile', 'resilience', ...args],
    {
      stdio,
      encoding: 'utf-8',
    },
  )
  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr : ''
    throw new Error(`docker compose ${args.join(' ')} failed: ${stderr}`)
  }
}

function runDocker(args: string[], stdio: 'inherit' | 'pipe' = 'inherit'): void {
  const result = spawnSync('docker', args, {
    stdio,
    encoding: 'utf-8',
  })
  if (result.status !== 0) {
    const stderr = typeof result.stderr === 'string' ? result.stderr : ''
    throw new Error(`docker ${args.join(' ')} failed: ${stderr}`)
  }
}

export function upResilience(): void {
  runCompose(['up', '-d', '--remove-orphans'])
}

export function downResilience(): void {
  runCompose(['down', '-v', '--remove-orphans'])
}

export function stopService(service: string): void {
  runDocker(['stop', toContainerName(service)])
}

export function startService(service: string): void {
  runDocker(['start', toContainerName(service)])
}

export async function waitServiceHealthy(containerName: string, timeoutMs = 120_000): Promise<void> {
  await poll(
    () => getContainerHealth(containerName),
    (status) => status === 'healthy' || status === 'running',
    { timeoutMs, intervalMs: 2_000, description: `${containerName} healthy` },
  )
}

function getContainerHealth(containerName: string): string {
  const result = spawnSync('docker', ['inspect', '-f', '{{json .State}}', containerName], {
    encoding: 'utf-8',
  })
  if (result.status !== 0) {
    throw new Error(`docker inspect failed for ${containerName}: ${result.stderr}`)
  }

  const rawState = String(result.stdout).trim()
  if (!rawState) {
    throw new Error(`docker inspect returned empty state for ${containerName}`)
  }

  type DockerState = {
    Status?: string
    Health?: { Status?: string }
  }

  let state: DockerState
  try {
    state = JSON.parse(rawState) as DockerState
  } catch (err) {
    throw new Error(`failed to parse docker state for ${containerName}: ${String(err)}`)
  }

  if (state.Health?.Status) {
    return state.Health.Status
  }

  return state.Status ?? 'unknown'
}

function toContainerName(service: string): string {
  return `${service}_test`
}
