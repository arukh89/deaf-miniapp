import { rmSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_DIST = '.next-local'

function spawnNext(distDir) {
  const env = { ...process.env, NEXT_DIST_DIR: distDir, NEXT_TELEMETRY_DISABLED: '1' }
  const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
  const child = spawn(process.argv[0], [nextBin, 'dev'], {
    stdio: 'inherit',
    env,
  })
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal)
    process.exit(code ?? 0)
  })
}

function ensureDir(dir) {
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  } catch {}
}

const dist = process.env.NEXT_DIST_DIR || DEFAULT_DIST
const tracePath = join(process.cwd(), dist, 'trace')

ensureDir(join(process.cwd(), dist))

try {
  // Clean previous trace to avoid EPERM on Windows if possible
  rmSync(tracePath, { force: true })
  spawnNext(dist)
} catch (err) {
  // If EPERM/EBUSY, rotate dist directory to avoid locked file
  const code = err && (err.code || '').toString().toUpperCase()
  if (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') {
    const rotated = `${DEFAULT_DIST}-${Date.now()}`
    ensureDir(join(process.cwd(), rotated))
    console.warn(`[dev] trace locked (${code}). Rotating distDir to ${rotated}`)
    spawnNext(rotated)
  } else {
    console.warn('[dev] Unexpected error removing trace:', err?.message || err)
    spawnNext(dist)
  }
}
