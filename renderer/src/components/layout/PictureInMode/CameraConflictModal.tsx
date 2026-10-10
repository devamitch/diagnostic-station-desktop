'use client';

import Dialog from '@/components/layout/Modal/Dialog';
import { AlertTriangle, ExternalLink, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import styles from './CameraConflictModal.module.css';

interface CameraConflictModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const CameraConflictModal: React.FC<CameraConflictModalProps> = ({ isOpen, onClose }) => {
	const router = useRouter();
	const [isWindows, setIsWindows] = useState(false);
	const [isWindows11, setIsWindows11] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const checkPlatform = async () => {
			// Check if running in Electron
			if (typeof window !== 'undefined' && window.ipc?.getWindowsVersion) {
				try {
					const versionInfo = await window.ipc.getWindowsVersion();
					setIsWindows(versionInfo.isWindows);
					setIsWindows11(versionInfo.isWindows11 || false);
				} catch (error) {
					console.error('[CameraConflict] Failed to check Windows version:', error);
				}
			} else {
				// Fallback for web: detect platform from navigator
				const platform = navigator.platform.toLowerCase();
				setIsWindows(platform.includes('win'));
			}
		};

		if (isOpen) {
			checkPlatform();
		}
	}, [isOpen]);

	const openCameraSettings = async () => {
		setLoading(true);
		try {
			// Check if running in Electron
			if (typeof window !== 'undefined' && window.ipc?.openCameraSettings) {
				const result = await window.ipc.openCameraSettings();
				if (result.success) {
					console.log('[CameraConflict] ✅ Camera settings opened');
				} else {
					console.error('[CameraConflict] ❌ Failed to open settings:', result.error);
				}
			} else if (isWindows) {
				// For web/browser: try to open Windows settings directly
				window.location.href = 'ms-settings:camera';
			}
		} catch (error) {
			console.error('[CameraConflict] Error opening camera settings:', error);
		} finally {
			setLoading(false);
		}
	};

	const openFullGuide = async () => {
		onClose();
		const url = 'https://eye-scan.AuraCoremedical.com/en/errors/camera-conflicts';
		if (typeof window !== 'undefined' && window.ipc?.openExternal) {
			try {
				await window.ipc.openExternal(url);
			} catch (error) {
				console.error('[CameraConflict] Failed to open help article:', error);
				window.open(url, '_blank', 'noopener,noreferrer');
			}
		} else {
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	};

	return (
		<Dialog isOpen={isOpen} onClose={onClose}>
			<div className={styles.conflictContainer}>
				{/* Close Button */}

				{/* Header */}
				<div className={styles.iconSection}>
					<AlertTriangle className={styles.warningIcon} size={48} />
				</div>

				<div className={styles.contentSection}>
					<h1 className={styles.title}>Camera Conflict Detected</h1>

					<p className={styles.description}>
						Another application is currently using your camera, preventing oLo from
						accessing it for eye health monitoring.
					</p>

					{/* Windows 11 Solution */}
					{isWindows && isWindows11 && (
						<div className={styles.solutionBox}>
							<h3 className={styles.solutionTitle}>
								✨ Windows 11 Solution Available
							</h3>
							<p className={styles.solutionText}>
								Enable multi-app camera support to use your camera in multiple
								applications simultaneously—perfect for running oLo alongside video
								meetings!
							</p>
						</div>
					)}

					{/* Quick Fix Steps */}
					<div className={styles.stepsSection}>
						<h3>Quick Fix Steps:</h3>
						{isWindows && isWindows11 ? (
							<>
								<ol className={styles.stepsList}>
									<li>
										Click <strong>"Open Camera Settings"</strong> below
									</li>
									<li>
										Navigate to:{' '}
										<strong>
											Bluetooth & devices › Cameras › [Your Camera]
										</strong>
									</li>
									<li>
										On that page, look for{' '}
										<strong>Advanced camera settings</strong> and click on{' '}
										<strong>Edit</strong>
									</li>
									<li>
										Toggle ON:{' '}
										<strong>
											"Allow multiple apps to use camera at the same time"
										</strong>
									</li>
									<li>
										Click <strong>"Apply"</strong> to save changes
									</li>
									<li>Restart oLo to apply the new settings</li>
								</ol>
								<div className={styles.noteBox}>
									<p>
										<strong>Note:</strong> Requires Windows 11 Insider Preview
										Build 26120.2702 or later. Check Windows Update if you don't
										see this option.
									</p>
								</div>
							</>
						) : isWindows ? (
							<>
								<ol className={styles.stepsList}>
									<li>
										Close other applications using the camera (Teams, Zoom,
										etc.)
									</li>
									<li>Restart oLo</li>
									<li>If issue persists, restart your computer</li>
									<li>
										Consider updating to Windows 11 for multi-app camera support
									</li>
								</ol>
							</>
						) : (
							<>
								<ol className={styles.stepsList}>
									<li>Close other applications using the camera</li>
									<li>Restart oLo</li>
									<li>Check your system's camera permissions</li>
									<li>If issue persists, restart your device</li>
								</ol>
							</>
						)}
					</div>

					{/* Why This Matters */}
					<div className={styles.infoSection}>
						<h3>Why Multi-App Camera Support Matters:</h3>
						<ul className={styles.benefitsList}>
							<li>
								<strong>Uninterrupted Monitoring:</strong> Keep tracking eye health
								during video calls
							</li>
							<li>
								<strong>Better Productivity:</strong> No need to switch between apps
								or disable tracking
							</li>
							<li>
								<strong>Professional Use:</strong> Perfect for remote workers,
								developers, and office professionals
							</li>
						</ul>
					</div>

					{/* Common Issues */}
					{isWindows && isWindows11 && (
						<div className={styles.troubleshootSection}>
							<h3>Common Issues:</h3>
							<div className={styles.troubleItem}>
								<strong>Can't find the setting?</strong>
								<p>
									Update to Windows 11 Build 26120.2702+ via Settings › Windows
									Update
								</p>
							</div>
							<div className={styles.troubleItem}>
								<strong>Setting enabled but still conflicts?</strong>
								<p>
									Restart both oLo and the other camera app. Check camera
									permissions in Privacy settings.
								</p>
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className={styles.actions}>
						{isWindows && (
							<button
								className={styles.primaryButton}
								onClick={openCameraSettings}
								disabled={loading}
							>
								<Settings size={16} />
								{loading ? 'Opening...' : 'Open Camera Settings'}
							</button>
						)}

						<button className={styles.secondaryButton} onClick={openFullGuide}>
							<ExternalLink size={16} />
							View Complete Guide
						</button>

						<button className={styles.closeButton} onClick={onClose}>
							Close
						</button>
					</div>
				</div>
			</div>
		</Dialog>
	);
};

export default CameraConflictModal;
