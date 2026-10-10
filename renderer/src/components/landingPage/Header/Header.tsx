'use client';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher/LanguageSwitcher';
import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import useAppStore from '@/store';
import styles from './Header.module.css';

function Header() {
	const { headerText } = useTranslationData();
		const hasTokenOrIsLoggedIn = useAppStore(state=>!!state.auth.token || state.auth.isAuthenticated);

	return (
		<header className={styles.header}>
			<span className={styles.logoText}>{headerText.logoText}</span>

			<div className={styles.navLinks}>
				<LanguageSwitcher />
				{!hasTokenOrIsLoggedIn?<><Link href="/signin">
					<button className={styles.signInButton}>{headerText.signInButton}</button>
				</Link>
				<Link href="/register">
					<button className={styles.startButton}>{headerText.getStartedButton}</button>
				</Link>
				</>:<Link href="/dashboard">
					<button className={styles.startButton}>{headerText.getStartedButton}</button>
				</Link>}
				
			</div>
		</header>
	);
}

export default Header;
