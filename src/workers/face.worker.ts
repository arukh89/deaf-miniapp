
// ESM Web Worker for on-device face expressions using MediaPipe Tasks Vision
// Receives ImageBitmap frames and returns blendshapes + simple events.

import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision'

type InitMessage = {
  type: 'INIT'
}

type FrameMessage = {
  type: 'FRAME'
  payload: { bitmap: ImageBitmap; ts: number }
}

type IncomingMessage = InitMessage | FrameMessage

type ReadyMessage = { type: 'READY' }
type ResultMessage = { type: 'RESULT'; payload: FaceLandmarkerResult & { events?: string[] } }
type ErrorMessage = { type: 'ERROR'; payload: string }

let landmarker: FaceLandmarker | null = null
let lastTs = 0

// Simple smoothing / hysteresis helpers for blendshapes
const emaState = new Map<string, number>()
const H_ALPHA = 0.6

function ema(name: string, x: number) {
  const prev = emaState.get(name) ?? x
  const y = H_ALPHA * x + (1 - H_ALPHA) * prev
  emaState.set(name, y)
  return y
}

// Minimal mapping rules for demo
function inferEvents(result: FaceLandmarkerResult): string[] {
  const ev: string[] = []
  if (!result.faceBlendshapes?.length) return ev
  const bs = result.faceBlendshapes[0]
  const map = new Map<string, number>()
  for (const c of bs.categories) map.set(c.categoryName, ema(c.categoryName, c.score))

  const get = (k: string) => map.get(k) ?? 0

  // Smile ? thankyou (more permissive)
  const smile = (get('mouthSmileLeft') + (get('mouthSmileRight'))) / 2
  const mouthOpen = get('jawOpen')
  if (smile > 0.5 && mouthOpen < 0.4) ev.push('thankyou')

  // Brow up ? please
  const browUp = (get('browInnerUp') + get('browOuterUpLeft') + get('browOuterUpRight')) / 3
  if (browUp > 0.45) ev.push('please')

  // Blink (both) ? repeat
  const blink = (get('eyeBlinkLeft') + get('eyeBlinkRight')) / 2
  if (blink > 0.6) ev.push('repeat')

  return ev
}

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  try {
    if (e.data.type === 'INIT') {
      if (!landmarker) {
        const files = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        )
        landmarker = await FaceLandmarker.createFromOptions(files, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          numFaces: 1,
        })
      }
      ;(self as any).postMessage({ type: 'READY' } as ReadyMessage)
      return
    }

    if (e.data.type === 'FRAME' && landmarker) {
      const { bitmap, ts } = e.data.payload
      try {
        const result = landmarker.detectForVideo(bitmap, ts)
        const events = inferEvents(result)
        ;(self as any).postMessage({ type: 'RESULT', payload: { ...result, events } } as ResultMessage)
      } finally {
        try { bitmap.close() } catch {}
        lastTs = ts
      }
      return
    }
  } catch (err: any) {
    ;(self as any).postMessage({ type: 'ERROR', payload: err?.message || 'Unknown error' } as ErrorMessage)
  }
}


