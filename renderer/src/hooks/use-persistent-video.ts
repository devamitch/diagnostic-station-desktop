// hooks/use-persistent-video.ts
'use client';

import { useEffect, useRef } from 'react';

export function usePersistentVideo() {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		// Save video state before navigation
		const handleBeforeUnload = () => {
			if (video.src) {
				localStorage.setItem(
					'persistentVideo',
					JSON.stringify({
						src: video.src,
						currentTime: video.currentTime,
						paused: video.paused,
					})
				);
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Restore video state after navigation
		const savedVideo = localStorage.getItem('persistentVideo');
		if (savedVideo) {
			const { src, currentTime, paused } = JSON.parse(savedVideo);
			video.src = src;
			video.currentTime = currentTime;
			if (!paused) {
				video.play();
			}
			localStorage.removeItem('persistentVideo');
		}

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, []);

	return videoRef;
}
