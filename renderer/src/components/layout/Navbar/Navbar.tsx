'use client';
import DropdownMenu from '@/components/utils/Dropdown';
import useTranslationData from '@/hooks/use-translation-data';
import { useRouter } from '@/i18n/navigation';
import { useAuth } from '@/provider/AuthUserContext';
import useAppStore from '@/store';
import {
	ChevronDown,
	ChevronLeft,
	LogOut,
	Menu,
	Settings as SettingsIcon,
	User as UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import styles from './Navbar.module.css';

interface NavbarProps {
	onSidebarToggle?: () => void;
}

export default function Navbar({ onSidebarToggle }: NavbarProps) {
	const { user } = useAuth();
	const authUser = user;
	const pathname = usePathname();
	const router = useRouter();
	const { navbarText } = useTranslationData();
	const [isMobile, setIsMobile] = useState(false);
	const { sidebarText } = useTranslationData();
	const logout = useAppStore((state) => state.auth.logout);
	const t = useTranslations();

	// Mobile detection
	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth <= 600);
		};
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	const handleLogout = async () => {
		try {
			await logout();
			router.replace('/signin');
		} catch (e) {
			console.error('Logout failed', e);
		}
	};

	const handleUserButtonClick = () => {
		router.push('/profile');
	};

	const currentPage = useMemo(() => {
		return pathname.split('/')[3] === ''
			? pathname.split('/')[2]
			: pathname.split('/')[2] + pathname.split('/')[3];
	}, [pathname]);

	const pagePath = useMemo(() => {
		const pageNameMap: Record<string, string> = {
			dashboard: t('navigation.pages.dashboard'),
			live: t('navigation.pages.live'),
			icare: t('navigation.pages.icare'),
			profile: t('navigation.pages.profile'),
			settings: t('navigation.pages.settings'),
			history: t('navigation.pages.history'),
			offline: t('navigation.pages.offline'),
			settingsnotifications: t('navigation.pages.notifications'),
		};

		return pageNameMap[currentPage ?? 'dashboard'] || pageNameMap.dashboard;
	}, [currentPage, t]);

	const handleBackClick = () => {
		router.back();
	};

	return (
		<nav className={styles.navbar}>
			{isMobile && (currentPage === 'settings' || currentPage === 'profile') && (
				<ChevronLeft
					size={36}
					color="var(--metricValue)"
					className={styles.backButton}
					onClick={handleBackClick}
				/>
			)}

			<div className={styles.header}>
				{isMobile && currentPage !== 'settings' && currentPage !== 'profile' && (
					<button className={styles.menuButton} onClick={onSidebarToggle}>
						<Menu size={24} color="var(--metricValue)" />
					</button>
				)}

				{isMobile && currentPage === 'dashboard' ? (
					<span className={styles.logo}>{sidebarText.logoText}</span>
				) : (
					pagePath
				)}
			</div>
			<div className={styles.navItems}>
				{/* <button className={styles.iconButton}>
					<Bell size={20} color="var(--metricValue)" fill="var(--metricValue)" />
				</button>		 */}
				{/* <button className={styles.searchButton}>
					<Search size={20} color="var(--metricValue)" />
					<input
						type="text"
						placeholder={navbarText.searchPlaceholder}
						className={styles.searchInput}
					/>
				</button>
				<button className={styles.iconButton}>
					<MessageSquare size={20} color="var(--metricValue)" fill="var(--metricValue)" />
				</button> */}
				{isMobile ? (
					currentPage === 'profile' ? (
						<SettingsIcon
							size={36}
							color="var(--metricValue)"
							onClick={() => router.push('/settings')}
							className={styles.backButton}
						/>
					) : (
						<button className={styles.userSection} onClick={handleUserButtonClick}>
							<Image
								src="/mockData/profile.png"
								alt="Profile"
								width={36}
								height={36}
								className={styles.avatar}
							/>
						</button>
					)
				) : (
					<>
						<LanguageSwitcher />
						<DropdownMenu
							trigger={
								<button className={styles.userSection}>
									<Image
										src="/mockData/profile.png"
										alt="Profile"
										width={36}
										height={36}
										className={styles.avatar}
									/>
									<span>
										<p className={styles.userName}>{authUser?.name}</p>
										<p className={styles.userEmail}>{authUser?.email}</p>
									</span>
									<ChevronDown size={18} color="var(--metricValue)" />
								</button>
							}
							items={[
								{
									label: navbarText.userMenuItems.profile,
									icon: <UserIcon size={16} />,
									href: '/profile',
								},
								{
									label: navbarText.userMenuItems.settings,
									icon: <SettingsIcon size={16} />,
									href: '/settings',
								},
								{
									label: navbarText.userMenuItems.logout,
									icon: <LogOut size={16} />,
									onSelect: handleLogout,
									danger: true,
								},
							]}
							align="center"
						/>
					</>
				)}
			</div>
		</nav>
	);
}
