'use client';
import DropdownMenu from '@/components/utils/Dropdown';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Check, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import styles from './LanguageSwitcher.module.css';

const LANGUAGES = [
	{ code: 'en', name: 'English', flag: '🇺🇸' },
	{ code: 'ja', name: '日本語', flag: '🇯🇵' },
	{ code: 'ko', name: '한국어', flag: '🇰🇷' },
];

export default function LanguageSwitcher() {
	const locale = useLocale();
	const t = useTranslations();
	const pathname = usePathname();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleLanguageChange = (newLocale: string) => {
		if (newLocale === locale) return;

		startTransition(() => {
			window.ipc.setLocale(newLocale);
			router.replace(pathname, { locale: newLocale });
		});
	};

	return (
		<DropdownMenu
			trigger={
				<button
					className={styles.iconButton}
					disabled={isPending}
					aria-label={t('common.changeLanguage')}
				>
					<Languages className={styles.icon} />
				</button>
			}
			header={<div className={styles.dropdownHeader}>{t('common.changeLanguage')}</div>}
			items={LANGUAGES.map((lang) => ({
				label: (
					<div className={styles.languageItem}>
						<span className={styles.flag}>{lang.flag}</span>
						<span className={styles.nativeName}>{lang.name}</span>
						{lang.code === locale && <Check className={styles.checkIcon} size={16} />}
					</div>
				),
				onSelect: () => handleLanguageChange(lang.code),
			}))}
			align="center"
		/>
	);
}
