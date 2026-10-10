'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './UpdateIndicator.module.css';

interface UpdateProgress {
	percent: number;
	transferred: number;
	total: number;
	bytesPerSecond: number;
}

interface UpdateInfo {
	version: string;
}

interface UpdateStatus {
	type: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
	message: string;
	progress?: UpdateProgress;
	info?: UpdateInfo;
	attempt?: number; // NEW
}

export default function UpdateIndicator() {
	const [status, setStatus] = useState<UpdateStatus | null>(null);
	const [visible, setVisible] = useState(false);
	const [currentVersion, setCurrentVersion] = useState<string>('');
	const [isManualChecking, setIsManualChecking] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	const formatBytes = useCallback((bytes: number): string => {
		if (!bytes) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
	}, []);

	const formatSpeed = useCallback(
		(bytesPerSecond: number) => `${formatBytes(bytesPerSecond)}/s`,
		[formatBytes]
	);

	useEffect(() => {
		if (!window?.ipc) return;

		window.ipc.getAppVersion?.().then((v) => {
			setCurrentVersion(v);
			console.log(`[UpdateIndicator] 🚀 Current version: v${v}`);
		});

		const unsub = window.ipc.onUpdateStatus((newStatus: UpdateStatus) => {
			console.log('[UpdateIndicator] 📥 Status update:', newStatus.type);

			if (newStatus.attempt) {
				console.log(`[UpdateIndicator] 📊 Check attempt #${newStatus.attempt}`);
			}

			setStatus(newStatus);
			setIsManualChecking(false);

			const shouldShow = ['checking', 'available', 'downloading', 'downloaded'].includes(
				newStatus.type
			);
			setVisible(shouldShow);

			// 🎉 Show confetti when update is downloaded
			if (newStatus.type === 'downloaded') {
				console.log('[UpdateIndicator] 🎉 Update downloaded! Showing confetti');
				setShowConfetti(true);
				setTimeout(() => setShowConfetti(false), 3000);
			}

			if (newStatus.type === 'not-available') {
				setTimeout(() => setVisible(false), 2500);
			}

			if (newStatus.type === 'error') {
				setTimeout(() => setVisible(false), 4000);
			}
		});

		return () => unsub?.();
	}, []);

	const installUpdate = useCallback(async () => {
		if (status?.type === 'downloaded' && window.ipc) {
			console.log('[UpdateIndicator] 🔄 User clicked install');
			await window.ipc.installUpdate?.();
		}
	}, [status]);

	const dismiss = useCallback(() => {
		console.log('[UpdateIndicator] ✕ User dismissed indicator');
		setVisible(false);
	}, []);

	const checkForUpdatesManually = useCallback(async () => {
		if (!window?.ipc || isManualChecking) return;

		console.log('[UpdateIndicator] 🔍 User manually checking for updates');
		setIsManualChecking(true);
		setVisible(true);
		setStatus({
			type: 'checking',
			message: 'Checking for updates...',
		});

		try {
			await window.ipc.checkForUpdatesManual?.();
		} catch (error) {
			console.error('[UpdateIndicator] ❌ Check failed:', error);
			setStatus({
				type: 'error',
				message: 'Failed to check for updates',
			});
			setIsManualChecking(false);
		}
	}, [isManualChecking]);

	const icon = useMemo(() => {
		switch (status?.type) {
			case 'checking':
				return (
					<div className={styles.updateSpinner}>
						<div className={styles.spinnerRing}></div>
					</div>
				);
			case 'available':
			case 'downloading':
				return (
					<svg
						className={`${styles.updateIcon} ${styles.download}`}
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M12 3v12m0 0l-4-4m4 4l4-4M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				);
			case 'downloaded':
				return (
					<svg
						className={`${styles.updateIcon} ${styles.success}`}
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				);
			case 'error':
				return (
					<svg
						className={`${styles.updateIcon} ${styles.error}`}
						viewBox="0 0 24 24"
						fill="none"
					>
						<path
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				);
			default:
				return null;
		}
	}, [status?.type]);

	const title = useMemo(() => {
		if (!status) return '';
		const { type, info, attempt } = status;
		const v = info?.version ? ` ${info.version}` : '';
		const attemptText = attempt && attempt > 1 ? ` (${attempt}/3)` : '';

		switch (type) {
			case 'checking':
				return `Checking for updates...${attemptText}`;
			case 'available':
				return `Update${v} available`;
			case 'downloading':
				return 'Downloading update...';
			case 'downloaded':
				return '🎉 Update ready!';
			case 'not-available':
				return "You're up to date!";
			case 'error':
				return 'Update check failed';
			default:
				return '';
		}
	}, [status]);

	if (!visible || !status) {
		return null;
	}

	const statusClass = status.type.replace('-', '');

	return (
		<>
			{showConfetti && <div className={styles.confetti}></div>}

			<div className={`${styles.updateIndicator} ${styles[statusClass]}`}>
				<div className={styles.updateContent}>
					<div className={styles.updateIconWrapper}>{icon}</div>

					<div className={styles.updateInfo}>
						<div className={styles.updateTitle}>{title}</div>

						{status.type === 'downloading' && status.progress && (
							<>
								<div className={styles.updateProgressWrapper}>
									<div className={styles.updateProgressBar}>
										<div
											className={styles.updateProgressFill}
											style={{ width: `${status.progress.percent}%` }}
										/>
									</div>
								</div>
								<div className={styles.updateProgressDetails}>
									<span className={styles.progressPercent}>
										{Math.round(status.progress.percent)}%
									</span>
									<span className={styles.progressSize}>
										{formatBytes(status.progress.transferred)} /{' '}
										{formatBytes(status.progress.total)}
									</span>
									<span className={styles.progressSpeed}>
										{formatSpeed(status.progress.bytesPerSecond)}
									</span>
								</div>
							</>
						)}

						{status.type === 'downloaded' && (
							<div className={styles.readyMessage}>Ready to install and restart</div>
						)}

						{status.type === 'not-available' && (
							<div className={styles.versionBadge}>v{currentVersion}</div>
						)}
					</div>

					<div className={styles.updateActions}>
						{status.type === 'downloaded' && (
							<button
								className={`${styles.updateBtn} ${styles.install}`}
								onClick={installUpdate}
							>
								Install Now
							</button>
						)}
						{['not-available', 'error'].includes(status.type) && (
							<button
								className={`${styles.updateBtn} ${styles.dismiss}`}
								onClick={dismiss}
							>
								✕
							</button>
						)}
					</div>
				</div>
			</div>
		</>
	);
}
