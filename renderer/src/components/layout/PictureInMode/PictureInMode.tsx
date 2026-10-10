'use client';

import { useFullScreen } from '@/hooks/useFullScreen';
import { usePiPState } from '@/hooks/usePiPState';
import { useVideoSync } from '@/hooks/useVideoSync';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { usePiP } from '@/provider/PiPContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import CameraConflictModal from './CameraConflictModal';
import { ControlButtons } from './ControlButtons';
import { FullScreenClose } from './FullScreenClose';
import styles from './picturein.module.scss';
import { StatusIndicator } from './StatusIndicator';

const isElectron = typeof window !== 'undefined' && !!window.ipc;

const usePersistentMediaStream = (videoRef: React.RefObject<HTMLVideoElement>) => {
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const [isStreamPreserved, setIsStreamPreserved] = useState(false);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleLoadedMetadata = () => {
			if (video.srcObject) {
				mediaStreamRef.current = video.srcObject as MediaStream;
				setIsStreamPreserved(true);
				console.log('[MediaStream] Stream preserved across navigation');
			}
		};

		video.addEventListener('loadedmetadata', handleLoadedMetadata);

		if (isStreamPreserved && mediaStreamRef.current && !video.srcObject) {
			video.srcObject = mediaStreamRef.current;
			video.play().catch(console.error);
		}

		return () => {
			video.removeEventListener('loadedmetadata', handleLoadedMetadata);
		};
	}, [videoRef, isStreamPreserved]);

	return { mediaStreamRef, isStreamPreserved };
};

const PictureInMode = () => {
	const {
		videoRef,
		canvasRef,
		isActive,
		loading,
		startTracking,
		stopTracking,
		cameraConflictWarning, // ✅ Get conflict warning state
	} = useEyeTrackingContext();

	const { isPiPExpanded, setIsPiPExpanded, isFullScreen } = usePiP();
	const { isVideoReady, isHovered, updateState } = usePiPState();
	const { toggleFullScreen } = useFullScreen();

	const containerRef = useRef<HTMLDivElement>(null);
	const { mediaStreamRef } = usePersistentMediaStream(videoRef);
	const [showConflictModal, setShowConflictModal] = useState(false);

	useVideoSync(videoRef, canvasRef, isVideoReady);

	useEffect(() => {
		if (cameraConflictWarning) {
			setShowConflictModal(true);
		}
	}, [cameraConflictWarning]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		const handleLoadedMetadata = () => {
			if (video.srcObject) {
				mediaStreamRef.current = video.srcObject as MediaStream;

				if (mediaStreamRef.current) {
					mediaStreamRef.current.getTracks().forEach((track) => {
						if (track.kind === 'video') {
							track.enabled = true;
							const constraints = {
								frameRate: { ideal: 30, max: 60 },
								width: { ideal: 1280, max: 1920 },
								height: { ideal: 720, max: 1080 },
							};

							try {
								(track as any).applyConstraints(constraints);
							} catch (e) {
								console.log('Could not apply constraints:', e);
							}
						}
					});
				}
			}
		};

		video.addEventListener('loadedmetadata', handleLoadedMetadata);
		return () => {
			video.removeEventListener('loadedmetadata', handleLoadedMetadata);
		};
	}, [mediaStreamRef, videoRef]);

	const enhancedStartTracking = useCallback(async () => {
		console.log('[Tracking] Starting with background support');
		await startTracking();
	}, [startTracking]);

	const enhancedStopTracking = useCallback(async () => {
		stopTracking();
	}, [stopTracking]);

	const handleToggleTracking = useCallback(async () => {
		if (isActive) {
			await enhancedStopTracking();
		} else {
			try {
				await enhancedStartTracking();
			} catch (err) {
				console.error('Failed to start tracking:', err);
				updateState({ error: 'Failed to start tracking' });
			}
		}
	}, [isActive, enhancedStartTracking, enhancedStopTracking, updateState]);

	const handleToggleFullScreen = async () => {
		await toggleFullScreen(containerRef.current);
	};

	const handleToggleExpanded = () => {
		setIsPiPExpanded(!isPiPExpanded);
	};

	const handleMouseEnter = () => updateState({ isHovered: true });
	const handleMouseLeave = () => updateState({ isHovered: false });
	const [isInPiPMode, setIsInPiPMode] = useState(false);

	const exitPiPMode = useCallback(async (): Promise<boolean> => {
		try {
			if (isElectron && window.ipc) {
				await window.ipc.closePiPWindow();
			}
			setIsInPiPMode(false);
			return true;
		} catch (error) {
			console.error('Failed to exit PiP mode:', error);
			return false;
		}
	}, []);

	const enterPiPMode = useCallback(async (): Promise<boolean> => {
		if (!isElectron || !window.ipc || !mediaStreamRef.current || isInPiPMode || !isActive) {
			return false;
		}

		try {
			console.log('🎬 Starting Electron PiP with WebRTC...');

			const result = await window.ipc.createPiPWindow({
				width: 200,
				height: 150,
			});

			if (!result.success) {
				throw new Error(result.error || 'Failed to create PiP window');
			}

			console.log('✅ PiP window created, setting up WebRTC...');
			setIsInPiPMode(true);
			console.log('✅ PiP mode activated with live video stream');
			return true;
		} catch (error) {
			console.error('❌ Failed to enter PiP mode:', error);
			return false;
		}
	}, [mediaStreamRef, isInPiPMode, isActive]);

	const handleTogglePiP = useCallback(async () => {
		if (isInPiPMode) {
			await exitPiPMode();
		} else {
			await enterPiPMode();
		}
	}, [isInPiPMode, exitPiPMode, enterPiPMode]);

	return (
		<div
			ref={containerRef}
			className={`${styles.cameraContainer} ${
				isPiPExpanded ? styles.expanded : styles.collapsed
			} ${isFullScreen ? styles.fullscreen : ''}
			${cameraConflictWarning ? styles.cameraConflict : ''} 
			`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<div className={styles.glassEffect}>
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					className={styles.video}
					onLoadedData={() => updateState({ isVideoReady: true })}
					onError={() => updateState({ isVideoReady: false })}
					disablePictureInPicture={false}
				/>

				<canvas
					ref={canvasRef}
					className={styles.canvas}
					style={{
						display: 'none',
						opacity: isActive ? 1 : 0,
						transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
					}}
				/>

				<ControlButtons
					isActive={isActive}
					isExpanded={isPiPExpanded}
					isFullScreen={isFullScreen}
					isHovered={isHovered}
					isInPiPMode={false}
					onToggleTracking={handleToggleTracking}
					onToggleExpanded={handleToggleExpanded}
					onToggleFullScreen={handleToggleFullScreen}
					onTogglePiP={handleTogglePiP}
				/>

				<StatusIndicator
					isActive={isActive}
					isExpanded={isPiPExpanded}
					isFullScreen={isFullScreen}
					isInPiPMode={false}
					isAutoPiP={false}
					cameraConflict={cameraConflictWarning} // ✅ Correct prop name
				/>

				<FullScreenClose isFullScreen={isFullScreen} onClose={handleToggleFullScreen} />
			</div>
			<CameraConflictModal
				isOpen={showConflictModal}
				onClose={() => setShowConflictModal(false)}
			/>
		</div>
	);
};

export default PictureInMode;
