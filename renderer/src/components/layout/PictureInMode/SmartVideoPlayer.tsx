'use client';

import { usePathname } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';

interface SmartVideoPlayerProps {
	src: string;
	className?: string;
}

export function SmartVideoPlayer({ src, className }: SmartVideoPlayerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const pathname = usePathname();
	const [shouldPreserve, setShouldPreserve] = useState(false);

	useEffect(() => {
		// Check if we should preserve video across this route change
		const preserveRoutes = ['/video', '/watch']; // Add routes where video should persist
		setShouldPreserve(preserveRoutes.some((route) => pathname.includes(route)));
	}, [pathname]);

	useEffect(() => {
		const video = videoRef.current;
		if (!video || !shouldPreserve) return;

		// Save state before route change
		return () => {
			if (video.src && !video.paused) {
				// Store video state globally
				(window as any).persistentVideoState = {
					src: video.src,
					currentTime: video.currentTime,
					volume: video.volume,
					muted: video.muted,
				};
			}
		};
	}, [shouldPreserve]);

	useEffect(() => {
		const video = videoRef.current;
		const savedState = (window as any).persistentVideoState;

		if (video && savedState && savedState.src === src && shouldPreserve) {
			video.currentTime = savedState.currentTime;
			video.volume = savedState.volume;
			video.muted = savedState.muted;
			video.play().catch(console.error);

			// Clean up
			delete (window as any).persistentVideoState;
		}
	}, [src, shouldPreserve]);

	return (
		<video
			ref={videoRef}
			src={src}
			controls
			onEnded={() => {
				// Clean up when video ends
				if ((window as any).persistentVideoState?.src === src) {
					delete (window as any).persistentVideoState;
				}
			}}
		/>
	);
}
