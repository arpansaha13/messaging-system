import mri from 'mri'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

/**
 * Run the npm scripts of server package
 *
 * ```bash
 * pnpm server <command>
 * ```
 */

if (!existsSync('packages/server')) {
  console.error("Could not find server package in 'packages' directory.")
  process.exit(1)
}

// Check whether the given command exists in server/package.json scripts
const validCommands = await import('../packages/server/package.json').then(
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

spawn('pnpm', [`-F ./packages/server ${cmd}`], {
  stdio: 'inherit',
  shell: true,
})
