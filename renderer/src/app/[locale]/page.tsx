'use client';

import { useScreenTime } from '@/hooks/use-screentime';
import { useRouter } from '@/i18n/navigation';
import useAppStore from '@/store';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import SignIn from './(auth)/signin/page';

export default function Home() {
	// const {
	// 	afterOLo,
	// 	beforeOLo,
	// 	benefitsOrganisationData,
	// 	businessFeatures,
	// 	featureData,
	// 	homePageText,
	// 	impactPoints,
	// 	problemPoints,
	// 	whoWeWorkWithData,
	// } = useTranslationData();
	const hasTokenOrIsLoggedIn = useAppStore((state) => !!state.auth.token);

	const [hydrated, setHydrated] = useState(false);
	const router = useRouter();

	useEffect(() => {
		setHydrated(true);
	}, []);
	const { startSession } = useScreenTime();
	const [sessionStarted, setSessionStarted] = useState(false);

	useEffect(() => {
		if (!sessionStarted) {
			console.log('📊 Dashboard mounted, ensuring session is started...');
			startSession().then((result) => {
				if (result.success) {
					setSessionStarted(true);
				}
			});
		}
	}, [sessionStarted, startSession]);

	useEffect(() => {
		// alert('hasTokenOrIsLoggedIn: ' + hasTokenOrIsLoggedIn);
		if (hasTokenOrIsLoggedIn) {
			router.push(`/dashboard`);
		}
	}, [hasTokenOrIsLoggedIn, router]);

	if (!hydrated) {
		return (
			<div
				style={{
					width: '90vw',
					height: '90vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Loader2
					style={{
						color: '#6BA292',
					}}
				/>
			</div>
		);
	}

	return <SignIn />;

	// return (
	// 	<div className={styles.container}>
	// 		<Header />
	// 		<main className={styles.mainContent}>
	// 			<Hero />
	// 			{/*  Why Eye Health Matters */}
	// 			<section className={styles.featuresSection}>
	// 				<div className={styles.twoColumnLayout}>
	// 					<Image
	// 						src="/hero3.svg"
	// 						alt={homePageText.whyEyeHealthSection.imageAlt}
	// 						width={500}
	// 						height={500}
	// 						className={styles.layoutImage}
	// 					/>
	// 					<div className={styles.layoutContent}>
	// 						<h2 className={styles.sectionTitle}>
	// 							{homePageText.whyEyeHealthSection.title}
	// 						</h2>
	// 						<div className={styles.infoCard}>
	// 							<h3 className={styles.subHeading}>
	// 								{homePageText.whyEyeHealthSection.problemSubheading}
	// 							</h3>
	// 							<ul className={styles.checkList}>
	// 								{problemPoints.map((point, index) => (
	// 									<li key={index} className={styles.checkListItem}>
	// 										{point}
	// 									</li>
	// 								))}
	// 							</ul>
	// 						</div>
	// 						<div className={styles.infoCard}>
	// 							<h3 className={styles.subHeading}>
	// 								{homePageText.whyEyeHealthSection.impactSubheading}
	// 							</h3>
	// 							<ul className={styles.checkList}>
	// 								{impactPoints.map((point, index) => (
	// 									<li key={index} className={styles.checkListItem}>
	// 										{point}
	// 									</li>
	// 								))}
	// 							</ul>
	// 						</div>
	// 					</div>
	// 				</div>
	// 			</section>

	// 			{/*  What oLo Does */}
	// 			<section id="features" className={styles.featuresSection}>
	// 				<h2 className={styles.sectionTitle}>{homePageText.featuresSection.title}</h2>
	// 				<FeatureCards features={featureData} />
	// 			</section>

	// 			{/*  Benefits for Organizations */}
	// 			<section id="organisation-benefits" className={styles.featuresSection}>
	// 				<h2 className={styles.sectionTitle}>
	// 					{homePageText.organizationBenefitsSection.title}
	// 				</h2>
	// 				<FeatureCards features={benefitsOrganisationData} />
	// 			</section>

	// 			{/*  Built for Business */}
	// 			<section className={styles.featuresSection}>
	// 				<h2 className={styles.sectionTitle}>
	// 					{homePageText.builtForBusinessSection.title}
	// 				</h2>
	// 				<div className={styles.twoColumnLayout}>
	// 					<Image
	// 						src="/hero2.svg"
	// 						alt={homePageText.builtForBusinessSection.imageAlt}
	// 						width={500}
	// 						height={500}
	// 						className={styles.layoutImage}
	// 					/>
	// 					<div className={styles.buisnessContent}>
	// 						{businessFeatures.map((feature, index) => (
	// 							<div key={index}>
	// 								<h3 className={styles.subHeading}>{feature.title}</h3>
	// 								<p className={styles.sectionDescription}>
	// 									{feature.description}
	// 								</p>
	// 							</div>
	// 						))}
	// 					</div>
	// 				</div>
	// 			</section>

	// 			{/*  Who We Work With */}
	// 			<section id="who-we-work-with" className={styles.featuresSection}>
	// 				<h2 className={styles.sectionTitle}>
	// 					{homePageText.whoWeWorkWithSection.title}
	// 				</h2>
	// 				<FeatureCards features={whoWeWorkWithData} />
	// 			</section>

	// 			{/*  Corporate Wellness ROI */}
	// 			<section className={styles.featuresSection}>
	// 				<h2 className={styles.sectionTitle}>
	// 					{homePageText.corporateWellnessSection.title}
	// 				</h2>
	// 				<div className={styles.twoColumnLayout}>
	// 					<div className={styles.infoCard}>
	// 						<h3 className={styles.subHeading}>
	// 							{homePageText.corporateWellnessSection.beforeSubheading}
	// 						</h3>
	// 						<ul className={styles.checkList}>
	// 							{beforeOLo.map((point, index) => (
	// 								<li key={index} className={styles.checkListItem}>
	// 									{point}
	// 								</li>
	// 							))}
	// 						</ul>
	// 					</div>
	// 					<div className={styles.infoCard}>
	// 						<h3 className={styles.subHeading}>
	// 							{homePageText.corporateWellnessSection.afterSubheading}
	// 						</h3>
	// 						<ul className={styles.checkList}>
	// 							{afterOLo.map((point, index) => (
	// 								<li key={index} className={styles.checkListItem}>
	// 									{point}
	// 								</li>
	// 							))}
	// 						</ul>
	// 					</div>
	// 				</div>
	// 			</section>

	// 			{/*  How It Works */}
	// 			<section id="trust-proof" className={styles.WorksSection}>
	// 				<WorkCard />
	// 			</section>
	// 		</main>
	// 		<Footer />
	// 	</div>
	// );
}
