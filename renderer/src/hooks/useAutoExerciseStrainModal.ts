// hooks/useAutoExerciseStrainModal.ts
import { useEyeTrackingContext } from '@/provider/EyeTrackingProvider';
import { useExercises } from '@/hooks/use-excercise';
import ExerciseModal from '@/components/icare/ExerciseModal/ExerciseModal';
import { useState, useEffect, useRef } from 'react';
import { ExerciseCardData } from '@/types';
import React from 'react';

const useAutoExerciseStrainModal = () => {
	const { metrics } = useEyeTrackingContext();
	const { data: exercises } = useExercises();									
	
	// Exercise modal state
	const [selectedExercise, setSelectedExercise] = useState<ExerciseCardData | null>(null);
	const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
	const strainStartTime = useRef<number | null>(null);
	const modalOpenedRef = useRef<boolean>(false);
	
	// Handle exercise modal close
	const handleCloseExerciseModal = () => {
		setIsExerciseModalOpen(false);
		setSelectedExercise(null);
		modalOpenedRef.current = false;
	};
	
	// 10-minute timeout for eye strain detection
	useEffect(() => {
		if (!metrics) return;
		
		const isEyeStrainHigh = metrics.strainText === 'High';
		
		if (isEyeStrainHigh) {
			// Start timer if not already started
			if (!strainStartTime.current) {
				strainStartTime.current = Date.now();
				console.log('👁️ High eye strain detected, starting 10-minute timer');
			} else {
				// Check if 10 minutes have passed
				const duration = Date.now() - strainStartTime.current;
				const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
				
				if (duration >= tenMinutes && !modalOpenedRef.current && exercises && exercises.length > 0) {
					// Open exercise modal with first exercise
					const firstExercise = exercises[0];
					setSelectedExercise(firstExercise);
					setIsExerciseModalOpen(true);
					modalOpenedRef.current = true;
					console.log('🎯 Opening exercise modal after 10 minutes of high eye strain:', firstExercise.title);
					
					// Reset timer after opening modal
					strainStartTime.current = null;
				}
			}
		} else {
			// Reset timer when strain is no longer high
			if (strainStartTime.current) {
				console.log('✅ Eye strain level dropped, resetting timer');
				strainStartTime.current = null;
				modalOpenedRef.current = false;
			}
		}
	}, [metrics, exercises]);
	
	return {
		// Exercise Modal JSX Component for rendering
		ExerciseModalComponent: isExerciseModalOpen && selectedExercise ? (
			React.createElement(ExerciseModal, {
				isOpen: isExerciseModalOpen,
				onClose: handleCloseExerciseModal,
				exercise: selectedExercise,
				currentMetrics: metrics
			})
		) : null,
		
		// Additional state for debugging/monitoring
		isModalOpen: isExerciseModalOpen,
		selectedExercise,
		eyeStrainDetected: metrics?.strainText === 'High',
	};
};

export default useAutoExerciseStrainModal;