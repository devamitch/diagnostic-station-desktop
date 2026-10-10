'use client';

import useAutoExerciseStrainModal from '@/hooks/useAutoExerciseStrainModal';
import useEyeStrainNotifier from '@/hooks/useEyeStrainNotifier';
import useBattery from '@/utils/use-battery';
import { createContext, ReactNode, useContext, useState } from 'react';

interface PiPContextType {
	isPiPExpanded: boolean;
	setIsPiPExpanded: (expanded: boolean) => void;
	isFullScreen: boolean;
	setIsFullScreen: (fullscreen: boolean) => void;
}

const PiPContext = createContext<PiPContextType | undefined>(undefined);

export const usePiP = () => {
	const context = useContext(PiPContext);
	if (context === undefined) {
		throw new Error('usePiP must be used within a PiPProvider');
	}
	return context;
};

interface PiPProviderProps {
	children: ReactNode;
}

export const PiPProvider = ({ children }: PiPProviderProps) => {
	const [isPiPExpanded, setIsPiPExpanded] = useState(false);
	const [isFullScreen, setIsFullScreen] = useState(false);

	useEyeStrainNotifier();
	useBattery();

const { ExerciseModalComponent } = useAutoExerciseStrainModal();

	return (
		<PiPContext.Provider
			value={{
				isPiPExpanded,
				setIsPiPExpanded,
				isFullScreen,
				setIsFullScreen,
			}}
		>
			{children}
			{ExerciseModalComponent}
		</PiPContext.Provider>
	);
};
