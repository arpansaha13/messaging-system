import mri from 'mri'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

/**
 * Run the npm scripts of client package
 *
 * ```bash
 * pnpm client <command>
 * ```
 */

if (!existsSync('apps/client')) {
  console.error("Could not find client package in 'apps' directory.")
  process.exit(1)
}

// Check whether the given command exists in client/package.json scripts
const validCommands = await import('../apps/client/package.json').then(
  (pkg) => Object.keys(pkg.scripts),
)

const args = mri(process.argv)
args._.splice(0, 2)

if (args._.length > 1) {
  console.warn('More than one command found. Only first command will be run.')
}

const cmd = args._[0] as string

if (!validCommands.includes(cmd)) {
  console.error(`Invalid command "${cmd}".`)
  process.exit(1)
}

spawn('pnpm', [`-F ./apps/client ${cmd}`], {
  stdio: 'inherit',
  shell: true,
})
