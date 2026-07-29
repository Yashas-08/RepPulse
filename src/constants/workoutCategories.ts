export interface WorkoutCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
}

export const WORKOUT_CATEGORIES: WorkoutCategory[] = [
  {
    id: 'chest',
    title: 'Chest',
    subtitle: 'Train your upper, middle and lower chest.',
    icon: '💪',
  },
  {
    id: 'back',
    title: 'Back',
    subtitle: 'Target upper back, lats, and lower back strength.',
    icon: '🏋️',
  },
  {
    id: 'legs',
    title: 'Legs',
    subtitle: 'Build quads, hamstrings, glutes, and calves.',
    icon: '🦵',
  },
  {
    id: 'shoulders',
    title: 'Shoulders',
    subtitle: 'Develop deltoids and shoulder stability.',
    icon: '💪',
  },
  {
    id: 'arms',
    title: 'Arms',
    subtitle: 'Isolate biceps, triceps, and forearms.',
    icon: '💪',
  },
  {
    id: 'core',
    title: 'Core',
    subtitle: 'Strengthen abdominals, obliques, and core stability.',
    icon: '🧘',
  },
  {
    id: 'cardio',
    title: 'Cardio',
    subtitle: 'Boost cardiovascular endurance and burn calories.',
    icon: '❤️',
  },
  {
    id: 'full_body',
    title: 'Full Body',
    subtitle: 'Hit every major muscle group in a single session.',
    icon: '🔥',
  },
  {
    id: 'custom',
    title: 'Custom Workout',
    subtitle: 'Design your own custom exercise routine.',
    icon: '➕',
  },
];
