// renderer/src/app/[locale]/settings/notifications/page.tsx
'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { useRouter } from '@/i18n/navigation';
import { notify } from '@/utils/toasts';
import { useEffect, useState } from 'react';
import styles from './notifications.module.css';

interface NotificationSettings {
	screenDistanceAlert: boolean;
	eyeStrainAlert: boolean;
	batteryDrainingAlert: boolean;
	lightingAlert: boolean;
	screenTimeAlert: boolean;
}

function Notifications() {
	const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
		screenDistanceAlert: true,
		eyeStrainAlert: true,
		batteryDrainingAlert: true,
		lightingAlert: true,
		screenTimeAlert: true,
	});

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	const { settingsPageText } = useTranslationData();
	const router = useRouter();

	// Load settings on mount
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const settings = await window.ipc.getNotificationSettings();
				setNotificationSettings(settings);
				console.log('[Notifications] ✅ Settings loaded:', settings);
			} catch (error) {
				console.error('[Notifications] ❌ Failed to load settings:', error);
				notify('Failed to load notification settings', 'error');
			} finally {
				setIsLoading(false);
			}
		};

		loadSettings();
	}, []);

	const toggleSetting = (setting: keyof NotificationSettings) => {
		setNotificationSettings((prev) => ({
			...prev,
			[setting]: !prev[setting],
		}));
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const result = await window.ipc.setNotificationSettings(notificationSettings);

			if (result.success) {
				notify(
					settingsPageText.notifications.settingsUpdated ||
						'Settings updated successfully!',
					'success'
				);
				console.log('[Notifications] ✅ Settings saved:', notificationSettings);

				setTimeout(() => {
					router.push('/settings');
				}, 1000);
			} else {
				throw new Error('Failed to save settings');
			}
		} catch (error) {
			console.error('[Notifications] ❌ Failed to save settings:', error);
			notify('Failed to save notification settings', 'error');
		} finally {
			setIsSaving(false);
		}
	};

	const notificationItems = [
		{
			key: 'screenDistanceAlert' as keyof NotificationSettings,
			title: settingsPageText.notifications?.screenDistanceAlert || 'Screen Distance Alert',
			description:
				settingsPageText.notifications?.screenDistanceAlertDesc ||
				'Alert when you are closer than 30cm for more than 30 seconds',
		},
		{
			key: 'eyeStrainAlert' as keyof NotificationSettings,
			title: settingsPageText.notifications?.eyeStrainAlert || 'Eye Strain Alert',
			description:
				settingsPageText.notifications?.eyeStrainAlertDesc ||
				'Alert when eye strain is High for more than 15 minutes',
		},
		{
			key: 'batteryDrainingAlert' as keyof NotificationSettings,
			title: settingsPageText.notifications?.batteryDrainingAlert || 'oLo Battery Alert',
			description:
				settingsPageText.notifications?.batteryDrainingAlertDesc ||
				'Alert when battery drains > 10% in < 15 mins or drops below 20%',
		},
		{
			key: 'lightingAlert' as keyof NotificationSettings,
			title: settingsPageText.notifications?.lightingAlert || 'Lighting Alert',
			description:
				settingsPageText.notifications?.lightingAlertDesc ||
				'Alert when light intensity is below optimal level (< 100)',
		},
		{
			key: 'screenTimeAlert' as keyof NotificationSettings,
			title: settingsPageText.notifications?.screenTimeAlert || 'Screen Time Alert',
			description:
				settingsPageText.notifications?.screenTimeAlertDesc ||
				'Alert when screen time exceeds 6 hours or 50 minutes per hour',
		},
	];

	if (isLoading) {
		return (
			<div className={styles.section}>
				<div className={styles.loadingContainer}>
					<p>Loading settings...</p>
				</div>
			</div>
		);
	}

	return (
		<div className={styles.section}>
			{notificationItems.map((item) => (
				<div key={item.key} className={styles.subSection}>
					<div className={styles.notificationHeader}>
						<div>
							<p className={styles.notificationTitle}>{item.title}</p>
						</div>
						<div
							onClick={() => toggleSetting(item.key)}
							className={`${styles.toggle} ${
								notificationSettings[item.key] ? styles.active : ''
							}`}
						>
							<span
								className={`${styles.thumb} ${
									notificationSettings[item.key] ? styles.thumbActive : ''
								}`}
							/>
						</div>
					</div>
					<p className={styles.notificationDescription}>{item.description}</p>
				</div>
			))}

			<div className={styles.saveButtonContainer}>
				<button
					className={styles.saveButton}
					onClick={handleSaveChanges}
					disabled={isSaving}
				>
					{isSaving
						? 'Saving...'
						: settingsPageText.notifications?.saveChanges || 'Save Changes'}
				</button>
			</div>
		</div>
	);
}

export default Notifications;
