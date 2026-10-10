// components/StatusIndicator.tsx
import styles from './picturein.module.scss';

interface StatusIndicatorProps {
	isActive: boolean;
	isExpanded: boolean;
	isFullScreen: boolean;
	isInPiPMode: boolean;
	isAutoPiP?: boolean;
	cameraConflict?: boolean; // ✅ Changed from cameraConflictWarning
}

export const StatusIndicator = ({
	isActive,
	isExpanded,
	isFullScreen,
	isInPiPMode,
	isAutoPiP = false,
	cameraConflict = false, // ✅ Changed from cameraConflictWarning
}: StatusIndicatorProps) => {
	// ✅ Determine status text based on priority
	const getStatusText = () => {
		if (cameraConflict) return 'Camera Conflict';
		if (isInPiPMode) return isAutoPiP ? 'Auto PiP' : 'PiP Mode';
		return isActive ? 'Tracking' : 'Paused';
	};

	// ✅ Determine dot class based on priority
	const getDotClass = () => {
		if (cameraConflict) return styles.conflict; // Red dot for conflict
		if (isInPiPMode) return styles.pipMode; // Gold dot for PiP
		return isActive ? styles.active : ''; // Green dot for active, red for paused
	};

	return (
		<div className={styles.statusIndicator}>
			<div className={`${styles.statusDot} ${getDotClass()}`} />
			{(isExpanded || isFullScreen) && (
				<span className={styles.statusText}>{getStatusText()}</span>
			)}
		</div>
	);
};
