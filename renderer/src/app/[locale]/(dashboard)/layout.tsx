'use client';
import BottomTabBar from '@/components/layout/BottomTabBar/BottomTabBar';
import Footer from '@/components/layout/Footer/Footer';
import Navbar from '@/components/layout/Navbar/Navbar';
import PictureInMode from '@/components/layout/PictureInMode/PictureInMode';
import Sidebar from '@/components/layout/Sidebar/Sidebar';
import { useRouter } from '@/i18n/navigation';
import { EyeTrackingProvider } from '@/provider/EyeTrackingProvider';
import { PiPProvider } from '@/provider/PiPContext';
import useAppStore from '@/store';
import { useEffect, useLayoutEffect, useState } from 'react';
import styles from './layout.module.scss';
import { DeletionRequestDialog } from '@/components/auth/DeletionRequestDialog/DeletionRequestDialog';

const PersistentProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<EyeTrackingProvider>
			<PiPProvider>
				{children}
				<PictureInMode />
			</PiPProvider>
		</EyeTrackingProvider>
	);
};

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const hasTokenOrIsLoggedIn = useAppStore((state) => !!state.auth.token);

	const router = useRouter();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useLayoutEffect(() => {
		if (!hasTokenOrIsLoggedIn) {
			router.replace(`/signin`);
		}
	}, [hasTokenOrIsLoggedIn, router]);


	useEffect(() => {
		const checkIfMobile = () => {
			const isMobile = window.innerWidth <= 600;
			setIsMobile(isMobile);
			if (!isMobile) {
				setIsSidebarOpen(false);
			}
		};
		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);
		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	const toggleSidebar = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const closeSidebar = () => {
		setIsSidebarOpen(false);
	};

	const setLoading = useAppStore?.((state) => state?.camera?.setLoading);
	// const setLoading1 = useBoundStore?.((state) => state?.camera?.setLoading);
	// const setLoading2 = useBearStore?.((state) => state?.camera?.setLoading);

	// console.log('Camera setLoading function:', { setLoading, setLoading1, setLoading2 });

	// Safe destructuring with defaults
	const {
		startScreenTime = () => console.warn('startScreenTime not available'),
		checkAndResetScreenTime = () => console.warn('checkAndResetScreenTime not available'),
	} = useAppStore((state) => state?.screenTime) || {};

	useEffect(() => {
		startScreenTime();
		checkAndResetScreenTime();

		return () => {
			if ((window as any).screenTimeInterval) {
				clearInterval((window as any).screenTimeInterval);
			}
		};
	}, [startScreenTime, checkAndResetScreenTime]);
	// if (false)
	// 	return (
	// 		<EyeTrackingProvider>
	// 			<PiPProvider>
	// 				<div className={styles.container}>
	// 					<Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

	// 					<div className={styles.content}>
	// 						<Navbar onSidebarToggle={toggleSidebar} />
	// 						<main className={styles.main}>
	// 							{children}
	// 							<Footer />
	// 						</main>
	// 					</div>
	// 					<BottomTabBar />
	// 					<ConditionalPictureInMode />
	// 				</div>
	// 			</PiPProvider>
	// 		</EyeTrackingProvider>
	// 	);
	return (
		<PersistentProviders>
			<div className={styles.container}>
				<Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

				<div className={styles.content}>
					<Navbar onSidebarToggle={toggleSidebar} />
					<main className={styles.main}>
						{children}
						<Footer />
					</main>
				</div>
				<BottomTabBar />
				<DeletionRequestDialog/>
			</div>
		</PersistentProviders>
	);
}
