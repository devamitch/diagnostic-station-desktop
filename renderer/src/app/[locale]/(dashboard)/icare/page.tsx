'use client';
import ExerciseCard from '@/components/icare/ExerciseCard/ExerciseCard';
import ExerciseModal from '@/components/icare/ExerciseModal/ExerciseModal';
import HospitalCard from '@/components/icare/HospitalCard/hospitalCard';
import HospitalModal from '@/components/icare/HospitalModal/HospitalModal';
import ProductCard from '@/components/icare/ProductCard/ProductCard';
import ProductModal from '@/components/icare/ProductModal/ProductModal';
import TitleHeader from '@/components/layout/Title/TitleHeader';
import useTranslationData from '@/hooks/use-translation-data';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { ExerciseCardData, HospitalCardData, ProductCardData } from '@/types';
import { useState, useRef } from 'react';
import styles from './IcarePage.module.css';
import { useExercises } from '@/hooks/use-excercise';

export default function ICarePage() {
	const { ExerciseData, hospitalsData, productsData, icarePageText } = useTranslationData();
	const { data: exercises, isLoading, isError, error } = useExercises();
	const [selectedProduct, setSelectedProduct] = useState<ProductCardData | null>(null);
	const [isProductModalOpen, setIsProductModalOpen] = useState(false);
	const [selectedExercise, setSelectedExercise] = useState<ExerciseCardData | null>(null);
	const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
	const [selectedHospital, setSelectedHospital] = useState<HospitalCardData | null>(null);
	const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

	const { metrics } = useEyeTrackingContext();

	const exerciseScrollRef = useRef<HTMLDivElement>(null);
	const productScrollRef = useRef<HTMLDivElement>(null);
	const hospitalScrollRef = useRef<HTMLDivElement>(null);



	const handleHospitalCardClick = (hospital: HospitalCardData) => {
		setSelectedHospital(hospital);
		setIsHospitalModalOpen(true);
	};

	const handleCloseHospitalModal = () => {
		setIsHospitalModalOpen(false);
		setSelectedHospital(null);
	};

	const handleProductClick = (product: ProductCardData) => {
		setSelectedProduct(product);
		setIsProductModalOpen(true);
	};

	const handleCloseProductModal = () => {
		setIsProductModalOpen(false);
		setSelectedProduct(null);
	};

	const handleExerciseClick = (exercise: ExerciseCardData) => {
		setSelectedExercise(exercise);
		setIsExerciseModalOpen(true);
	};

	const handleCloseExerciseModal = () => {
		setIsExerciseModalOpen(false);
		setSelectedExercise(null);
	};
	return (
		<div className={styles.container}>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeExercises} />
				<div className={styles.mainSection}>
					<div ref={exerciseScrollRef} className={styles.scrollContainer}>
						{exercises?.map((exercise, index) => (
							<div key={`${exercise.title}-${index}`} className={styles.cardWrapper}>
								<ExerciseCard
									title={exercise.title}
									image={exercise.image}
									videoUrl={exercise.videoUrl}
									onClick={() => handleExerciseClick(exercise)}
								/>
							</div>
						))}
					</div>
				</div>
			</>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeProducts} />
				<div className={styles.mainSection}>
					
					<div ref={productScrollRef} className={styles.scrollContainer}>
						{productsData.map((product) => (
							<div key={product.key} className={styles.cardWrapper}>
								<ProductCard
									title={product.title}
									description={product.description}
									image={product.image}
									price={product.price}
									amazonUrl={product.amazonUrl}
									detailedDescription={product.detailedDescription}
									onClick={() => handleProductClick(product)}
								/>
							</div>
						))}
					</div>
				</div>
			</>
			<>
				<TitleHeader title={icarePageText.sectionTitles.eyeSpecialists} />
				<div className={styles.mainSection}>
					
					<div ref={hospitalScrollRef} className={styles.scrollContainer}>
						{hospitalsData.map((hospital) => (
							<div key={hospital.title} className={styles.cardWrapper}>
								<HospitalCard
									title={hospital.title}
									image={hospital.image}
									onClick={() => handleHospitalCardClick(hospital)}
								/>
							</div>
						))}
					</div>
				</div>
			</>

			{isProductModalOpen && (
				<ProductModal
					isOpen={isProductModalOpen}
					onClose={handleCloseProductModal}
					product={selectedProduct}
				/>
			)}

			{isExerciseModalOpen && (
				<ExerciseModal
					isOpen={isExerciseModalOpen}
					onClose={handleCloseExerciseModal}
					exercise={selectedExercise}
					currentMetrics={metrics}
				/>
			)}

			{isHospitalModalOpen && (
				<HospitalModal
					isOpen={isHospitalModalOpen}
					onClose={handleCloseHospitalModal}
					hospital={selectedHospital}
				/>
			)}
		</div>
	);
}
