import useAppStore from '@/store';
import { aggregateMetrics, EyeTrackingMetrics } from '@/store/slices/eye-tracking.slice';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createMetrics } from './use-report';

const METRICS_BUFFER_DURATION = 60000;
const MAX_BUFFER_SIZE = 1000;
const QUERY_REFETCH_INTERVAL = 15000;

export const useMetricsPosting = () => {
	const metrics = useAppStore((state) => state.eyeTracking.currentMetrics);

	const metricsBufferRef = useRef<EyeTrackingMetrics[]>([]);
	const lastMetricsPostRef = useRef<number>(Date.now());
	const isPostingRef = useRef<boolean>(false);

	useEffect(() => {
		if (!metrics) return;

		const metricWithTimestamp = {
			...metrics,
			timestamp: Date.now(),
		};

		metricsBufferRef.current.push(metricWithTimestamp);

		// Prevent memory issues by limiting buffer size
		if (metricsBufferRef.current.length > MAX_BUFFER_SIZE) {
			const excessCount = metricsBufferRef.current.length - MAX_BUFFER_SIZE;
			metricsBufferRef.current.splice(0, excessCount);
			console.warn(
				`[useMetricsPosting] Buffer exceeded ${MAX_BUFFER_SIZE}, removed ${excessCount} oldest entries`
			);
		}
	}, [metrics]);

	const postAggregatedMetrics = useCallback(async () => {
		if (isPostingRef.current) {
			console.log('[useMetricsPosting] Already posting metrics, skipping...');
			return null;
		}

		try {
			const now = Date.now();
			const timeSinceLastPost = now - lastMetricsPostRef.current;
			const bufferSize = metricsBufferRef.current.length;

			if (bufferSize === 0) {
				console.log('[useMetricsPosting] No metrics to post');
				return null;
			}

			if (timeSinceLastPost < METRICS_BUFFER_DURATION) {
				const remainingTime = Math.ceil(
					(METRICS_BUFFER_DURATION - timeSinceLastPost) / 1000
				);
				console.log(
					`[useMetricsPosting] Buffer contains ${bufferSize} metrics, posting in ${remainingTime}s`
				);
				return null;
			}

			isPostingRef.current = true;

			const bufferedMetrics = [...metricsBufferRef.current];

			const aggregatedMetrics = aggregateMetrics(bufferedMetrics);

			console.log(
				`[useMetricsPosting] Posting ${bufferSize} metrics (aggregated) to backend`
			);

			await createMetrics(aggregatedMetrics);

			metricsBufferRef.current = [];
			lastMetricsPostRef.current = now;

			console.log('[useMetricsPosting] ✓ Metrics successfully posted and buffer cleared');
			return aggregatedMetrics;
		} catch (error) {
			return null;
			console.error('[useMetricsPosting] ✗ Failed to post metrics:', error);
		} finally {
			isPostingRef.current = false;
		}
	}, []);

	const { data, error, isLoading } = useQuery({
		queryKey: ['eyeTrackingMetricsPosting'],
		queryFn: postAggregatedMetrics,
		refetchInterval: (query) => {
			if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
				return QUERY_REFETCH_INTERVAL;
			}
			return false;
		},
		staleTime: 1000 * 60,
		notifyOnChangeProps: ['data', 'error', 'isLoading'],
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
	});

	return useMemo(
		() => ({
			isPostingMetrics: isPostingRef.current,
			metricsBufferSize: metricsBufferRef.current.length,
			error,
			isLoading,
		}),
		[error, isLoading]
	);
};
