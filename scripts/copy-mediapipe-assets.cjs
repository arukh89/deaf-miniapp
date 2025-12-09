/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function copyFileSync(src, dest) {
  ensureDirSync(path.dirname(dest))
  fs.copyFileSync(src, dest)
  console.log(`[mediapipe] copied ${path.relative(process.cwd(), src)} -> ${path.relative(process.cwd(), dest)}`)
}

function safeCopy(src, dest) {
  try {
    copyFileSync(src, dest)
  } catch (e) {
    console.warn(`[mediapipe] WARN could not copy ${src}: ${e && e.message ? e.message : e}`)
  }
}

const ROOT = process.cwd()
const NM = path.join(ROOT, 'node_modules')

const files = [
  // hands core + assets (include both SIMD and non-SIMD variants for maximum compatibility)
  { src: path.join(NM, '@mediapipe', 'hands', 'hands.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands.js') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_packed_assets.data'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_packed_assets.data') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_packed_assets_loader.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_packed_assets_loader.js') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_simd_wasm_bin.wasm'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_simd_wasm_bin.wasm') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_simd_wasm_bin.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_simd_wasm_bin.js') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_wasm_bin.wasm'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_wasm_bin.wasm') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands_solution_wasm_bin.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands_solution_wasm_bin.js') },
  { src: path.join(NM, '@mediapipe', 'hands', 'hands.binarypb'), dest: path.join(ROOT, 'public', 'mediapipe', 'hands', 'hands.binarypb') },
  // drawing utils
  { src: path.join(NM, '@mediapipe', 'drawing_utils', 'drawing_utils.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'drawing_utils', 'drawing_utils.js') },
  // camera utils
  { src: path.join(NM, '@mediapipe', 'camera_utils', 'camera_utils.js'), dest: path.join(ROOT, 'public', 'mediapipe', 'camera_utils', 'camera_utils.js') },
]

console.log('[mediapipe] copying assets to public/mediapipe ...')
files.forEach(({ src, dest }) => safeCopy(src, dest))
console.log('[mediapipe] done')
