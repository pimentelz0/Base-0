export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export type Gender = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type FitnessGoal = "lose_fat" | "maintain" | "build_muscle" | "recomposition";

export interface UserMeasurements {
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
  rightArm?: number; // cm
  leftArm?: number; // cm
  rightThigh?: number; // cm
  leftThigh?: number; // cm
  calves?: number; // cm
  shoulders?: number; // cm
  neck?: number; // cm
  bodyFatPercentage?: number; // %
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl?: string;
  age: number;
  gender: Gender;
  height: number; // cm
  currentWeight: number; // kg
  startWeight: number; // kg
  targetWeight?: number; // kg
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  measurements: UserMeasurements;
  isConfigured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeightLog {
  id: string;
  date: string; // ISO string
  weight: number; // kg
  note?: string;
  photoUrl?: string;
  measurements?: UserMeasurements;
}

export interface MealItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MealCategory = "breakfast" | "lunch" | "snack" | "dinner" | "pre_workout" | "post_workout";

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  category: MealCategory;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  photoUrl?: string;
  gulinhaFeedback?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  isMealInsight?: boolean;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface CalculatedMetrics {
  imc: number;
  imcCategory: string;
  imcColor: string;
  tmb: number; // Basal Metabolic Rate
  get: number; // Total Daily Energy Expenditure (GET)
  targetCalories: number;
  targetProtein: number; // grams
  targetCarbs: number; // grams
  targetFat: number; // grams
  targetWater: number; // ml
  healthyWeightMin: number;
  healthyWeightMax: number;
}

export type NoteColor = "yellow" | "blue" | "emerald" | "pink" | "purple" | "orange" | "zinc";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  date: string; // ISO string
  pinned?: boolean;
  category?: string;
  checklist?: { id: string; text: string; done: boolean }[];
  updatedAt?: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weight: number; // in kg
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string; // e.g., "Treino A - Peitoral & Tríceps"
  targetMuscles: string;
  exercises: WorkoutExercise[];
  color?: string;
  updatedAt?: string;
}

export interface WorkoutSessionLog {
  id: string;
  routineId?: string;
  routineName: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  notes?: string;
}
