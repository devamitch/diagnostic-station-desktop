import { ArticlesData, ExercisesData, HospitalsData, ProductsData } from '@/data';
import { ArticleCardData, ExerciseCardData, HospitalCardData, ProductCardData } from '@/types';
import {
	BrainCircuit,
	ChartColumnIncreasing,
	Headset,
	House,
	Laptop,
	Laugh,
	Luggage,
	View,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export const useTranslatedData = () => {
	const t = useTranslations();
	const locale = useLocale();

	// Raw data from translations
	const translatedArticles = t.raw('data.articles');
	const articlesData: ArticleCardData[] = translatedArticles.map(
		(article: any, index: number) => ({
			...article,
			...ArticlesData[index],
		})
	);

	const translatedExercises = t.raw('data.exercises');
	const ExerciseData: ExerciseCardData[] = translatedExercises.map(
		(exercise: any, index: number) => ({
			...exercise,
			...ExercisesData[index],
		})
	);

	const translatedHospitals = t.raw('data.hospitals');
	const hospitalsData: HospitalCardData[] = translatedHospitals.map(
		(hospital: any, index: number) => ({
			...hospital,
			...HospitalsData[index],
		})
	);

	const translatedProducts = t.raw('data.products');
	const productsData: ProductCardData[] = translatedProducts.map(
		(product: any, index: number) => ({
			...product,
			...ProductsData[index],
		})
	);

	const pathnames = {
		'/': t.raw('pathnames./'),
	};

	const reportHistory = t.raw('data.reportHistory');
	const problemPoints = t.raw('data.problemPoints');
	const impactPoints = t.raw('data.impactPoints');
	const businessFeatures = t.raw('data.businessFeatures');
	const beforeOLo = t.raw('data.beforeOLo');
	const afterOLo = t.raw('data.afterOLo');
	const benefitsOrganisationData = t.raw('data.benefitsOrganisation');

	// Text content
	const headerText = {
		logoText: t('header.logoText'),
		signInButton: t('header.signInButton'),
		getStartedButton: t('header.getStartedButton'),
		downloadButton: t('header.downloadButton'),
	};

	const heroText = {
		heading: t('hero.heading'),
		highlight: t('hero.highlight'),
		subheading: t('hero.subheading'),
		getStartedButton: t('hero.getStartedButton'),
		learnMoreButton: t('hero.learnMoreButton'),
		imageAlt: t('hero.imageAlt'),
	};

	const workCardText = {
		headerTitle: t('homepage.workCard.headerTitle'),
		steps: [
			{
				number: t('homepage.workCard.steps.0.number'),
				title: t('homepage.workCard.steps.0.title'),
				description: t('homepage.workCard.steps.0.description'),
			},
			{
				number: t('homepage.workCard.steps.1.number'),
				title: t('homepage.workCard.steps.1.title'),
				description: t('homepage.workCard.steps.1.description'),
			},
			{
				number: t('homepage.workCard.steps.2.number'),
				title: t('homepage.workCard.steps.2.title'),
				description: t('homepage.workCard.steps.2.description'),
			},
		],
		buttonText: t('homepage.workCard.buttonText'),
	};

	const homePageText = {
		whyEyeHealthSection: {
			title: t('homepage.sections.whyEyeHealthSection.title'),
			imageAlt: t('homepage.sections.whyEyeHealthSection.imageAlt'),
			problemSubheading: t('homepage.sections.whyEyeHealthSection.problemSubheading'),
			impactSubheading: t('homepage.sections.whyEyeHealthSection.impactSubheading'),
		},
		featuresSection: {
			title: t('homepage.sections.featuresSection.title'),
		},
		organizationBenefitsSection: {
			title: t('homepage.sections.organizationBenefitsSection.title'),
		},
		builtForBusinessSection: {
			title: t('homepage.sections.builtForBusinessSection.title'),
			imageAlt: t('homepage.sections.builtForBusinessSection.imageAlt'),
		},
		whoWeWorkWithSection: {
			title: t('homepage.sections.whoWeWorkWithSection.title'),
		},
		corporateWellnessSection: {
			title: t('homepage.sections.corporateWellnessSection.title'),
			beforeSubheading: t('homepage.sections.corporateWellnessSection.beforeSubheading'),
			afterSubheading: t('homepage.sections.corporateWellnessSection.afterSubheading'),
		},
	};

	const footerText = {
		copyright: t('footer.copyright'),
		faqText: t('footer.faqText'),
		privacyText: t('footer.privacyText'),
		contactText: t('footer.contactText'),
	};

	const registerFormText = {
		title: t('auth.register.title'),
		subtitle: t('auth.register.subtitle'),
		nameLabel: t('auth.register.nameLabel'),
		namePlaceholder: t('auth.register.namePlaceholder'),
		emailLabel: t('auth.register.emailLabel'),
		emailPlaceholder: t('auth.register.emailPlaceholder'),
		passwordLabel: t('auth.register.passwordLabel'),
		passwordPlaceholder: t('auth.register.passwordPlaceholder'),
		confirmPasswordLabel: t('auth.register.confirmPasswordLabel'),
		confirmPasswordPlaceholder: t('auth.register.confirmPasswordPlaceholder'),
		termsCheckboxText: t('auth.register.termsCheckboxText'),
		termsLinkText: t('auth.register.termsLinkText'),
		andText: t('auth.register.andText'),
		privacyLinkText: t('auth.register.privacyLinkText'),
		loadingButtonText: t('auth.register.loadingButtonText'),
		submitButtonText: t('auth.register.submitButtonText'),
		signInLinkText: t('auth.register.signInLinkText'),
		signInText: t('auth.register.signInText'),
		successMessage: t('auth.register.successMessage'),
		socialDividerText: t('auth.register.socialDividerText'),
		continueWithApple: t('auth.register.continueWithApple'),
		validationErrors: {
			allFieldsRequired: t('auth.register.validationErrors.allFieldsRequired'),
			passwordMinLength: t('auth.register.validationErrors.passwordMinLength'),
			passwordMismatch: t('auth.register.validationErrors.passwordMismatch'),
			invalidEmail: t('auth.register.validationErrors.invalidEmail'),
			termsRequired: t('auth.register.validationErrors.termsRequired'),
		},
		firebaseErrors: {
			emailInUse: t('auth.register.firebaseErrors.emailInUse'),
			weakPassword: t('auth.register.firebaseErrors.weakPassword'),
			invalidEmail: t('auth.register.firebaseErrors.invalidEmail'),
			operationNotAllowed: t('auth.register.firebaseErrors.operationNotAllowed'),
			networkError: t('auth.register.firebaseErrors.networkError'),
			configurationError: t('auth.register.firebaseErrors.configurationError'),
			defaultError: t('auth.register.firebaseErrors.defaultError'),
		},
	};

	const loginFormText = {
		title: t('auth.login.title'),
		subtitle: t('auth.login.subtitle'),
		emailLabel: t('auth.login.emailLabel'),
		emailPlaceholder: t('auth.login.emailPlaceholder'),
		passwordLabel: t('auth.login.passwordLabel'),
		passwordPlaceholder: t('auth.login.passwordPlaceholder'),
		forgotPasswordText: t('auth.login.forgotPasswordText'),
		signInButton: t('auth.login.signInButton'),
		loadingButtonText: t('auth.login.loadingButtonText'),
		successMessage: t('auth.login.successMessage'),
		createAccountText: t('auth.login.createAccountText'),
		createAccountLink: t('auth.login.createAccountLink'),
		resetTitle: t('auth.login.resetTitle'),
		resetSubtitle: t('auth.login.resetSubtitle'),
		sendResetButton: t('auth.login.sendResetButton'),
		resetLoadingText: t('auth.login.resetLoadingText'),
		backToLoginButton: t('auth.login.backToLoginButton'),
		resetSuccessTitle: t('auth.login.resetSuccessTitle'),
		resetSuccessMessage: t('auth.login.resetSuccessMessage'),
		socialDividerText: t('auth.login.socialDividerText'),
		continueWithApple: t('auth.login.continueWithApple'),
		validationErrors: {
			emptyFields: t('auth.login.validationErrors.emptyFields'),
			invalidEmail: t('auth.login.validationErrors.invalidEmail'),
		},
		firebaseErrors: {
			userNotFound: t('auth.login.firebaseErrors.userNotFound'),
			wrongPassword: t('auth.login.firebaseErrors.wrongPassword'),
			invalidCredentials: t('auth.login.firebaseErrors.invalidCredentials'),
			invalidEmailFormat: t('auth.login.firebaseErrors.invalidEmailFormat'),
			accountDisabled: t('auth.login.firebaseErrors.accountDisabled'),
			tooManyAttempts: t('auth.login.firebaseErrors.tooManyAttempts'),
			networkError: t('auth.login.firebaseErrors.networkError'),
			configurationError: t('auth.login.firebaseErrors.configurationError'),
			defaultError: t('auth.login.firebaseErrors.defaultError'),
		},
	};

	const sidebarText = {
		logoText: t('navigation.sidebar.logoText'),
		navItems: [
			{
				title: t('navigation.sidebar.dashboard'),
				url: '/dashboard',
			},
			{
				title: t('navigation.sidebar.liveFeed'),
				url: '/live',
			},
			{
				title: t('navigation.sidebar.icare'),
				url: '/icare',
			},
			{
				title: t('navigation.sidebar.history'),
				url: '/history',
			},
			{
				title: t('navigation.sidebar.settings'),
				url: '/settings',
			},
		],
	};

	const navbarText = {
		searchPlaceholder: t('navigation.navbar.searchPlaceholder'),
		userMenuItems: {
			profile: t('navigation.navbar.profile'),
			settings: t('navigation.navbar.settings'),
			logout: t('navigation.navbar.logout'),
		},
		userMenuLabel: t('navigation.navbar.userMenuLabel'),
		profileAlt: t('navigation.navbar.profileAlt'),
		dropdownItems: [
			{
				label: t('navigation.navbar.profile'),
				href: '/profile',
			},
			{
				label: t('navigation.navbar.settings'),
				href: '/settings',
			},
			{
				label: t('navigation.navbar.logout'),
			},
		],
	};

	const dashboardPageText = {
		errorMessage: t('dashboard.errorMessage'),
		retryButton: t('dashboard.retryButton'),
		eyeScanReportTitle: t('dashboard.eyeScanReportTitle'),
		articlesTitle: t('dashboard.articlesTitle'),
	};

	const reportHistoryText = {
		timeFilters: {
			today: t('history.timeFilters.today'),
			week: t('history.timeFilters.week'),
			month: t('history.timeFilters.month'),
			year: t('history.timeFilters.year'),
		},
		viewModes: {
			chartView: t('history.viewModes.chartView'),
			tableView: t('history.viewModes.tableView'),
			chart: t('history.viewModes.chart'),
			table: t('history.viewModes.table'),
		},
		actions: {
			quickView: t('history.actions.quickView'),
			viewReport: t('history.actions.viewReport'),
		},
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		statusTypes: {
			blinkRate: t('reports.statusTypes.blinkRate'),
			eyeStrain: t('reports.statusTypes.eyeStrain'),
		},
		tooltipUnits: {
			blinks: t('units.blinksPerMin'),
			percentage: t('units.percentage'),
			level: t('units.level'),
		},
		chartTitles: {
			blinkRate: t('history.chartTitles.blinkRate'),
			eyeClosure: t('history.chartTitles.eyeClosure'),
			attention: t('history.chartTitles.attention'),
			strainLevel: t('history.chartTitles.strainLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			screenTime: t('history.chartTitles.screenTime'),
			overallHealth: t('history.chartTitles.overallHealth'),
			screenDistance: t('history.chartTitles.screenDistance'),
		},
		tableHeaders: {
			date: t('history.tableHeaders.date'),
			results: t('history.tableHeaders.results'),
			actions: t('history.tableHeaders.actions'),
		},
		emptyState: {
			noHistory: t('history.emptyState.noHistory'),
			selectedDate: t('history.emptyState.selectedDate'),
			startTracking: t('history.emptyState.startTracking'),
		},
		lastUpdate: t('history.lastUpdate'),
	};

	const eyeMetricsDisplayText = {
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			eyeStrain: t('eyeMetrics.labels.eyeStrain'),
			tiredness: t('eyeMetrics.labels.tiredness'),
			attentionLevel: t('eyeMetrics.labels.attentionLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			faceAge: t('eyeMetrics.labels.faceAge'),
			eyeAspectRatio: t('eyeMetrics.labels.eyeAspectRatio'),
			pupilDilation: t('eyeMetrics.labels.pupilDilation'),
			squintIntensity: t('eyeMetrics.labels.squintIntensity'),
			rednessScore: t('eyeMetrics.labels.rednessScore'),
			drynessScore: t('eyeMetrics.labels.drynessScore'),
			proximityScore: t('eyeMetrics.labels.proximityScore'),
			batteryLevel: t('eyeMetrics.labels.batteryLevel'),
			darkCircleScore: t('eyeMetrics.labels.darkCircleScore'),
		},
		recommendedValues: {
			blinkRate: t('eyeMetrics.recommendedValues.blinkRate'),
			eyeClosure: t('eyeMetrics.recommendedValues.eyeClosure'),
			eyeStrain: t('eyeMetrics.recommendedValues.eyeStrain'),
			tiredness: t('eyeMetrics.recommendedValues.tiredness'),
			attentionLevel: t('eyeMetrics.recommendedValues.attentionLevel'),
			eyeAge: t('eyeMetrics.recommendedValues.eyeAge'),
			faceAge: t('eyeMetrics.recommendedValues.faceAge'),
			eyeAspectRatio: t('eyeMetrics.recommendedValues.eyeAspectRatio'),
			pupilDilation: t('eyeMetrics.recommendedValues.pupilDilation'),
			squintIntensity: t('eyeMetrics.recommendedValues.squintIntensity'),
			rednessScore: t('eyeMetrics.recommendedValues.rednessScore'),
			drynessScore: t('eyeMetrics.recommendedValues.drynessScore'),
			proximityScore: t('eyeMetrics.recommendedValues.proximityScore'),
			darkcircleScore: t('eyeMetrics.recommendedValues.darkCircleScore'),
		},
		units: {
			years: t('units.years'),
		},
	};

	const eyeMetricsStreamText = {
		title: t('eyeMetrics.stream.title'),
		liveIndicator: t('eyeMetrics.stream.liveIndicator'),
		currentMetrics: t('eyeMetrics.stream.currentMetrics'),
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			strainLevel: t('eyeMetrics.labels.strainLevel'),
			attention: t('eyeMetrics.labels.attention'),
		},
		units: {
			bpm: t('units.bpm'),
			close: t('units.close'),
			strain: t('units.strain'),
		},
		attentionStates: {
			good: t('eyeMetrics.attentionStates.good'),
			poor: t('eyeMetrics.attentionStates.poor'),
		},
		placeholder: t('eyeMetrics.stream.placeholder'),
	};

	const camScreenText = {
		loadingStates: {
			startingTracking: t('live.loadingStates.startingTracking'),
			initializingCamera: t('live.loadingStates.initializingCamera'),
		},
		retryButton: t('common.retry'),
	};

	const reportCardText = {
		title: t('reports.card.title'),
		subtitle: t('reports.card.subtitle'),
		conditions: {
			high: t('reports.conditions.high'),
			moderate: t('reports.conditions.moderate'),
			normal: t('reports.conditions.normal'),
		},
		statsFooter: t('reports.card.statsFooter'),
	};

	const productivityHealthText = {
		emotions: {
			Boredom: t('dashboard.productivityHealth.emotions.Boredom'),
			Flow: t('dashboard.productivityHealth.emotions.Flow'),
			Control: t('dashboard.productivityHealth.emotions.Control'),
			Relax: t('dashboard.productivityHealth.emotions.Relax'),
			Apathy: t('dashboard.productivityHealth.emotions.Apathy'),
			Worry: t('dashboard.productivityHealth.emotions.Worry'),
			Anxiety: t('dashboard.productivityHealth.emotions.Anxiety'),
			Arousal: t('dashboard.productivityHealth.emotions.Arousal'),
		},
		states: {
			Good: t('dashboard.productivityHealth.states.Good'),
			Moderate: t('dashboard.productivityHealth.states.Moderate'),
			High: t('dashboard.productivityHealth.states.High'),
		},
		centerText: t('dashboard.productivityHealth.centerText'),
		centerSubtext: t('dashboard.productivityHealth.centerSubtext'),
	};

	const modalViewText = {
		metricCards: {
			blinkRate: {
				title: t('eyeMetrics.labels.blinkRate'),
				unit: t('units.blinksPerMin'),
			},
			eyeClosure: {
				title: t('eyeMetrics.labels.eyeClosure'),
				unit: 'closure percentage',
			},
			attentionLevel: {
				title: t('eyeMetrics.labels.attentionLevel'),
				unit: 'attention score',
			},
			strainLevel: {
				title: t('eyeMetrics.labels.strainLevel'),
				unit: 'strain intensity',
			},
			tirednessLevel: {
				title: t('eyeMetrics.labels.tiredness'),
				unit: 'fatigue level',
			},
			eyeAspectRatio: {
				title: t('eyeMetrics.labels.eyeAspectRatio'),
				unit: t('units.ratio'),
			},
		},
	};

	const metricCardsText = {
		defaultStatus: t('reports.statusLabels.normal'),
		highUsage: t('highUsage.title'),
		tooltipSuffixes: {
			blinksPerMin: ' ' + t('units.blinksPerMin'),
			percentage: t('units.percentage'),
			level: ' ' + t('units.level'),
		},
		strainLevels: [
			t('eyeMetrics.strainLevels.low'),
			t('eyeMetrics.strainLevels.moderate'),
			t('eyeMetrics.strainLevels.high'),
		],
	};

	const metricInfoPopupText = {
		sectionTitles: {
			healthyRange: t('metricInfoPopup.sectionTitles.healthyRange'),
			whyItMatters: t('metricInfoPopup.sectionTitles.whyItMatters'),
			quickWin: t('metricInfoPopup.sectionTitles.quickWin'),
		},
	};

	const historyPageText = {
		title: t('history.title'),
		subtitle: t('history.subtitle'),
		viewingData: t('history.viewingData'),
		today: t('history.timeFilters.today'),
		eyeCareReport: t('history.eyeCareReport'),
		monthlyReport: t('history.monthlyReport'),
		annualReport: t('history.annualReport'),
		monthlyDate: 'April 16',
		annualDate: 'January 15',
		allRecordsSecure: t('history.allRecordsSecure'),
		exportAllData: t('history.exportAllData'),
	};

	const reportPageText = {
		reportNotFound: t('reports.page.reportNotFound'),
		reportNotFoundDesc: t('reports.page.reportNotFoundDesc'),
		backToHistory: t('reports.page.backToHistory'),
		eyeScanReport: t('reports.page.eyeScanReport'),
		overallStatus: t('reports.page.overallStatus'),
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeStrainLevel: t('eyeMetrics.labels.eyeStrain'),
			tirednessLevel: t('eyeMetrics.labels.tiredness'),
			attentionLevel: t('eyeMetrics.labels.attentionLevel'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			perclose: t('reports.normalRanges.perclose'),
		},
		normalRanges: {
			blinkRate: t('reports.normalRanges.blinkRate'),
			perclose: t('reports.normalRanges.perclose'),
		},
		units: {
			blinksPerMin: ' ' + t('units.blinksPerMin'),
			years: ' ' + t('units.years'),
			percentage: t('units.percentage'),
		},
	};

	const historyReportText = {
		title: 'Eye Scan Report History',
		filters: {
			scanTypePlaceholder: 'Scan type',
		},
		tableHeaders: {
			date: t('history.tableHeaders.date'),
			results: t('history.tableHeaders.results'),
			actions: t('history.tableHeaders.actions'),
		},
		statusLabels: {
			normal: t('reports.statusLabels.normal'),
			blinkRate: t('reports.statusLabels.blinkRate'),
			eyeStrain: t('reports.statusLabels.eyeStrain'),
		},
		statusTypes: {
			blinkRate: t('reports.statusTypes.blinkRate'),
			eyeStrain: t('reports.statusTypes.eyeStrain'),
		},
		actions: {
			quickView: t('history.actions.quickView'),
			viewReport: t('history.actions.viewReport'),
		},
		emptyState: {
			noHistory: t('history.emptyState.noHistory'),
			startTracking: t('history.emptyState.startTracking'),
		},
	};

	const icarePageText = {
		sectionTitles: {
			eyeExercises: t('icare.sectionTitles.eyeExercises'),
			eyeProducts: t('icare.sectionTitles.eyeProducts'),
			eyeSpecialists: t('icare.sectionTitles.eyeSpecialists'),
		},
	};

	const exerciseModalText = {
		comparisonTitle: t('icare.exerciseModal.comparisonTitle'),
		metricLabels: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeClosure: t('eyeMetrics.labels.eyeClosure'),
			strainLevel: t('eyeMetrics.labels.strainLevel'),
			attention: t('eyeMetrics.labels.attention'),
		},
		attentionStates: {
			good: t('eyeMetrics.attentionStates.good'),
			poor: t('eyeMetrics.attentionStates.poor'),
		},
		units: {
			bpm: ' ' + t('units.bpm'),
		},
		buttons: {
			markComplete: t('icare.exerciseModal.buttons.markComplete'),
			restart: t('icare.exerciseModal.buttons.restart'),
		},
	};

	const hospitalModalText = {
		actionButtons: {
			website: t('icare.hospitalModal.actionButtons.website'),
			directions: t('icare.hospitalModal.actionButtons.directions'),
			reviews: t('icare.hospitalModal.actionButtons.reviews'),
		},
		detailLabels: {
			address: t('icare.hospitalModal.detailLabels.address'),
			getThere: t('icare.hospitalModal.detailLabels.getThere'),
			hours: t('icare.hospitalModal.detailLabels.hours'),
		},
	};

	const productModalText = {
		aboutProduct: t('icare.productModal.aboutProduct'),
		buyNow: t('icare.productModal.buyNow'),
	};

	const livePageText = {
		errorRetry: t('live.errorRetry'),
		metricNames: {
			blinkRate: t('eyeMetrics.labels.blinkRate'),
			eyeStrain: t('eyeMetrics.labels.eyeStrain'),
			eyeAge: t('eyeMetrics.labels.eyeAge'),
			screenTime: t('common.screenTime'),
		},
		units: {
			perMin: t('units.blinksPerMin'),
			level: t('units.level'),
			years: t('units.years'),
		},
		hero: {
			title: t('live.hero.title'),
			subtitle: t('live.hero.subtitle'),
		},
		eyeScan: {
			title: t('live.eyeScan.title'),
			subtitle: t('live.eyeScan.subtitle'),
			startButton: t('live.eyeScan.startButton'),
			stopButton: t('live.eyeScan.stopButton'),
			completedTitle: t('live.eyeScan.completedTitle'),
			completedSubtitle: t('live.eyeScan.completedSubtitle'),
			beforeScan: t('live.eyeScan.beforeScan'),
			afterScan: t('live.eyeScan.afterScan'),
			closeButton: t('live.eyeScan.closeButton'),
			metricLabels: {
				blinkRate: t('live.eyeScan.metricLabels.blinkRate'),
				eyeClosure: t('live.eyeScan.metricLabels.eyeClosure'),
				strainLevel: t('live.eyeScan.metricLabels.strainLevel'),
				attention: t('live.eyeScan.metricLabels.attention'),
			},
			attentionStates: {
				good: t('live.eyeScan.attentionStates.good'),
				poor: t('live.eyeScan.attentionStates.poor'),
			},
		},
	};

	const profilePageText = {
		sectionTitles: {
			recentEyeScan: t('profile.sectionTitles.recentEyeScan'),
			scanHistory: t('profile.sectionTitles.scanHistory'),
			personalisedAdvice: t('profile.sectionTitles.personalisedAdvice'),
		},
		recentScan: {
			title: t('profile.recentScan.title'),
			confidenceLabel: t('profile.recentScan.confidenceLabel'),
			viewFullReport: t('profile.recentScan.viewFullReport'),
		},
		scanHistory: {
			title: t('profile.scanHistory.title'),
			description: t('profile.scanHistory.description'),
		},
		profileCard: {
			ctaButton: t('profile.profileCard.ctaButton'),
		},
	};

	const settingsPageText = {
		sectionTitles: {
			accountSettings: t('settings.sectionTitles.accountSettings'),
			aiScanSettings: t('settings.sectionTitles.aiScanSettings'),
			discoveryPreferences: t('settings.sectionTitles.discoveryPreferences'),
			notification: t('settings.sectionTitles.notification'),
			privacyData: t('settings.sectionTitles.privacyData'),
			helpSupport: t('settings.sectionTitles.helpSupport'),
			dataSync: t('settings.sectionTitles.dataSync'),
			appUpdates: t('settings.sectionTitles.appUpdates'),
		},
		accountSettings: {
			profileInfo: t('settings.accountSettings.profileInfo'),
			changePassword: t('settings.accountSettings.changePassword'),
			passwordDialog: {
				currentPassword: t('settings.accountSettings.passwordDialog.currentPassword'),
				newPassword: t('settings.accountSettings.passwordDialog.newPassword'),
				confirmPassword: t('settings.accountSettings.passwordDialog.confirmPassword'),
				changingText: t('settings.accountSettings.passwordDialog.changingText'),
				changePasswordButton: t(
					'settings.accountSettings.passwordDialog.changePasswordButton'
				),
				cancelButton: t('settings.accountSettings.passwordDialog.cancelButton'),
			},
		},
		discoveryPreferences: {
			specialistRegion: t('settings.discoveryPreferences.specialistRegion'),
			productCategories: t('settings.discoveryPreferences.productCategories'),
			regions: {
				canada: t('settings.discoveryPreferences.regions.canada'),
				korea: t('settings.discoveryPreferences.regions.korea'),
			},
			categories: {
				glasses: t('settings.discoveryPreferences.categories.glasses'),
				gadgets: t('settings.discoveryPreferences.categories.gadgets'),
				supplements: t('settings.discoveryPreferences.categories.supplements'),
				eyedrops: t('settings.discoveryPreferences.categories.eyedrops'),
			},
		},
		aiScanSettings: {
			autoSaveScanHistory: t('settings.aiScanSettings.autoSaveScanHistory'),
			autoShareScans: t('settings.aiScanSettings.autoShareScans'),
			predictionSensitivity: t('settings.aiScanSettings.predictionSensitivity'),
		},
		notifications: {
			screenDistanceAlert: t('settings.notifications.screenDistanceAlert'),
			screenDistanceAlertDesc: t('settings.notifications.screenDistanceAlertDesc'),
			eyeStrainAlert: t('settings.notifications.eyeStrainAlert'),
			eyeStrainAlertDesc: t('settings.notifications.eyeStrainAlertDesc'),
			batteryDrainingAlert: t('settings.notifications.batteryDrainingAlert'),
			batteryDrainingAlertDesc: t('settings.notifications.batteryDrainingAlertDesc'),
			lightingAlert: t('settings.notifications.lightingAlert'),
			lightingAlertDesc: t('settings.notifications.lightingAlertDesc'),
			screenTimeAlert: t('settings.notifications.screenTimeAlert'),
			screenTimeAlertDesc: t('settings.notifications.screenTimeAlertDesc'),
			saveChanges: t('settings.notifications.saveChanges'),
			settingsUpdated: t('settings.notifications.settingsUpdated'),
			messages: {
				eyeStrain: t('settings.notifications.messages.eyeStrain'),
				screenDistance: t('settings.notifications.messages.screenDistance'),
				screenTime: t('settings.notifications.messages.screenTime'),
				batteryDraining: t('settings.notifications.messages.batteryDraining'),
				lighting: t('settings.notifications.messages.lighting'),
			},
		},
		dataSync: {
			online: t('settings.dataSync.online'),
			offline: t('settings.dataSync.offline'),
			syncing: t('settings.dataSync.syncing'),
			syncComplete: t('settings.dataSync.syncComplete'),
			readyToSync: t('settings.dataSync.readyToSync'),
			offlineMessage: t('settings.dataSync.offlineMessage'),
			syncButton: t('settings.dataSync.syncButton'),
			syncingButton: t('settings.dataSync.syncingButton'),
			syncAgainButton: t('settings.dataSync.syncAgainButton'),
		},
		appUpdates: {
			version: t('settings.appUpdates.version'),
			checkingForUpdates: t('settings.appUpdates.checkingForUpdates'),
			installAndRestart: t('settings.appUpdates.installAndRestart'),
			checkForUpdates: t('settings.appUpdates.checkForUpdates'),
			checking: t('settings.appUpdates.checking'),
			autoUpdateInfo: t('settings.appUpdates.autoUpdateInfo'),
		},
		privacyData: {
			appPermission: t('settings.privacyData.appPermission'),
			downloadMyData: t('settings.privacyData.downloadMyData'),
			deleteMyData: t('settings.privacyData.deleteMyData'),
		},
		helpSupport: {
			faq: t('settings.helpSupport.faq'),
			contactUs: t('settings.helpSupport.contactUs'),
			termsPrivacy: t('settings.helpSupport.termsPrivacy'),
		},
		accountDeletion: {
			initial: {
				title: t('settings.accountDeletion.initial.title'),
				subtitle: t('settings.accountDeletion.initial.subtitle'),
				gracePeriod: {
					title: t('settings.accountDeletion.initial.gracePeriod.title'),
					description: t('settings.accountDeletion.initial.gracePeriod.description'),
				},
				easyRecovery: {
					title: t('settings.accountDeletion.initial.easyRecovery.title'),
					description: t('settings.accountDeletion.initial.easyRecovery.description'),
				},
				permanentAfterGracePeriod: {
					title: t('settings.accountDeletion.initial.permanentAfterGracePeriod.title'),
					description: t('settings.accountDeletion.initial.permanentAfterGracePeriod.description'),
				},
				privacyNote: t('settings.accountDeletion.initial.privacyNote'),
				keepAccountButton: t('settings.accountDeletion.initial.keepAccountButton'),
				continueToDeleteButton: t('settings.accountDeletion.initial.continueToDeleteButton'),
			},
			reasons: {
				title: t('settings.accountDeletion.reasons.title'),
				subtitle: t('settings.accountDeletion.reasons.subtitle'),
				reasons: {
					privacy: t('settings.accountDeletion.reasons.reasons.privacy'),
					notUseful: t('settings.accountDeletion.reasons.reasons.notUseful'),
					tooComplex: t('settings.accountDeletion.reasons.reasons.tooComplex'),
					technical: t('settings.accountDeletion.reasons.reasons.technical'),
					inaccurate: t('settings.accountDeletion.reasons.reasons.inaccurate'),
					switching: t('settings.accountDeletion.reasons.reasons.switching'),
					temporary: t('settings.accountDeletion.reasons.reasons.temporary'),
					other: t('settings.accountDeletion.reasons.reasons.other'),
				},
				otherReasonPlaceholder: t('settings.accountDeletion.reasons.otherReasonPlaceholder'),
				feedbackNote: t('settings.accountDeletion.reasons.feedbackNote'),
				backButton: t('settings.accountDeletion.reasons.backButton'),
				nextButton: t('settings.accountDeletion.reasons.nextButton'),
			},
			gracePeriod: {
				title: t('settings.accountDeletion.gracePeriod.title'),
				subtitle: t('settings.accountDeletion.gracePeriod.subtitle'),
				options: {
					'30Days': {
						label: t('settings.accountDeletion.gracePeriod.options.30Days.label'),
						description: t('settings.accountDeletion.gracePeriod.options.30Days.description'),
					},
					'45Days': {
						label: t('settings.accountDeletion.gracePeriod.options.45Days.label'),
						description: t('settings.accountDeletion.gracePeriod.options.45Days.description'),
					},
					'90Days': {
						label: t('settings.accountDeletion.gracePeriod.options.90Days.label'),
						description: t('settings.accountDeletion.gracePeriod.options.90Days.description'),
					},
				},
				recoveryInfo: {
					title: t('settings.accountDeletion.gracePeriod.recoveryInfo.title'),
					description: t.raw('settings.accountDeletion.gracePeriod.recoveryInfo.description'),
				},
				backButton: t('settings.accountDeletion.gracePeriod.backButton'),
				nextButton: t('settings.accountDeletion.gracePeriod.nextButton'),
			},
			finalConfirm: {
				title: t('settings.accountDeletion.finalConfirm.title'),
				subtitle: t('settings.accountDeletion.finalConfirm.subtitle'),
				summaryTitle: t('settings.accountDeletion.finalConfirm.summaryTitle'),
				summaryLabels: {
					account: t('settings.accountDeletion.finalConfirm.summaryLabels.account'),
					gracePeriod: t('settings.accountDeletion.finalConfirm.summaryLabels.gracePeriod'),
					permanentDeletionAfter: t('settings.accountDeletion.finalConfirm.summaryLabels.permanentDeletionAfter'),
					yourReasons: t('settings.accountDeletion.finalConfirm.summaryLabels.yourReasons'),
				},
				whatHappensNext: {
					title: t('settings.accountDeletion.finalConfirm.whatHappensNext.title'),
					steps: t.raw('settings.accountDeletion.finalConfirm.whatHappensNext.steps'),
				},
				backButton: t('settings.accountDeletion.finalConfirm.backButton'),
				deleteButton: t('settings.accountDeletion.finalConfirm.deleteButton'),
				deletingText: t('settings.accountDeletion.finalConfirm.deletingText'),
			},
			success: {
				title: t('settings.accountDeletion.success.title'),
				subtitle: t.raw('settings.accountDeletion.success.subtitle'),
				whatYouNeedToKnow: {
					title: t('settings.accountDeletion.success.whatYouNeedToKnow.title'),
					steps: t.raw('settings.accountDeletion.success.whatYouNeedToKnow.steps'),
				},
				goodbyeMessage: t('settings.accountDeletion.success.goodbyeMessage'),
				goodbyeNote: t('settings.accountDeletion.success.goodbyeNote'),
				redirectInfo: t('settings.accountDeletion.success.redirectInfo'),
			},
		},
		deleteAccount: {
			sectionTitle: t('settings.deleteAccount.sectionTitle'),
			deleteButton: t('settings.deleteAccount.deleteButton'),
			deleteSubtitle: t('settings.deleteAccount.deleteSubtitle'),
			warningText: t('settings.deleteAccount.warningText'),
		},
		logOut: t('settings.logOut'),
	};

	const contactUsText = {
		title: t('contactUs.title'),
		subtitle: t('contactUs.subtitle'),
		companyName: t('contactUs.companyName'),
		email: t('contactUs.email'),
		emailAddress: t('contactUs.emailAddress'),
		description: t('contactUs.description'),
		officeHours: t('contactUs.officeHours'),
		officeHoursText: t('contactUs.officeHoursText'),
	};

	const privacyPolicyText = {
		title: t('privacyPolicy.title'),
		lastUpdated: t('privacyPolicy.lastUpdated'),
		intro: t('privacyPolicy.intro'),
		sections: {
			dataCollection: {
				title: t('privacyPolicy.sections.dataCollection.title'),
				content: t('privacyPolicy.sections.dataCollection.content'),
				items: t.raw('privacyPolicy.sections.dataCollection.items'),
			},
			dataUsage: {
				title: t('privacyPolicy.sections.dataUsage.title'),
				content: t('privacyPolicy.sections.dataUsage.content'),
				items: t.raw('privacyPolicy.sections.dataUsage.items'),
			},
			dataSecurity: {
				title: t('privacyPolicy.sections.dataSecurity.title'),
				content: t('privacyPolicy.sections.dataSecurity.content'),
				items: t.raw('privacyPolicy.sections.dataSecurity.items'),
			},
			yourRights: {
				title: t('privacyPolicy.sections.yourRights.title'),
				content: t('privacyPolicy.sections.yourRights.content'),
				items: t.raw('privacyPolicy.sections.yourRights.items'),
			},
			dataRetention: {
				title: t('privacyPolicy.sections.dataRetention.title'),
				content: t('privacyPolicy.sections.dataRetention.content'),
			},
			contact: {
				title: t('privacyPolicy.sections.contact.title'),
				content: t('privacyPolicy.sections.contact.content'),
			},
		},
	};

	const faqText = {
		title: t('faq.title'),
		subtitle: t('faq.subtitle'),
		questions: t.raw('faq.questions'),
	};

	const downloadPageText = {
		title: t('download.title'),
		description: t('download.description'),
		hero: {
			title: t('download.hero.title'),
			subtitle: t('download.hero.subtitle'),
		},
		mobile: {
			ios: {
				title: t('download.mobile.ios.title'),
				description: t('download.mobile.ios.description'),
				button: t('download.mobile.ios.button'),
			},
			android: {
				title: t('download.mobile.android.title'),
				description: t('download.mobile.android.description'),
				button: t('download.mobile.android.button'),
			},
		},
		desktop: {
			macos: {
				title: t('download.desktop.macos.title'),
				description: t('download.desktop.macos.description'),
				button: t('download.desktop.macos.button'),
			},
			windows: {
				title: t('download.desktop.windows.title'),
				description: t('download.desktop.windows.description'),
				button: t('download.desktop.windows.button'),
			},
		},
	};

	// Mock reports with data from translations
	const mockReport = {
		...t.raw('data.mockReport'),
		emoji: Laugh,
	};

	const mockReportBrief = t.raw('data.mockReportBrief');

	// Feature data with icons
	const featureData = [
		{
			icon: House,
			...t.raw('data.features')[0],
		},
		{
			icon: BrainCircuit,
			...t.raw('data.features')[1],
		},
		{
			icon: View,
			...t.raw('data.features')[2],
		},
		{
			icon: ChartColumnIncreasing,
			...t.raw('data.features')[3],
		},
	];

	// Who we work with data with icons
	const whoWeWorkWithData = [
		{
			icon: House,
			...t.raw('data.whoWeWorkWith')[0],
		},
		{
			icon: Headset,
			...t.raw('data.whoWeWorkWith')[1],
		},
		{
			icon: Luggage,
			...t.raw('data.whoWeWorkWith')[2],
		},
		{
			icon: Laptop,
			...t.raw('data.whoWeWorkWith')[3],
		},
	];
	const supportPageText = {
		title: t('supportPage.title'),
		subtitle: t('supportPage.subtitle'),
		email: {
			title: t('supportPage.email.title'),
			description: t('supportPage.email.description'),
			address: t('supportPage.email.address'),
			responseTime: t('supportPage.email.responseTime'),
		},
		inApp: {
			title: t('supportPage.inApp.title'),
			description: t('supportPage.inApp.description'),
			location: t('supportPage.inApp.location'),
			availability: t('supportPage.inApp.availability'),
		},
		helpCenter: {
			title: t('supportPage.helpCenter.title'),
			description: t('supportPage.helpCenter.description'),
			link: t('supportPage.helpCenter.link'),
			articles: t('supportPage.helpCenter.articles'),
		},
		form: {
			title: t('supportPage.form.title'),
			description: t('supportPage.form.description'),
			nameLabel: t('supportPage.form.nameLabel'),
			namePlaceholder: t('supportPage.form.namePlaceholder'),
			emailLabel: t('supportPage.form.emailLabel'),
			emailPlaceholder: t('supportPage.form.emailPlaceholder'),
			subjectLabel: t('supportPage.form.subjectLabel'),
			subjectPlaceholder: t('supportPage.form.subjectPlaceholder'),
			subjectOptions: t.raw('supportPage.form.subjectOptions'),
			messageLabel: t('supportPage.form.messageLabel'),
			messagePlaceholder: t('supportPage.form.messagePlaceholder'),
			submit: t('supportPage.form.submit'),
			submitted: t('supportPage.form.submitted'),
			successMessage: t('supportPage.form.successMessage'),
		},
		quickLinks: {
			title: t('supportPage.quickLinks.title'),
			faq: t('supportPage.quickLinks.faq'),
			faqDescription: t('supportPage.quickLinks.faqDescription'),
			privacy: t('supportPage.quickLinks.privacy'),
			privacyDescription: t('supportPage.quickLinks.privacyDescription'),
			terms: t('supportPage.quickLinks.terms'),
			termsDescription: t('supportPage.quickLinks.termsDescription'),
		},
		officeHours: {
			title: t('supportPage.officeHours.title'),
			hours: t('supportPage.officeHours.hours'),
			note: t('supportPage.officeHours.note'),
		},
	};

	const termsPageText = {
		title: t('termsPage.title'),
		lastUpdated: t('termsPage.lastUpdated'),
		intro: t('termsPage.intro'),
		sections: {
			acceptance: {
				title: t('termsPage.sections.acceptance.title'),
				content: t('termsPage.sections.acceptance.content'),
			},
			description: {
				title: t('termsPage.sections.description.title'),
				content: t('termsPage.sections.description.content'),
				items: t.raw('termsPage.sections.description.items'),
			},
			medicalDisclaimer: {
				title: t('termsPage.sections.medicalDisclaimer.title'),
				content: t('termsPage.sections.medicalDisclaimer.content'),
				items: t.raw('termsPage.sections.medicalDisclaimer.items'),
			},
			userResponsibilities: {
				title: t('termsPage.sections.userResponsibilities.title'),
				content: t('termsPage.sections.userResponsibilities.content'),
				items: t.raw('termsPage.sections.userResponsibilities.items'),
			},
			privacyData: {
				title: t('termsPage.sections.privacyData.title'),
				content: t('termsPage.sections.privacyData.content'),
			},
			intellectualProperty: {
				title: t('termsPage.sections.intellectualProperty.title'),
				content: t('termsPage.sections.intellectualProperty.content'),
			},
			limitation: {
				title: t('termsPage.sections.limitation.title'),
				content: t('termsPage.sections.limitation.content'),
			},
			termination: {
				title: t('termsPage.sections.termination.title'),
				content: t('termsPage.sections.termination.content'),
			},
			changes: {
				title: t('termsPage.sections.changes.title'),
				content: t('termsPage.sections.changes.content'),
			},
			governingLaw: {
				title: t('termsPage.sections.governingLaw.title'),
				content: t('termsPage.sections.governingLaw.content'),
			},
			contact: {
				title: t('termsPage.sections.contact.title'),
				content: t('termsPage.sections.contact.content'),
			},
		},
	};

	return {
		// Raw data arrays
		articlesData,
		ExerciseData,
		hospitalsData,
		productsData,
		reportHistory,
		problemPoints,
		impactPoints,
		businessFeatures,
		beforeOLo,
		afterOLo,
		benefitsOrganisationData,

		// Text objects
		headerText,
		heroText,
		workCardText,
		homePageText,
		footerText,
		registerFormText,
		loginFormText,
		sidebarText,
		navbarText,
		dashboardPageText,
		reportHistoryText,
		eyeMetricsDisplayText,
		eyeMetricsStreamText,
		camScreenText,
		reportCardText,
		productivityHealthText,
		modalViewText,
		metricCardsText,
		metricInfoPopupText,
		historyPageText,
		reportPageText,
		historyReportText,
		icarePageText,
		exerciseModalText,
		hospitalModalText,
		productModalText,
		livePageText,
		profilePageText,
		settingsPageText,
		accountDeletionText: settingsPageText.accountDeletion,
		contactUsText,
		privacyPolicyText,
		faqText,
		downloadPageText,

		// Mock reports
		mockReport,
		mockReportBrief,

		// Data with icons
		featureData,
		whoWeWorkWithData,
		pathnames,

		//
		supportPageText,
		termsPageText,
	};
};

export default useTranslatedData;