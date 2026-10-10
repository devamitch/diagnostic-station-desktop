'use client';

import EyeScanModal from '@/components/dashboard/EyeScanModal/EyeScanModal';
import useTranslationData from '@/hooks/use-translation-data';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { Eye, PlayCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import styles from './livepage.module.css';

const LiveDashboard = () => {
	const { metrics, isActive, cameraReady } = useEyeTrackingContext();
	const { livePageText } = useTranslationData();
	const [isEyeScanModalOpen, setIsEyeScanModalOpen] = useState(false);

	const handleOpenEyeScan = useCallback(() => {
		setIsEyeScanModalOpen(true);
	}, []);

	const handleCloseEyeScan = useCallback(() => {
		setIsEyeScanModalOpen(false);
	}, []);

	return (
		<div className={styles.container} style={{ flex: 1 }}>
			<div className={styles.heroSection}>
				<div className={styles.welcomeText}>
					<h1>{livePageText.hero.title}</h1>
					<p>{livePageText.hero.subtitle}</p>
				</div>

				<div className={styles.eyeScanSection}>
					<div className={styles.scanPrompt}>
						<div className={styles.scanIcon}>
							<Eye size={48} />
						</div>
						<h3>{livePageText.eyeScan.title}</h3>
						<p>{livePageText.eyeScan.subtitle}</p>
						<button
							onClick={handleOpenEyeScan}
							className={styles.startButton}
							disabled={!cameraReady && !isActive}
						>
							<PlayCircle size={20} />
							{livePageText.eyeScan.startButton}
						</button>
					</div>
				</div>
			</div>

			<EyeScanModal
				isOpen={isEyeScanModalOpen}
				onClose={handleCloseEyeScan}
				currentMetrics={metrics}
			/>
		</div>
	);
};

export default LiveDashboard;
