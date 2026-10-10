'use client';

import type React from 'react';

import { useEffect, useRef } from 'react';
import styles from './camscreen.module.css';

interface CamScreenProps {
	oldVideoRef: React.RefObject<HTMLVideoElement | null>;
	oldCanvasRef: React.RefObject<HTMLCanvasElement | null>;
	isActive: boolean;
}

export const CamScreen: React.FC<CamScreenProps> = ({ oldVideoRef, oldCanvasRef, isActive }) => {
	const newVideoRef = useRef<HTMLVideoElement | null>(null);
	const newCanvasRef = useRef<HTMLCanvasElement | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const lastFrameTimeRef = useRef<number>(0);
	const targetFPS = 30; // Limit to 30fps for smoother performance

	useEffect(() => {
		const video = newVideoRef.current;
		const oldVideo = oldVideoRef.current;

		if (!video || !oldVideo?.srcObject) return;

		// Set the video source
		video.srcObject = oldVideo.srcObject;
		mediaStreamRef.current = oldVideo.srcObject as MediaStream;

		const handleLoadedMetadata = () => {
			if (mediaStreamRef.current) {
				mediaStreamRef.current.getTracks().forEach((track) => {
					if (track.kind === 'video') {
						track.enabled = true;
						const constraints = {
							frameRate: { ideal: 30, max: 30 },
							width: { ideal: 1280, max: 1280 },
							height: { ideal: 720, max: 720 },
						};

						try {
							(track as any).applyConstraints(constraints);
						} catch (e) {
							console.log('Could not apply constraints:', e);
						}
					}
				});
			}
		};

		video.addEventListener('loadedmetadata', handleLoadedMetadata);

		// Trigger if already loaded
		if (video.readyState >= 1) {
			handleLoadedMetadata();
		}

		return () => {
			video.removeEventListener('loadedmetadata', handleLoadedMetadata);
		};
	}, [oldVideoRef]);

	useEffect(() => {
		const video = newVideoRef.current;
		const canvas = newCanvasRef.current;
		const oldCanvas = oldCanvasRef.current;

		if (!isActive || !canvas || !oldCanvas || !video) return;

		// Set canvas dimensions to match video resolution for crisp rendering
		const updateCanvasSize = () => {
			if (video.videoWidth && video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			}
		};

		updateCanvasSize();
		video.addEventListener('loadedmetadata', updateCanvasSize);

		const ctx = canvas.getContext('2d', {
			alpha: false,
			desynchronized: true,
			willReadFrequently: false,
		});

		if (!ctx) return;

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'medium'; // Changed from "high" to "medium" for better performance

		const drawCanvas = (currentTime: number) => {
			const elapsed = currentTime - lastFrameTimeRef.current;
			const targetInterval = 1000 / targetFPS;

			// Only render if enough time has passed
			if (elapsed >= targetInterval) {
				lastFrameTimeRef.current = currentTime - (elapsed % targetInterval);

				if (canvas.width > 0 && canvas.height > 0) {
					ctx.drawImage(oldCanvas, 0, 0, canvas.width, canvas.height);
				}
			}

			animationFrameRef.current = requestAnimationFrame(drawCanvas);
		};

		animationFrameRef.current = requestAnimationFrame(drawCanvas);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			video.removeEventListener('loadedmetadata', updateCanvasSize);
		};
	}, [isActive, oldCanvasRef]);

	return (
		<div className={styles.container}>
			<div className={styles.cameraContainer}>
				<video
					ref={newVideoRef}
					autoPlay
					playsInline
					muted
					className={styles.video}
					disablePictureInPicture={false}
					preload="auto"
				/>
				<canvas
					ref={newCanvasRef}
					className={styles.canvas}
					style={{ display: isActive ? 'block' : 'none' }}
				/>
			</div>
		</div>
	);
};

export default CamScreen;
