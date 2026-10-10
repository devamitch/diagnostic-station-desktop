import LoginForm from '@/components/auth/LoginForm/LoginForm';
import useTranslationData from '@/hooks/use-translation-data';
import Image from 'next/image';
import Link from 'next/link';
import styles from './signin.module.css';

export default function SignIn() {
	const { heroText } = useTranslationData();
	const { loginFormText } = useTranslationData();
	return (
		<div className={styles.container}>
			<div className={styles.welcomeContainer}>
				<div className={styles.textContainer}>
					<p className={styles.heading}>
						{heroText.heading}{' '}
						<span className={styles.highlight}>{heroText.highlight}</span>
					</p>
					<p className={styles.heroSubtitle}>{heroText.subheading}</p>
					<div className={styles.linkContainer}>
						{loginFormText.createAccountText}{' '}
						<Link href="/register" className={styles.link}>
							{loginFormText.createAccountLink}
						</Link>
					</div>
				</div>

				<Image
					src="/authpage.png"
					alt="Welcome"
					width={550}
					height={550}
					className={styles.image}
				/>
			</div>
			<div className={styles.formContainer}>
				<LoginForm />
			</div>
		</div>
	);
}
