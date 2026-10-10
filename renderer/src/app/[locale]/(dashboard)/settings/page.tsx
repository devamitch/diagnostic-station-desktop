'use client';

import TitleHeader from '@/components/layout/Title/TitleHeader';
import PasswordChangeDialog from '@/components/settings/PasswordChangeDialog/PasswordChangeDialog';
import { useDataSync } from '@/hooks/use-data-sync';
import useTranslationData from '@/hooks/use-translation-data';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import { openExternalBrowser } from '@/utils/utility';
import {
	AlertCircle,
	AlertTriangle,
	BatteryWarningIcon,
	Check,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Download,
	LogOut,
	RefreshCw,
	Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import styles from './SettingsPage.module.css';
import AccountDeletionDialog from '@/components/settings/AccountDeletionDialog/AccountDeletionDialog';

interface UpdateStatus {
	type: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
	message: string;
	progress?: {
		percent: number;
		transferred: number;
		total: number;
		bytesPerSecond: number;
	};
	info?: {
		version: string;
	};
	attempt?: number; // NEW: Track check attempts
}

export default function SettingsPage() {
	const { settingsPageText } = useTranslationData();
	const router = useRouter();
	const logout = useAppStore((state) => state.auth.logout);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
	const [isSpecialistRegionOpen, setIsSpecialistRegionOpen] = useState(false);
	const [isProductCategoriesOpen, setIsProductCategoriesOpen] = useState(false);
	const [isDataSyncOpen, setIsDataSyncOpen] = useState(false);
	const [isAppUpdatesOpen, setIsAppUpdatesOpen] = useState(false);
	const [selectedRegion, setSelectedRegion] = useState<string[]>(['canada']);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([
		'glasses',
		'gadgets',
		'supplements',
		'eyedrops',
	]);

	// Update-related state
	const [currentVersion, setCurrentVersion] = useState<string>('');
	const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
	const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
	const [checkAttempts, setCheckAttempts] = useState(0); // NEW: Track attempts
	const { isSyncing, syncCompleted, startSync } = useDataSync();

	// Region options
	const regionOptions = [
		{ id: 'canada', label: settingsPageText.discoveryPreferences.regions.canada },
		{ id: 'korea', label: settingsPageText.discoveryPreferences.regions.korea },
	];

	// Product category options
	const categoryOptions = [
		{ id: 'glasses', label: settingsPageText.discoveryPreferences.categories.glasses },
		{ id: 'gadgets', label: settingsPageText.discoveryPreferences.categories.gadgets },
		{
			id: 'supplements',
			label: settingsPageText.discoveryPreferences.categories.supplements,
		},
		{ id: 'eyedrops', label: settingsPageText.discoveryPreferences.categories.eyedrops },
	];

	// Get current version and listen for update status
	useEffect(() => {
		if (window?.ipc) {
			window.ipc.getAppVersion?.().then((version) => {
				setCurrentVersion(version);
				console.log(`[Settings] 📱 Current version: v${version}`);
			});

			const unsubscribe = window.ipc.onUpdateStatus?.((status: UpdateStatus) => {
				console.log('[Settings] 📥 Update status:', status.type, status.message);

				setUpdateStatus(status);
				setIsCheckingUpdate(false);

				// Track attempts
				if (status.attempt) {
					setCheckAttempts(status.attempt);
					console.log(`[Settings] 📊 Check attempt #${status.attempt}`);
				}
			});

			return () => {
				if (unsubscribe) {
					unsubscribe();
				}
			};
		}
	}, []);

	const [isOnlineState, setIsOnlineState] = useState(false);

	useEffect(() => {
		const checkOnline = async () => {
			const online = await window.ipc.checkOnline();
			setIsOnlineState(online);
		};

		checkOnline();

		const interval = setInterval(checkOnline, 5000);

		return () => clearInterval(interval);
	}, []);

	const handleCheckForUpdates = async () => {
		if (!window?.ipc || isCheckingUpdate) return;

		console.log('[Settings] 🔍 User manually checking for updates...');
		setIsCheckingUpdate(true);
		setUpdateStatus({
			type: 'checking',
			message: 'Checking for updates...',
		});

		try {
			const result = await window.ipc.checkForUpdatesManual?.();
			console.log('[Settings] ✅ Manual check completed:', result);
		} catch (error) {
			console.error('[Settings] ❌ Update check failed:', error);
			setUpdateStatus({
				type: 'error',
				message: 'Failed to check for updates',
			});
			setIsCheckingUpdate(false);
		}
	};

	const handleInstallUpdate = async () => {
		if (window?.ipc && updateStatus?.type === 'downloaded') {
			console.log('[Settings] 🚀 User clicked install update');
			await window.ipc.installUpdate?.();
		}
	};

	const formatBytes = (bytes: number): string => {
		if (!bytes) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
	};

	const getUpdateStatusIcon = () => {
		switch (updateStatus?.type) {
			case 'checking':
				return <RefreshCw className={styles.spinIcon} size={12} />;
			case 'available':
				return <Download size={12} />;
			case 'downloading':
				return <Download className={styles.pulseIcon} size={12} />;
			case 'downloaded':
				return <Check size={12} />;
			case 'not-available':
				return <Check size={12} />;
			case 'error':
				return <AlertCircle size={12} />;
			default:
				return <RefreshCw size={12} />;
		}
	};

	const getUpdateStatusColor = () => {
		switch (updateStatus?.type) {
			case 'checking':
				return styles.statusChecking;
			case 'available':
				return styles.statusAvailable;
			case 'downloading':
				return styles.statusDownloading;
			case 'downloaded':
				return styles.statusDownloaded;
			case 'not-available':
				return styles.statusUpToDate;
			case 'error':
				return styles.statusError;
			default:
				return '';
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			router.push('/signin');
		} catch (error) {
			console.error('Error signing out: ', error);
		}
	};

	const handleUserButtonClick = () => {
		router.push('/profile');
	};

	const handleNotificationSettings = () => {
		router.push('/settings/notifications');
	};

	const handlePasswordChangeClick = () => {
		setIsPasswordDialogOpen(true);
	};

	const handleClosePasswordDialog = () => {
		setIsPasswordDialogOpen(false);
	};
 	const handleDeleteAccountClick = () => {
		setIsDeleteAccountDialogOpen(true);
	};

	const handleCloseDeleteAccountDialog = () => {
		setIsDeleteAccountDialogOpen(false);
	};
	const toggleSpecialistRegion = () => {
		setIsSpecialistRegionOpen(!isSpecialistRegionOpen);
	};

	const toggleDataSync = () => {
		setIsDataSyncOpen(!isDataSyncOpen);
	};

	const toggleAppUpdates = () => {
		setIsAppUpdatesOpen(!isAppUpdatesOpen);
	};

	const toggleProductCategories = () => {
		setIsProductCategoriesOpen(!isProductCategoriesOpen);
	};

	const handleRegionSelect = (regionId: string) => {
		setSelectedRegion((prev) =>
			prev.includes(regionId) ? prev.filter((id) => id !== regionId) : [...prev, regionId]
		);
	};

	const handleCategoryToggle = (categoryId: string) => {
		setSelectedCategories((prev) =>
			prev.includes(categoryId)
				? prev.filter((id) => id !== categoryId)
				: [...prev, categoryId]
		);
	};

	return (
		<div className={styles.container}>
			<>
				<TitleHeader title={settingsPageText.sectionTitles.accountSettings} />
				<div className={styles.section}>
					<button className={styles.button} onClick={handleUserButtonClick}>
						<span>{settingsPageText.accountSettings.profileInfo}</span>
						<ChevronRight size={21} />
					</button>
					<button className={styles.button} onClick={handlePasswordChangeClick}>
						<span>{settingsPageText.accountSettings.changePassword}</span>
						<ChevronRight size={21} />
					</button>
				</div>
			</>

			<>
				<TitleHeader title={settingsPageText.sectionTitles.discoveryPreferences} />
				<div className={styles.section}>
					<button className={styles.button} onClick={toggleSpecialistRegion}>
						<span>{settingsPageText.discoveryPreferences.specialistRegion}</span>
						{isSpecialistRegionOpen ? (
							<ChevronUp size={21} />
						) : (
							<ChevronDown size={21} />
						)}
					</button>

					{isSpecialistRegionOpen && (
						<div className={styles.accordionContent}>
							{regionOptions.map((region) => (
								<button
									key={region.id}
									className={`${styles.optionButton} ${
										selectedRegion.includes(region.id)
											? styles.selectedOption
											: ''
									}`}
									onClick={() => handleRegionSelect(region.id)}
								>
									<span>{region.label}</span>
								</button>
							))}
						</div>
					)}

					<button className={styles.button} onClick={toggleProductCategories}>
						<span>{settingsPageText.discoveryPreferences.productCategories}</span>
						{isProductCategoriesOpen ? (
							<ChevronUp size={21} />
						) : (
							<ChevronDown size={21} />
						)}
					</button>

					{isProductCategoriesOpen && (
						<div className={styles.accordionContent}>
							{categoryOptions.map((category) => (
								<button
									key={category.id}
									className={`${styles.optionButton} ${
										selectedCategories.includes(category.id)
											? styles.selectedOption
											: ''
									}`}
									onClick={() => handleCategoryToggle(category.id)}
								>
									<span>{category.label}</span>
								</button>
							))}
						</div>
					)}
					<button className={styles.button} onClick={handleNotificationSettings}>
						<span>{settingsPageText.sectionTitles.notification}</span>
						<ChevronRight size={21} />
					</button>
				</div>
			</>

			<>
				<TitleHeader title="System Settings" />
				<div className={styles.section}>
					<button className={styles.button} onClick={toggleDataSync}>
						<span>{settingsPageText.sectionTitles.dataSync}</span>
						{isDataSyncOpen ? <ChevronUp size={21} /> : <ChevronDown size={21} />}
					</button>
					{isDataSyncOpen && (
						<div className={`${styles.updateSection}`}>
							<div
								className={`${styles.updateStatus} ${isSyncing ? styles.infoState : syncCompleted ? styles.successState : styles.neutralState}`}
							>
								<div className={styles.statusIcon}>
									{isSyncing ? (
										<RefreshCw size={12} className={styles.spinIcon} />
									) : syncCompleted ? (
										<span>
											<CheckCircle size={12} className={styles.sparkleIcon} />
										</span>
									) : isOnlineState ? (
										<span>
											<RefreshCw size={12} className={styles.sparkleIcon} />
										</span>
									) : (
										<span>
											<BatteryWarningIcon
												size={12}
												className={styles.sparkleIcon}
											/>
										</span>
									)}
								</div>
								<div className={styles.statusContent}>
									{isSyncing
										? settingsPageText.dataSync.syncing
										: syncCompleted
											? settingsPageText.dataSync.syncComplete
											: isOnlineState
												? settingsPageText.dataSync.readyToSync
												: settingsPageText.dataSync.offlineMessage}
								</div>
							</div>

							<button
								className={`${styles.updateButton} ${styles.checkButton}`}
								onClick={startSync}
								disabled={!isOnlineState || isSyncing}
							>
								<RefreshCw size={18} className={isSyncing ? styles.spinIcon : ''} />
								<span>
									{isSyncing
										? settingsPageText.dataSync.syncingButton
										: syncCompleted
											? settingsPageText.dataSync.syncAgainButton
											: settingsPageText.dataSync.syncButton}
								</span>
							</button>
						</div>
					)}

					<button className={styles.button} onClick={toggleAppUpdates}>
						<span>{settingsPageText.sectionTitles.appUpdates}</span>
						{isAppUpdatesOpen ? <ChevronUp size={21} /> : <ChevronDown size={21} />}
					</button>

					{isAppUpdatesOpen && (
						<div className={`${styles.updateSection}`}>
							{updateStatus ? (
								<div className={`${styles.updateStatus} ${getUpdateStatusColor()}`}>
									<div className={styles.statusIcon}>{getUpdateStatusIcon()}</div>
									<div className={styles.statusContent}>
										<div className={styles.statusMessage}>
											{updateStatus.message}
											{/* NEW: Show check attempts */}
											{checkAttempts > 1 &&
												updateStatus.type === 'checking' && (
													<span className={styles.attemptBadge}>
														{' '}
														(Attempt {checkAttempts}/3)
													</span>
												)}
										</div>
										{updateStatus.info?.version && (
											<div className={styles.statusVersion}>
												v{updateStatus.info.version}
											</div>
										)}

										{/* Download Progress */}
										{updateStatus.type === 'downloading' &&
											updateStatus.progress && (
												<div className={styles.progressContainer}>
													<div className={styles.progressBar}>
														<div
															className={styles.progressFill}
															style={{
																width: `${updateStatus.progress.percent}%`,
															}}
														/>
													</div>
													<div className={styles.progressDetails}>
														<span className={styles.progressPercent}>
															{Math.round(
																updateStatus.progress.percent
															)}
															%
														</span>
														<span className={styles.progressSize}>
															{formatBytes(
																updateStatus.progress.transferred
															)}{' '}
															/{' '}
															{formatBytes(
																updateStatus.progress.total
															)}
														</span>
													</div>
												</div>
											)}
									</div>
								</div>
							) : (
								<div className={styles.autoUpdateInfo}>
									<div className={styles.infoIcon}>ⓘ</div>
									<span>{settingsPageText.appUpdates.autoUpdateInfo}</span>
								</div>
							)}

							<div className={styles.updateActions}>
								{updateStatus?.type === 'downloaded' ? (
									<button
										className={`${styles.updateButton} ${styles.installButton}`}
										onClick={handleInstallUpdate}
									>
										<Download size={18} />
										<span>{settingsPageText.appUpdates.installAndRestart}</span>
									</button>
								) : (
									<button
										className={`${styles.updateButton} ${styles.checkButton}`}
										onClick={handleCheckForUpdates}
										disabled={isCheckingUpdate}
									>
										<RefreshCw
											size={18}
											className={isCheckingUpdate ? styles.spinIcon : ''}
										/>
										<span>
											{isCheckingUpdate
												? settingsPageText.appUpdates.checking
												: settingsPageText.appUpdates.checkForUpdates}
										</span>
									</button>
								)}
							</div>
						</div>
					)}
				</div>
			</>

			<>
				<TitleHeader title={settingsPageText.sectionTitles.helpSupport} />
				<div className={styles.section}>
					<button
						className={styles.button}
						onClick={() =>
							openExternalBrowser('https://eye-scan.AuraCoremedical.com/en/faq')
						}
					>
						<span>{settingsPageText.helpSupport.faq}</span>
						<ChevronRight size={21} />
					</button>
					<button
						className={styles.button}
						onClick={() =>
							openExternalBrowser(
								'https://eye-scan.AuraCoremedical.com/en/contact-us/'
							)
						}
					>
						<span>{settingsPageText.helpSupport.contactUs}</span>
						<ChevronRight size={21} />
					</button>
					<button
						className={styles.button}
						onClick={() =>
							openExternalBrowser(
								'https://eye-scan.AuraCoremedical.com/en/privacy-policy/'
							)
						}
					>
						<p>{settingsPageText.helpSupport.termsPrivacy}</p>
						<ChevronRight size={21} />
					</button>
				</div>
			</>
				<>
				<TitleHeader title={settingsPageText.deleteAccount.sectionTitle} />
				<div className={styles.section}>
					{/* Delete Account Button */}
					<button
						className={styles.deleteAccountButton}
						onClick={handleDeleteAccountClick}
					>
						<div className={styles.deleteAccountContent}>
							<div className={styles.deleteAccountIcon}>
								<Trash2 size={20} />
							</div>
							<div className={styles.deleteAccountText}>
								<span className={styles.deleteAccountTitle}>{settingsPageText.deleteAccount.deleteButton}</span>
															<span className={styles.deleteAccountSubtitle}>
									{settingsPageText.deleteAccount.deleteSubtitle}
								</span>
							</div>
						</div>
						<ChevronRight size={21} />
					</button>

					{/* Delete Account Warning */}
					<div className={styles.deleteWarning}>
						<AlertTriangle size={16} />
						<p>
							Account deletion includes a grace period. You can restore your account
							by logging in within the selected timeframe.
						</p>
					</div>
				</div>
			</>

			<>
				<button onClick={handleLogout} className={styles.Logoutbutton}>
					<LogOut size={21} />
					{settingsPageText.logOut}
				</button>
			</>

			<PasswordChangeDialog
				isOpen={isPasswordDialogOpen}
				onClose={handleClosePasswordDialog}
			/>
				<AccountDeletionDialog
				isOpen={isDeleteAccountDialogOpen}
				onClose={handleCloseDeleteAccountDialog}
			/>
		</div>
	);
}