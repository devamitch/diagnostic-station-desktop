import { useCallback, useRef, useState } from 'react';
import { useBackgroundTracking } from './useBackgroundTracking';

export interface CameraOptions {
	width?: { ideal: number };
	height?: { ideal: number };
	focusMode?: string;
	frameRate?: { ideal: number };
}

export interface CameraHookReturn {
	mediaStream: MediaStream | null;
	startCamera: (options?: CameraOptions) => Promise<MediaStream | null>;
	stopCamera: () => void;
	isCameraActive: boolean;
	cameraError: string | null;
	videoRef: React.RefObject<HTMLVideoElement>;
	mediaStreamRef: React.RefObject<MediaStream | null>;
	attachToVideo: (videoElement: HTMLVideoElement, stream: MediaStream) => Promise<void>;
}

export const useCamera = (setCameraConflictWarning?: (v: boolean) => void) => {
	const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
	const [isCameraActive, setIsCameraActive] = useState(false);
	const [cameraError, setCameraError] = useState<string | null>(null);

	const mediaStreamRef = useRef<MediaStream | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const { acquireWakeLock, releaseWakeLock, keepMediaAlive, stopMediaKeepAlive } =
		useBackgroundTracking();
	const stopCamera = useCallback(() => {
		const stream = (videoRef.current?.srcObject as MediaStream) || null;
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}

		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		// setMediaStream(null);
		// mediaStreamRef.current = null;
		// setIsCameraActive(false);

		releaseWakeLock();
		stopMediaKeepAlive();
	}, [releaseWakeLock, stopMediaKeepAlive]);

	const startCamera = useCallback(
		async (options: CameraOptions = {}): Promise<MediaStream | null> => {
			try {
				console.log('[Camera] Requesting camera access...');

				const constraints: MediaStreamConstraints = {
					video: {
						width:
							process.platform === 'win32'
								? { ideal: 640 }
								: options.width || { ideal: 640 },

						height:
							process.platform === 'win32'
								? { ideal: 480 }
								: options.height || { ideal: 480 },

						facingMode: 'user',
						frameRate: options.frameRate || { ideal: 1.7 },
					},
					audio: false,
				};

				const stream = await navigator.mediaDevices.getUserMedia(constraints);

				// Track Monitoring + Persistence
				stream.getTracks().forEach((track) => {
					track.enabled = true;

					track.onended = () => {
						console.warn('[Camera] ⚠️ Track ended → Camera conflict detected');
						setCameraConflictWarning?.(true);
						stopCamera(); // gracefully handle
					};

					track.onmute = () => console.warn('[Camera] Track muted');
					track.onunmute = () => console.log('[Camera] Track unmuted');

					// Windows: keep track alive
					const interval = setInterval(() => {
						if (track.readyState === 'live') {
							track.enabled = true;
						} else {
							clearInterval(interval);
						}
					}, 1000);
				});

				setMediaStream(stream);
				mediaStreamRef.current = stream;
				setIsCameraActive(true);
				setCameraError(null);

				// Attach to video element
				if (!videoRef.current) throw new Error('Video element not available');

				videoRef.current.srcObject = stream;

				await new Promise<void>((resolve, reject) => {
					if (!videoRef.current) return reject(new Error('Video ref lost'));

					videoRef.current.onloadedmetadata = () => resolve();
					videoRef.current.onerror = () => reject(new Error('Video load error'));

					setTimeout(() => reject(new Error('Video load timeout')), 10000);
				});

				acquireWakeLock();
				await videoRef.current.play();
				keepMediaAlive(stream);

				console.log('[Camera] ✅ Camera started successfully');
				return stream;
			} catch (error: any) {
				console.error('[Camera] ❌ Camera error:', error);

				let msg = 'Failed to access camera';
				if (error.name === 'NotAllowedError') msg = 'Camera permission denied';
				else if (error.name === 'NotFoundError') msg = 'No camera found';
				else if (error.name === 'NotReadableError') {
					msg = 'Camera is in use by another application';
					setCameraConflictWarning?.(true);
				} else if (error.name === 'OverconstrainedError')
					msg = 'Camera constraints not supported';

				setCameraError(msg);
				setIsCameraActive(false);

				return null;
			}
		},
		[acquireWakeLock, keepMediaAlive, setCameraConflictWarning, stopCamera]
	);

	const attachToVideo = useCallback(
		async (videoElement: HTMLVideoElement, stream: MediaStream) => {
			videoRef.current = videoElement;
			videoElement.srcObject = stream;

			await new Promise<void>((resolve) => {
				if (!videoElement) return resolve();
				videoElement.onloadedmetadata = () => resolve();
			});

			await videoElement.play();
		},
		[]
	);

	return {
		mediaStream,
		startCamera,
		stopCamera,
		attachToVideo,
		isCameraActive,
		cameraError,
		videoRef,
		mediaStreamRef,
		setMediaStream,
	};
};
