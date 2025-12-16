import { rmSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const DEFAULT_DIST = '.next-local'
const isVercel = process.env.VERCEL === '1' || process.env.CI === 'true'

function spawnNext(distDir) {
  // On Vercel/CI, do not override distDir; let Next use default '.next'
  const env = isVercel
    ? { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }
    : { ...process.env, NEXT_DIST_DIR: distDir, NEXT_TELEMETRY_DISABLED: '1' }
  const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next')
  const child = spawn(process.argv[0], [nextBin, 'build'], {
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

if (isVercel) {
  // Use default .next on Vercel; no Windows EPERM issues there.
  spawnNext('.next')
} else {
  const dist = process.env.NEXT_DIST_DIR || DEFAULT_DIST
  const tracePath = join(process.cwd(), dist, 'trace')
  ensureDir(join(process.cwd(), dist))
  try {
    // Clean previous trace folder to avoid EPERM on Windows (must be recursive)
    rmSync(tracePath, { force: true, recursive: true })
    spawnNext(dist)
  } catch (err) {
    // If EPERM/EBUSY, rotate dist directory to avoid locked file
    const code = err && (err.code || '').toString().toUpperCase()
    if (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES') {
      const rotated = `${DEFAULT_DIST}-${Date.now()}`
      ensureDir(join(process.cwd(), rotated))
      console.warn(`[build] trace locked (${code}). Rotating distDir to ${rotated}`)
      spawnNext(rotated)
    } else {
      console.warn('[build] Unexpected error removing trace:', err?.message || err)
      spawnNext(dist)
    }
  }
}
