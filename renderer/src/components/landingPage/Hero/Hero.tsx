'use client';
import useTranslationData from '@/hooks/use-translation-data';
import { Link } from '@/i18n/navigation';
import useAppStore from '@/store';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import styles from './Hero.module.css';

function Hero() {
	const { heroText } = useTranslationData();
		const hasTokenOrIsLoggedIn = useAppStore(state=>!!state.auth.token );

		console.log({hasTokenOrIsLoggedIn})
	return (
		<section className={styles.heroSection}>
			<div className={styles.content}>
				<p className={styles.heading}>
				<span>	{heroText.heading}</span>
					<span className={styles.highlight}>{heroText.highlight}</span>
					<span className={styles.subheading}>{heroText.subheading}</span>
				</p>
				
				<div className={styles.buttonGroup}>
					
					<Link href={hasTokenOrIsLoggedIn? "/dashboard" : "/register" } className={styles.btnsignin}>
						<p>{heroText.getStartedButton}</p>
						<ArrowRight className={styles.btnIcon} />
					</Link>
					<Link href="#how-it-works" className={styles.btnWork}>
						{heroText.learnMoreButton}
					</Link>
				</div>
			</div>
			<Image
				src="/hero1.svg"
				alt={heroText.imageAlt}
				width={500}
				height={500}
				className={styles.image}
			/>
		</section>
	);
}

export default Hero;
