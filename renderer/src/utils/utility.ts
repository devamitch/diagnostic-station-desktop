export const openExternalBrowser = async (url: string) => {
	// Check if running in Electron environment
	if (typeof window !== 'undefined' && window.ipc?.openExternal) {
		// Use Electron's IPC to open in system browser
		try {
			const result = await window.ipc.openExternal(url);
			if (!result.success) {
				console.error('Failed to open URL:', result.error);
				// Fallback to window.open
				window.open(url, '_blank', 'noopener,noreferrer');
			}
		} catch (error) {
			console.error(' Error opening URL:', error);
			// Fallback to window.open
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	} else if (typeof window !== 'undefined') {
		// Fallback for web browsers
		window.open(url, '_blank', 'noopener,noreferrer');
	}
};

export const getStatusLevel = (score: number, thresholds: number[], labels: string[]) => {
	for (let i = 0; i < thresholds.length; i++) {
		if (score < thresholds[i]) {
			return { text: labels[i], status: labels[i].toLowerCase().replace(' ', '-') };
		}
	}
	return {
		text: labels[labels.length - 1],
		status: labels[labels.length - 1].toLowerCase().replace(' ', '-'),
	};
};

export const getBlinkRateStatusHelper = (value: number, labels: string[]) => {
	if (value < 10) return labels[2];
	if (value < 15) return labels[1];
	return labels[0];
};

export const getStatusClassHelper = (value: number, type: 'blinkRate' | 'perClose', styles: any) => {
	if (type === 'blinkRate') {
		if (value <= 10) return styles.poor;
		if (value <= 15) return styles.good;
		if (value <= 20) return styles.moderate;
		return styles.high;
	}
	if (value <= 20) return styles.good;
	if (value <= 40) return styles.moderate;
	return styles.poor;
};
