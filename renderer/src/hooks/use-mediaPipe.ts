import { useCallback, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@/utils/mediapipe';
import { EYE_TRACKING_CONSTANTS } from '@/constants/eye-tracking';

export interface MediaPipeHookReturn {
  faceLandmarker: FaceLandmarker | null;
  isInitialized: boolean;
  initializeFaceLandmarker: () => Promise<boolean>;
  error: string | null;
  faceLandmarkerRef: React.RefObject<FaceLandmarker | null>;
}

export const useMediaPipe = () => {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  const initializeFaceLandmarker = useCallback(async (): Promise<boolean> => {
    try {
      let vision;
      let landmarker;

      try {
        vision = await FilesetResolver.forVisionTasks(
          EYE_TRACKING_CONSTANTS.PATHS.MEDIAPIPE.WASM
        );
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: EYE_TRACKING_CONSTANTS.PATHS.MEDIAPIPE.MODEL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
      } catch (localError) {
        console.warn('Local files failed, falling back to CDN:', localError);
        vision = await FilesetResolver.forVisionTasks(
          EYE_TRACKING_CONSTANTS.PATHS.FALLBACK.WASM
        );
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: EYE_TRACKING_CONSTANTS.PATHS.FALLBACK.MODEL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
      }

      setFaceLandmarker(landmarker);
      faceLandmarkerRef.current = landmarker;
      setIsInitialized(true);
      setError(null);
      return true;
    } catch (error) {
      console.error('Failed to initialize face landmarker:', error);
      setError(EYE_TRACKING_CONSTANTS.ERROR.INIT);
      setIsInitialized(false);
      return false;
    }
  }, []);

  return {
    faceLandmarker,
    isInitialized,
    initializeFaceLandmarker,
    error,
    faceLandmarkerRef,
  };
};