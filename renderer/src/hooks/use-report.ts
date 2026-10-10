'use client';

import type { EyeTrackingMetrics } from '@/store/slices/eye-tracking.slice';
import { electronAPI } from '@/types/electron-api';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export type TimeFilter = 'today' | 'week' | 'month' | 'year';

export function useEyeTrackingChart(
	timeFilter: TimeFilter,
	start?: string,
	end?: string,
	interval?: 'hour' | 'day' | 'month'
) {
	const queryFn = useCallback(async () => {
		const now = new Date();
		const result = await electronAPI.getfilterMetrics({
			timeFilter,
			...(start && { start }),
			...(end && { end }),
			...(interval && { interval }),
		});
		const data = result;
		const chartData = data.metrics.map((entry) => ({
			time: entry.time_bucket,
			blinkRate: Math.round(entry.blinkRate),
			eyeClosure: Math.round(entry.eyeClosure),
			attention: Math.round(entry.attention),
			distanceCm: Math.round(entry.proximity),
			eyeAge: Math.round(entry.eyeAge),
			overallHealth: Math.round(entry.overallHealthScore),
			screenTimeMinutes: Math.round(entry.screenTimeMinutes),
		}));
		return {
			chartData,
			hasPrevious: data.hasPrevious,
			range: data.previousRange ? data.previousRange : null,
			hasNext: data.hasNext,
			nextRange: data.nextRange ? data.nextRange : null,
			currentRange: data.currentRange,
			lastUpdated: now,
		};
	}, [timeFilter, start, end, interval]);

	const query = useQuery({
		queryKey: ['eyeTrackingSummary', timeFilter, start, end, interval],
		queryFn,
		refetchInterval: (query) => {
			if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
				return 15000;
			}
			return false;
		},
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		refetchIntervalInBackground: false,
		staleTime: 1000 * 50, // Data considered fresh for 20s
		gcTime: 1000 * 60 * 5, // Updated from deprecated cacheTime to gcTime
		retry: 2,
	});

	return {
		chartData: query.data?.chartData || [],
		...query,
		lastUpdated: query.data?.hasNext ? query.data?.currentRange.start : query.data?.lastUpdated,
		hasPrevious: query.data?.hasPrevious,
		range: query.data?.range,
		hasNext: query.data?.hasNext,
		nextRange: query.data?.nextRange,
	};
}

export const createMetrics = async (eyeTrackingData: EyeTrackingMetrics) => {
	try {
		const result: { success: boolean; id: number } =
			await electronAPI.createMetrics(eyeTrackingData);
		return result;
	} catch (err) {
		console.error('Error creating metrics:', err);
		return null;
	}
};
