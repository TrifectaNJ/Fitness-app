export interface FitnessProgram {
  id: string;
  title: string;
  description: string;
  price: number;
  paymentType: 'one-time' | 'monthly';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  days: ProgramDay[];
  workouts?: Workout[];
  isActive: boolean;
  showOnHomePage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description?: string;
  workouts: Workout[];
  isCompleted?: boolean;
}

export interface Workout {
  id: string;
  title: string;
  duration: number;
  calories?: number;
  focusZones?: string[];
  equipment?: string[];
  warmUpExercises: Exercise[];
  mainExercises: Exercise[];
  coolDownExercises?: Exercise[];
  imageUrl?: string;
  videoUrl?: string;
  description?: string;
  exercises?: Exercise[];
  sections?: WorkoutSection[];
  program_id?: string;
}

export interface WorkoutSection {
  id: string;
  workout_id: string;
  section_title: string;
  sort_order: number;
  subsections: WorkoutSubsection[];
}

export interface WorkoutSubsection {
  id: string;
  section_id: string;
  section_key?: string;
  subsection_title: string;
  repeat_count?: number;
  sort_order: number;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  duration: number;
  reps?: number;
  sets?: number;
  weight?: number;
  restTime?: number;
  description?: string;
  instructions: string[];
  imageUrl?: string;
  videoUrl?: string;
  order: number;
}

export interface UserAccess {
  userId: string;
  programId: string;
  accessType: 'purchased' | 'subscribed';
  expiresAt?: Date;
  purchasedAt: Date;
}

export interface Day {
  id: string;
  title: string;
  description?: string;
  workouts: Workout[];
}