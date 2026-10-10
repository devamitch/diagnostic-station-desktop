'use client';

import useTranslationData from '@/hooks/use-translation-data';
import styles from './Footer.module.css';
import { openExternalBrowser } from '@/utils/utility';

export default function Footer() {
	const { footerText } = useTranslationData();

	return (
		<footer className={styles.footer}>
			<div className={styles.copyright}>
				@{new Date().getUTCFullYear()}, {footerText.copyright}
			</div>

			<div className={styles.section}>
				<button onClick={() => openExternalBrowser('https://eye-scan.AuraCoremedical.com/en/faq')} className={styles.link}>
					{footerText.faqText}
				</button>
				<button onClick={() => openExternalBrowser('https://eye-scan.AuraCoremedical.com/en/privacy-policy/')} className={styles.link}>
					{footerText.privacyText}
				</button>
				<button onClick={() => openExternalBrowser('https://eye-scan.AuraCoremedical.com/en/contact-us/')} className={styles.link}>
					{footerText.contactText}
				</button>
			</div>
		</footer>
	);
}
