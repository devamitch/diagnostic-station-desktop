"use client";

import { memo } from "react";
import styles from '../ReportHistory/ReportHistoryGraph/reporthistorygraph.module.css';

const CustomTooltip = memo(({ active, payload, label, reportHistoryText }: any) => {
	if (!active || !payload || !payload.length) return null;

	return (
		<div className={styles.customTooltip}>
			<p className={styles.tooltipLabel}>{label}</p>
			{payload.map((entry: any, index: number) => (
				<p key={index} className={styles.tooltipValue} style={{ color: entry.color }}>
					{entry.name}: {entry.value}
					{entry.name === 'Blink Rate'
						? reportHistoryText.tooltipUnits.blinks
						: entry.name === 'Eye Closure'
							? reportHistoryText.tooltipUnits.percentage
							: entry.name === 'Attention'
								? reportHistoryText.tooltipUnits.percentage
								: reportHistoryText.tooltipUnits.years}
				</p>
			))}
		</div>
	);
});
CustomTooltip.displayName = 'CustomTooltip';
export default CustomTooltip;
