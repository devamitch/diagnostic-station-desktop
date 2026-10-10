'use client';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import useTranslationData from '@/hooks/use-translation-data';
import { memo } from 'react';
import styles from './reporthistoryskeleton.module.css';

const ChartSkeleton = memo(() => {
	return (
		<div className={styles.chartSkeletonContainer}>
			<div className={styles.chartSkeletonHeader}>
				<div className={styles.skeletonTitle}></div>
				<div className={styles.skeletonLastUpdate}></div>
			</div>
			<div className={styles.chartSkeletonBody}>
				<div className={styles.skeletonYAxis}>
					{[...Array(5)].map((_, i) => (
						<div key={i} className={styles.skeletonYAxisLabel}></div>
					))}
				</div>
				<div className={styles.skeletonBars}>
					{[...Array(8)].map((_, i) => (
						<div key={i} className={styles.skeletonBarWrapper}>
							<div
								className={styles.skeletonBar}
								style={{
									height: `${Math.random() * 60 + 40}%`,
								}}
							></div>
							<div className={styles.skeletonXAxisLabel}></div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
});
ChartSkeleton.displayName = 'ChartSkeleton';

function ReportHistorySkeleton() {
	const { dashboardPageText } = useTranslationData();

	return (
		<div className={styles.reportHistorySkeleton}>
			<div className={styles.header}>
				<TitleHeader title={dashboardPageText.eyeScanReportTitle} />
			</div>

			<div className={styles.container}>
				<div className={styles.controlsContainer}>
					<div className={styles.filterBadges}>
						{[...Array(4)].map((_, i) => (
							<div key={i} className={styles.skeletonFilterBadge}></div>
						))}
					</div>
					<div className={styles.viewButtons}>
						{[...Array(3)].map((_, i) => (
							<div key={i} className={styles.skeletonViewButton}></div>
						))}
					</div>
				</div>

				<div className={styles.chartsGrid}>
					{[...Array(4)].map((_, i) => (
						<ChartSkeleton key={i} />
					))}
				</div>
			</div>
		</div>
	);
}

export default memo(ReportHistorySkeleton);
