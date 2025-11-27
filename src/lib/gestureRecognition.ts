import type { Results } from '@mediapipe/hands'

export interface GestureResult {
  gesture: string
  confidence: number
  debugInfo?: string
}

// SIMPLIFIED & MORE ACCURATE gesture recognition
export function analyzeHandGesture(results: Results): GestureResult {
  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    return { gesture: 'none', confidence: 0, debugInfo: 'No hands detected' }
  }

  const landmarks = results.multiHandLandmarks[0]
  
  // Get key landmark points
  const wrist = landmarks[0]
  const thumbTip = landmarks[4]
  const thumbIp = landmarks[3]
  const indexTip = landmarks[8]
  const indexPip = landmarks[6]
  const middleTip = landmarks[12]
  const middlePip = landmarks[10]
  const ringTip = landmarks[16]
  const ringPip = landmarks[14]
  const pinkyTip = landmarks[20]
  const pinkyPip = landmarks[18]

  // Helper to check if finger is extended (simplified)
  const isExtended = (tip: typeof indexTip, pip: typeof indexPip): boolean => {
    return tip.y < pip.y - 0.02  // More strict for accuracy
  }

  const isThumbOut = (): boolean => {
    return Math.abs(thumbTip.x - wrist.x) > 0.08
  }

  // Count extended fingers
  const extendedFingers = [
    isExtended(indexTip, indexPip),
    isExtended(middleTip, middlePip),
    isExtended(ringTip, ringPip),
    isExtended(pinkyTip, pinkyPip)
  ]
  
  const extendedCount = extendedFingers.filter(Boolean).length
  const isThumbExtended = isThumbOut()

  console.log('🖐️ Gesture Detection:', {
    extendedCount,
    isThumbExtended,
    fingers: {
      index: extendedFingers[0],
      middle: extendedFingers[1],
      ring: extendedFingers[2],
      pinky: extendedFingers[3]
    }
  })

  // === CLEAR GESTURE PATTERNS (from most specific to general) ===

  // 1. THUMBS UP (yes) - thumb up, others closed
  if (thumbTip.y < wrist.y - 0.10 && extendedCount === 0) {
    return { gesture: 'thumbsup', confidence: 0.95, debugInfo: 'Thumbs up detected' }
  }

  // 2. THUMBS DOWN (no) - thumb down, others closed
  if (thumbTip.y > wrist.y + 0.10 && extendedCount === 0) {
    return { gesture: 'thumbsdown', confidence: 0.95, debugInfo: 'Thumbs down detected' }
  }

  // 3. PEACE SIGN (nice to meet you) - index & middle only
  if (extendedCount === 2 && extendedFingers[0] && extendedFingers[1] && !extendedFingers[2] && !extendedFingers[3]) {
    return { gesture: 'peace', confidence: 0.92, debugInfo: 'Peace sign detected' }
  }

  // 4. POINTING (please) - only index finger
  if (extendedCount === 1 && extendedFingers[0] && !extendedFingers[1] && !extendedFingers[2] && !extendedFingers[3]) {
    return { gesture: 'pointing', confidence: 0.90, debugInfo: 'Pointing detected' }
  }

  // 5. OK SIGN (thank you) - check circle between thumb and index
  const thumbIndexDist = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) + 
    Math.pow(thumbTip.y - indexTip.y, 2)
  )
  if (thumbIndexDist < 0.05 && extendedCount >= 2) {
    return { gesture: 'oksign', confidence: 0.90, debugInfo: 'OK sign detected' }
  }

  // 6. OPEN PALM (hello/stop) - all fingers extended
  if (extendedCount === 4 && isThumbExtended) {
    return { gesture: 'openpalm', confidence: 0.88, debugInfo: 'Open palm detected' }
  }

  // 7. THREE FINGERS (help/wait) - index, middle, ring
  if (extendedCount === 3 && extendedFingers[0] && extendedFingers[1] && extendedFingers[2]) {
    return { gesture: 'threefingers', confidence: 0.85, debugInfo: 'Three fingers detected' }
  }

  // 8. FIST (understand) - all fingers closed
  if (extendedCount === 0 && !isThumbExtended) {
    return { gesture: 'fist', confidence: 0.83, debugInfo: 'Fist detected' }
  }

  // 9. PINKY OUT (love) - only pinky extended
  if (extendedCount === 1 && !extendedFingers[0] && !extendedFingers[1] && !extendedFingers[2] && extendedFingers[3]) {
    return { gesture: 'pinkyout', confidence: 0.80, debugInfo: 'Pinky out detected' }
  }

  // 10. WAVE (goodbye) - open hand in motion (we'll detect as open palm variant)
  if (extendedCount >= 3 && !isThumbExtended) {
    return { gesture: 'wave', confidence: 0.75, debugInfo: 'Wave detected' }
  }

  return { gesture: 'unknown', confidence: 0.3, debugInfo: `Extended: ${extendedCount}, Thumb: ${isThumbExtended}` }
}

// SIMPLIFIED gesture to phrase mapping
export function getGesturePhrase(gesture: string): string {
  const gestureMap: Record<string, string> = {
    // Clear mappings
    'thumbsup': 'yes',
    'thumbsdown': 'no',
    'peace': 'nice',
    'pointing': 'please',
    'oksign': 'thankyou',
    'openpalm': 'hello',
    'threefingers': 'help',
    'fist': 'understand',
    'pinkyout': 'love',
    'wave': 'goodbye',
  }
  
  const result = gestureMap[gesture] || 'unknown'
  console.log('📝 Gesture Mapping:', gesture, '->', result)
  return result
}

// Analyze captured image
export async function analyzeGestureFromImage(imageUrl: string): Promise<GestureResult> {
  try {
    const { Hands } = await import('@mediapipe/hands')
    
    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    return new Promise((resolve) => {
      let resolved = false

      hands.onResults((results: Results) => {
        if (!resolved) {
          resolved = true
          const gestureResult = analyzeHandGesture(results)
          console.log('📸 Image Analysis Result:', gestureResult)
          hands.close()
          resolve(gestureResult)
        }
      })

      // Load image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        hands.send({ image: img }).catch(() => {
          if (!resolved) {
            resolved = true
            hands.close()
            resolve({ gesture: 'unknown', confidence: 0, debugInfo: 'Send failed' })
          }
        })
      }
      
      img.onerror = () => {
        if (!resolved) {
          resolved = true
          hands.close()
          resolve({ gesture: 'unknown', confidence: 0, debugInfo: 'Image load error' })
        }
      }
      
      img.src = imageUrl

      // Timeout
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          hands.close()
          resolve({ gesture: 'unknown', confidence: 0, debugInfo: 'Timeout' })
        }
      }, 5000)
    })
  } catch (error) {
    console.error('Gesture analysis error:', error)
    return { gesture: 'unknown', confidence: 0, debugInfo: 'Error' }
  }
}
