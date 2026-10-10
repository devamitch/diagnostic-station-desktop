'use client';
import Dialog from '@/components/layout/Modal/Dialog';
import useTranslationData from '@/hooks/use-translation-data';
import { useExercises } from '@/hooks/use-excercise';
import ExerciseModal from '@/components/icare/ExerciseModal/ExerciseModal';
import ExerciseCard from '@/components/icare/ExerciseCard/ExerciseCard';
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { ExerciseCardData } from '@/types';
import React, { useState } from 'react';
import styles from './MetricInfoPopup.module.css';

interface MetricInfo {
	title: string;
	description: string;
	healthy: string;
	whyItMatters: string;
	quickWin: string;
}

interface MetricInfoPopupProps {
	isOpen: boolean;
	onClose: () => void;
	metricInfo: MetricInfo | null;
}

const MetricInfoPopup: React.FC<MetricInfoPopupProps> = ({ isOpen, onClose, metricInfo }) => {
	const { metricInfoPopupText } = useTranslationData();
	const { data: exercises } = useExercises();
	const { metrics } = useEyeTrackingContext();
	
	// Exercise modal state
	const [selectedExercise, setSelectedExercise] = useState<ExerciseCardData | null>(null);
	const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
	
	// Handle exercise click
	const handleExerciseClick = (exercise: ExerciseCardData) => {
		setSelectedExercise(exercise);
		setIsExerciseModalOpen(true);
	};
	
	// Handle exercise modal close
	const handleCloseExerciseModal = () => {
		setIsExerciseModalOpen(false);
		setSelectedExercise(null);
	};
	
	if (!metricInfo) return null;
	
	const firstTwoExercises = exercises?.slice(0, 2) || [];

	return (
		<Dialog isOpen={isOpen} onClose={onClose}>
			<div className={styles.container}>
				<div className={styles.header}>
					<h2 className={styles.title}>{metricInfo.title}</h2>
					<p className={styles.description}>{metricInfo.description}</p>
				</div>
				
				<div className={styles.content}>
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{metricInfoPopupText.sectionTitles.healthyRange}</h3>
						<p className={styles.sectionText}>{metricInfo.healthy}</p>
					</div>
					
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{metricInfoPopupText.sectionTitles.whyItMatters}</h3>
						<p className={styles.sectionText}>{metricInfo.whyItMatters}</p>
					</div>
					
					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>{metricInfoPopupText.sectionTitles.quickWin}</h3>
						<p className={styles.quickWin}>{metricInfo.quickWin}</p>
					</div>
					
					{firstTwoExercises.length > 0 && (
						<div className={styles.section}>
							<h3 className={styles.sectionTitle}>Recommended Eye Exercises</h3>
							<p className={styles.sectionText}>Try these exercises to help improve your eye health:</p>
							<div className={styles.exercisesGrid}>
								{firstTwoExercises.map((exercise, index) => (
									<ExerciseCard
										key={`${exercise.title}-${index}`}
										title={exercise.title}
										image={exercise.image}
										videoUrl={exercise.videoUrl}
										onClick={() => handleExerciseClick(exercise)}
									/>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
			
			{/* Exercise Modal */}
			{isExerciseModalOpen && (
				<ExerciseModal
					isOpen={isExerciseModalOpen}
					onClose={handleCloseExerciseModal}
					exercise={selectedExercise}
					currentMetrics={metrics}
				/>
			)}
		</Dialog>
	);
};

export default MetricInfoPopup;