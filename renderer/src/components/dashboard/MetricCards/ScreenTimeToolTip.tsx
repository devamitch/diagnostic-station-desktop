"use client";

import { memo } from "react";
import styles from '../ReportHistory/reporthistorygraph.module.css';

const ScreenTimeTooltip = memo(({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const minutes = payload[0].value;
    const timeSpent =
        minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;

    return (
        <div className={styles.customTooltip}>
            <p className={styles.tooltipLabel}>{label}</p>
            <p className={styles.tooltipValue}>Screen Time: {timeSpent}</p>
        </div>
    );
});
ScreenTimeTooltip.displayName = 'ScreenTimeTooltip';
export default ScreenTimeTooltip;