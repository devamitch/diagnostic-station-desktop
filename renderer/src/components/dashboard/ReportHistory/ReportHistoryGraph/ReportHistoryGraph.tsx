'use client';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import ModalView from '@/components/reportHistory/ModalView/ModalView';
import { useEyeTrackingChart } from '@/hooks/use-report';
import useTranslationData from '@/hooks/use-translation-data';
import { Loader2, MoveLeft, MoveRight, RefreshCcw } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import styles from './reporthistorygraph.module.css';
import ReportSkeleton from '../ReportSkelaton/ReportSkeleton';
import MetricChart from '../../MetricCards/MetricCard';

function ReportHistoryGraph() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedReport, setSelectedReport] = useState<any>(null);
	const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
	const { reportHistoryText, dashboardPageText } = useTranslationData();
	const [customRange, setcustomRange] = useState<{
		start: string;
		end: string;
		interval: 'hour' | 'day' | 'month';
	} | null>(null);
	const {
		chartData,
		isLoading,
		error,
		refetch,
		isRefetching,
		lastUpdated,
		hasPrevious,
		range,
		hasNext,
		nextRange,
		isFetching,
	} = useEyeTrackingChart(
		timeFilter,
		customRange?.start,
		customRange?.end,
		customRange?.interval
	);

	const closeModal = useCallback(() => {
		setIsModalOpen(false);
		setSelectedReport(null);
	}, []);

	const handleTodayFilter = useCallback(() => {
		setTimeFilter('today');
		setcustomRange(null);
	}, []);
	const handleWeekFilter = useCallback(() => {
		setTimeFilter('week');
		setcustomRange(null);
	}, []);
	const handleMonthFilter = useCallback(() => {
		setTimeFilter('month');
		setcustomRange(null);
	}, []);
	const handleYearFilter = useCallback(() => {
		setTimeFilter('year');
		setcustomRange(null);
	}, []);
	const handlePrevious = useCallback(() => {
		if (hasPrevious && range) {
			setcustomRange({
				start: range.start,
				end: range.end,
				interval: range.interval,
			});
		}
	}, [hasPrevious, range]);
	const handleNext = useCallback(() => {
		if (hasNext && nextRange) {
			setcustomRange({
				start: nextRange.start,
				end: nextRange.end,
				interval: nextRange.interval,
			});
		}
	}, [hasNext, nextRange]);

	if (isLoading) {
		return <ReportSkeleton />;
	}

	return (
		<div className={styles.reportHistory}>
			<div className={styles.header}>
				<TitleHeader title={dashboardPageText.eyeScanReportTitle} />
			</div>

			<div className={styles.container}>
				<div className={styles.controlsContainer}>
					<div className={styles.filterBadges}>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'today' ? styles.active : ''}`}
							onClick={handleTodayFilter}
						>
							{reportHistoryText.timeFilters.today}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'week' ? styles.active : ''}`}
							onClick={handleWeekFilter}
						>
							{reportHistoryText.timeFilters.week}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'month' ? styles.active : ''}`}
							onClick={handleMonthFilter}
						>
							{reportHistoryText.timeFilters.month}
						</button>
						<button
							className={`${styles.filterBadge} ${timeFilter === 'year' ? styles.active : ''}`}
							onClick={handleYearFilter}
						>
							{reportHistoryText.timeFilters.year}
						</button>
					</div>
					<div className={styles.viewButtons}>
						<button
							className={`${styles.viewButton} ${styles.refreshButton}`}
							onClick={() => refetch()}
							title="Refresh"
							// disabled={isRefetching}
						>
							{isRefetching ? (
								<Loader2 size={16} className={styles.spinner} />
							) : (
								<RefreshCcw size={16} />
							)}
						</button>

						<button
							className={`${styles.viewButton} ${styles.prevBtn}`}
							onClick={handlePrevious}
							title="Previous"
							disabled={!hasPrevious}
						>
							<MoveLeft size={16} />
						</button>

						<button
							className={`${styles.viewButton} ${styles.nextBtn}`}
							onClick={handleNext}
							title="Next"
							disabled={!hasNext}
						>
							<MoveRight size={16} />
						</button>
					</div>
				</div>

				{error ? (
					<div className={styles.errorContainer}>
						<span>Error loading charts: {error.message}</span>
						<button onClick={() => refetch()} className={styles.retryButton}>
							Retry
						</button>
					</div>
				) : null}

				<div className={styles.chartsGrid}>
					<MetricChart
						title={reportHistoryText.chartTitles.blinkRate}
						dataKey="blinkRate"
						color="var(--lowValue)"
						data={chartData}
						lastUpdated={lastUpdated}
						reportHistoryText={reportHistoryText}
						isLoading={isFetching}
					/>
					<MetricChart
						title={reportHistoryText.chartTitles.overallHealth}
						dataKey="overallHealth"
						color="var(--modValue)"
						data={chartData}
						lastUpdated={lastUpdated}
						reportHistoryText={reportHistoryText}
						isLoading={isFetching}
					/>
					<MetricChart
						title={reportHistoryText.chartTitles.screenDistance}
						dataKey="distanceCm"
						color="var(--vHighValue)"
						data={chartData}
						lastUpdated={lastUpdated}
						reportHistoryText={reportHistoryText}
						isLoading={isFetching}
					/>

					<MetricChart
						title={reportHistoryText.chartTitles.screenTime}
						dataKey="screenTimeMinutes"
						color="var(--highValue)"
						data={chartData}
						lastUpdated={lastUpdated!}
						reportHistoryText={reportHistoryText}
						isLoading={isFetching}
					/>
				</div>
			</div>

			<ModalView
				isModalOpen={isModalOpen}
				closeModal={closeModal}
				selectedReport={selectedReport}
			/>
		</div>
	);
}

export default memo(ReportHistoryGraph);
