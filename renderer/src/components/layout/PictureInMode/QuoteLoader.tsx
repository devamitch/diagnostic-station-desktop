import styles from './picturein.module.scss';

export const LOADING_QUOTES = [
	'The eyes are the window to the soul...',
	'Focus is the gateway to success...',
	'Every blink tells a story...',
	'Tracking your journey, one gaze at a time...',
	'Where attention goes, energy flows...',
	'The future is where you look...',
	'Your focus determines your reality...',
];

const QuoteLoader = ({ quote: loadingQuote }: { quote?: string }) => {
	return (
		<div className={styles.loadingOverlay}>
			<div className={styles.loadingContent}>
				<div className={styles.loadingSpinner}>
					<div className={styles.spinnerRing}></div>
					<div className={styles.spinnerRing}></div>
					<div className={styles.spinnerRing}></div>
				</div>
				{loadingQuote ? (
					<>
						<p className={styles.loadingQuote}>{loadingQuote}</p>
						<p className={styles.loadingText}>Initializing App...</p>
					</>
				) : null}
			</div>
		</div>
	);
};

export default QuoteLoader;
