import { useEffect, useRef, useCallback } from 'react'

// Landmarks index (MoveNet / BlazePose compatible)
export const LM = {
  MUÑECA_IZQ:  9,
  MUÑECA_DER:  10,
  CADERA_IZQ:  11,
  CADERA_DER:  12,
  RODILLA_IZQ: 13,
  RODILLA_DER: 14,
  TOBILLO_IZQ: 15,
  TOBILLO_DER: 16,
}

export type Keypoint = { x: number; y: number; score?: number }
export type PoseCallback = (keypoints: Keypoint[]) => void

/**
 * Hook que arranca la detección de poses con TensorFlow MoveNet.
 * Llama onPose() en cada frame con los keypoints normalizados [0,1].
 *
 * @param cameraRef  ref al componente CameraView de expo-camera
 * @param onPose     callback con keypoints
 * @param enabled    false pausa la detección
 */
export function usePoseDetection(
  cameraRef: React.RefObject<any>,
  onPose: PoseCallback,
  enabled = true,
) {
  const detectorRef  = useRef<any>(null)
  const rafRef       = useRef<number | null>(null)
  const onPoseRef    = useRef(onPose)
  onPoseRef.current  = onPose

  const loop = useCallback(async () => {
    if (!detectorRef.current || !cameraRef.current || !enabled) return
    try {
      const poses = await detectorRef.current.estimatePoses(cameraRef.current)
      if (poses?.[0]?.keypoints) {
        onPoseRef.current(poses[0].keypoints)
      }
    } catch { /* frame dropped */ }
    rafRef.current = requestAnimationFrame(loop)
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      return
    }

    let cancelled = false

    async function init() {
      try {
        const tf             = await import('@tensorflow/tfjs')
        const { setBackend } = tf
        await setBackend('rn-webgl')
        await tf.ready()

        const poseDetection = await import('@tensorflow-models/pose-detection')
        detectorRef.current = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
        )
        console.log('[PoseDetection] Detector listo')
        if (!cancelled) loop()
      } catch (e) {
        console.warn('[PoseDetection] Error al iniciar:', e)
      }
    }

    init()
    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled])
}
