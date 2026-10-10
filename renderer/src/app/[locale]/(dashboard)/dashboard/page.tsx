'use client';


import EyeMetricsDisplay from '@/components/dashboard/EyeTracking/EyeMetricDisplay/EyeMetricsDisplay';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import styles from './dashboard.module.scss';
import ReportHistoryGraph from '@/components/dashboard/ReportHistory/ReportHistoryGraph/ReportHistoryGraph';


export default function DashboardPage() {
    const { metrics } = useEyeTrackingContext();
    return (
        <div className={styles.container}>
            <div className={styles.streamSection}>
                {metrics && (
                    <EyeMetricsDisplay
                        metrics={metrics}
                        className={styles.metricsPanel}
                       
                    />
                )}
            </div>
            <ReportHistoryGraph />
        </div>
    );
}



