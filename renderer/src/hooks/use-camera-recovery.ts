import { useCallback, useRef } from 'react';

export interface CameraRecoveryHook {
  isRecovering: boolean;
  handleCameraDisconnection: () => Promise<void>;
  monitorCameraHealth: () => void;
  cleanup: () => void;
}

export const useCameraRecovery = ({
  isTrackingActive,
  setCameraConflictWarning,
  startCamera,
  videoRef,
  mediaStreamRef,
  setMediaStream,
  notify
}: {
  isTrackingActive: boolean;
  setCameraConflictWarning: (v: boolean) => void;
  startCamera: () => Promise<MediaStream | null>;
  videoRef: React.RefObject<HTMLVideoElement|null>;
  mediaStreamRef: React.RefObject<MediaStream | null>;
  setMediaStream: (s: MediaStream | null) => void;
  notify: (...args: any[]) => Promise<void>;
}): CameraRecoveryHook => {

  const isRecoveringRef = useRef(false);
  const lastRecoveryTimeRef = useRef(Date.now());
  const recoveryAttemptsRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);

  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===========================================================================
  //   CAMERA DISCONNECTION HANDLER
  // ===========================================================================
  const handleCameraDisconnection = useCallback(async () => {
    if (!isTrackingActive) return;

    if (isRecoveringRef.current) {
      console.log('[Camera] Already recovering, skipping...');
      return;
    }

    const now = Date.now();
    const timeSinceLastRecovery = now - lastRecoveryTimeRef.current;

    // WINDOWS-SPECIFIC FREQUENT RECOVERY CHECK
    if (process.platform === 'win32' && timeSinceLastRecovery < 5000) {
      recoveryAttemptsRef.current++;

      if (recoveryAttemptsRef.current >= 3) {
        console.warn('[Camera] ⚠️ Frequent recovery attempts - camera conflict');
        // setCameraConflictWarning(true);

        await notify(
          'Another app is using the camera. Eye tracking may be interrupted.',
          'error',
          { persistent: false, sound: true }
        );
      }
    } else {
      recoveryAttemptsRef.current = 0;
    }

    isRecoveringRef.current = true;
    lastRecoveryTimeRef.current = now;

    console.log('[Camera] 🔄 Starting camera recovery...');

    await notify('Camera reconnecting...', 'info', { persistent: false });

    try {
      // STOP EXISTING STREAM CLEANLY
      if (mediaStreamRef.current) {
        console.log('[Camera] Stopping existing tracks...');
        mediaStreamRef.current.getTracks().forEach((t) => {
          t.stop();
          t.enabled = false;
        });

        if (videoRef.current) videoRef.current.srcObject = null;

        mediaStreamRef.current = null;
        setMediaStream(null);
      }

      // CANCEL RAF
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }

      // WAIT FOR CAMERA RELEASE
      const waitTime = process.platform === 'win32' ? 3000 : 1000;
      console.log(`[Camera] Waiting ${waitTime}ms for hardware release...`);
      await new Promise((res) => setTimeout(res, waitTime));

      // RETRY WITH EXPONENTIAL BACKOFF
      let retries = 0;
      const maxRetries = process.platform === 'win32' ? 5 : 3;
      let newStream: MediaStream | null = null;

      while (retries < maxRetries && !newStream) {
        try {
          console.log(`[Camera] Attempt ${retries + 1}/${maxRetries}...`);
          newStream = await startCamera();

          if (newStream) {
            console.log('[Camera] ✅ Camera restarted successfully');
            break;
          }
        } catch (err: any) {
          retries++;
          console.log(`[Camera] ❌ Attempt ${retries} failed:`, err?.message);

          const delay = Math.min(
            1000 * Math.pow(2, retries) + Math.random() * 500,
            10000
          );

          await new Promise((res) => setTimeout(res, delay));
        }
      }

      if (!newStream) {
        throw new Error('Failed to restart camera after max retries');
      }

      // SUCCESS
      mediaStreamRef.current = newStream;
      setMediaStream(newStream);
      setCameraConflictWarning(false);

      recoveryAttemptsRef.current = 0;

      await notify('Eye tracking resumed successfully', 'success', {
        persistent: false,
        sound: true
      });

    } catch (err) {
      console.error('[Camera] ❌ Recovery failed:', err);

      await notify(
        'Close other apps using the camera to resume tracking',
        'error',
        { persistent: true, sound: true, urgency: 'critical' }
      );

      // WINDOWS: RETRY AGAIN LATER
      if (
        process.platform === 'win32' &&
        recoveryAttemptsRef.current < 10 &&
        isTrackingActive
      ) {
        retryTimerRef.current = setTimeout(() => {
          console.log('[Camera] 🔄 Retrying recovery in 10s...');
          isRecoveringRef.current = false;
          handleCameraDisconnection();
        }, 10000);
      }
    } finally {
      isRecoveringRef.current = false;
    }
  }, [
    isTrackingActive,
    startCamera,
    videoRef,
    mediaStreamRef,
    setMediaStream,
    notify,
    setCameraConflictWarning
  ]);

  // ===========================================================================
  //   CAMERA HEALTH MONITORING
  // ===========================================================================
  const monitorCameraHealth = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    if (videoTrack.readyState === 'ended') {
      console.error('[Camera] Track ended - attempting recovery');
      // setCameraConflictWarning(true);
      handleCameraDisconnection();
    }

    if (videoTrack.muted) {
      console.warn('[Camera] Track muted - potential conflict');
    }
  }, [handleCameraDisconnection,mediaStreamRef]);

  // ===========================================================================
  //   CLEANUP
  // ===========================================================================
  const cleanup = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  return {
    isRecovering: isRecoveringRef.current,
    handleCameraDisconnection,
    monitorCameraHealth,
    cleanup
  };
};
