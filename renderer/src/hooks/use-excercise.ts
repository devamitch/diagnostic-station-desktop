
import { getAllGumletExercises } from '@/services/eyeExerciseService';
import { useQuery } from '@tanstack/react-query';

export type ExerciseCardData = {
  title: string;
  image: string;
  videoUrl: string;
};

export function useExercises() {
  return useQuery<ExerciseCardData[], Error>({
    queryKey: ['gumletExercises'],
    queryFn: async () => {
      const gumletData = await getAllGumletExercises();
      return gumletData.map((exercise) => ({
        title: exercise.title,
        image: exercise.thumbnailUrl,
        videoUrl: exercise.assetId,
      }));
    },
  });
}
