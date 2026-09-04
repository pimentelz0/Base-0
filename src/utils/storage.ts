import { UserProfile, WeightLog, MealLog, ChatMessage, NoteItem, AuthUser, WorkoutRoutine, WorkoutSessionLog } from "../types";

const KEYS = {
  AUTH_USER: "base0_auth_user_v1",
  PROFILE: "base0_profile_v1",
  WEIGHT_LOGS: "base0_weight_logs_v1",
  MEAL_LOGS: "base0_meal_logs_v1",
  CHAT_MESSAGES: "base0_chat_messages_v1",
  WATER_INTAKE: "base0_water_intake_v1",
  NOTES: "base0_notes_v1",
  WORKOUT_ROUTINES: "base0_workout_routines_v1",
  WORKOUT_LOGS: "base0_workout_logs_v1",
};

export const DEFAULT_PROFILE: UserProfile = {
  name: "Atleta Base 0",
  age: 26,
  gender: "male",
  height: 178,
  currentWeight: 78.5,
  startWeight: 78.5,
  targetWeight: 74.0,
  activityLevel: "moderate",
  goal: "lose_fat",
  measurements: {
    chest: 102,
    waist: 86,
    hips: 98,
    rightArm: 37,
    leftArm: 36.5,
    rightThigh: 58,
    leftThigh: 58,
    calves: 38,
    bodyFatPercentage: 16.5,
  },
  isConfigured: true,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_WEIGHT_LOGS: WeightLog[] = [
  {
    id: "w-1",
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 84.0,
    note: "Início do projeto Base 0. Foco total em consistência.",
  },
  {
    id: "w-2",
    date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 82.8,
    note: "Semana 1 concluída: -1.2kg (redução de retenção hídrica).",
  },
  {
    id: "w-3",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 81.4,
    note: "Bateu a meta de água e treinos 5x na semana.",
  },
  {
    id: "w-4",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    weight: 79.9,
    note: "Quebrou a barreira dos 80kg! Cintura reduziu 2cm.",
  },
  {
    id: "w-5",
    date: new Date().toISOString(),
    weight: 78.5,
    note: "Peso atual. Definição muscular começando a aparecer.",
  },
];

export const INITIAL_MEAL_LOGS: MealLog[] = [
  {
    id: "m-1",
    date: new Date().toISOString().split("T")[0],
    time: "07:30",
    title: "Café da Manhã Anabólico",
    category: "breakfast",
    totalCalories: 430,
    totalProtein: 34,
    totalCarbs: 45,
    totalFat: 12,
    items: [
      { id: "i-1", name: "Ovos Mexidos (3 unidades)", portion: "150g", calories: 215, protein: 18, carbs: 2, fat: 15 },
      { id: "i-2", name: "Pão Integral 100% (2 fatias)", portion: "50g", calories: 125, protein: 6, carbs: 24, fat: 1 },
      { id: "i-3", name: "Whey Protein 80% Isolado", portion: "20g", calories: 80, protein: 18, carbs: 2, fat: 1 },
      { id: "i-4", name: "Café Preto sem açúcar", portion: "200ml", calories: 5, protein: 0, carbs: 1, fat: 0 },
    ],
    gulinhaFeedback: "Excelente início de dia com 34g de proteína! Combinação ideal para manter saciedade e energia estável.",
  },
  {
    id: "m-2",
    date: new Date().toISOString().split("T")[0],
    time: "12:45",
    title: "Almoço Limpo: Frango, Arroz & Legumes",
    category: "lunch",
    totalCalories: 620,
    totalProtein: 48,
    totalCarbs: 65,
    totalFat: 14,
    items: [
      { id: "i-5", name: "Filé de Peito de Frango Grelhado", portion: "180g", calories: 290, protein: 42, carbs: 0, fat: 5 },
      { id: "i-6", name: "Arroz Branco Cozido", portion: "160g", calories: 210, protein: 4, carbs: 46, fat: 1 },
      { id: "i-7", name: "Feijão Carioca", portion: "90g", calories: 75, protein: 5, carbs: 14, fat: 0.5 },
      { id: "i-8", name: "Azeite de Oliva Extra Virgem", portion: "5g", calories: 45, protein: 0, carbs: 0, fat: 5 },
      { id: "i-9", name: "Salada de Folhas Verdes & Brócolis", portion: "120g", calories: 25, protein: 2, carbs: 4, fat: 0 },
    ],
    gulinhaFeedback: "Almoço perfeito. Carbos complexos e alto valor biológico de proteína para recuperação muscular.",
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "c-1",
    role: "model",
    content: "Fala campeão! Sou o **Gulinha**, sua inteligência artificial focada na aba **Gym** da Base 0. \n\nEstou sincronizado com seus dados corporais (TMB, IMC, peso e refeições). Posso analisar fotos dos seus pratos, calcular calorias, tirar dúvidas de treino e ajustar seus macros. Como posso te ajudar hoje?",
    timestamp: new Date().toISOString(),
  },
];

export const INITIAL_NOTES: NoteItem[] = [
  {
    id: "note-1",
    title: "🎯 Meta do Mês: Consistência",
    content: "1. Bater 3L de água todos os dias sem falta.\n2. Treinar musculação 5x na semana.\n3. Dormir no mínimo 7h30 por noite.",
    color: "yellow",
    date: new Date().toISOString(),
    pinned: true,
    category: "Foco",
    checklist: [
      { id: "c-1", text: "3L de água diários", done: true },
      { id: "c-2", text: "Treino 5x na semana", done: true },
      { id: "c-3", text: "Sono regenerativo 7h30+", done: false },
    ],
  },
  {
    id: "note-2",
    title: "⚡ Estratégia de Suplementação",
    content: "• Creatina Monohidratada 5g pós-treino com carboidrato rápido.\n• Whey Protein Isolado pela manhã ou pós-treino.\n• Ômega 3 e Vitamina D no almoço.",
    color: "blue",
    date: new Date().toISOString(),
    pinned: false,
    category: "Nutrição",
  },
  {
    id: "note-3",
    title: "💡 Ideias & Projetos Pessoais",
    content: "Pesquisar rotinas de mobilidade matinal de 10 minutos para lombar e ombros. Implementar leitura de 20 páginas por dia.",
    color: "emerald",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    pinned: false,
    category: "Mindset",
  },
  {
    id: "note-4",
    title: "📋 Checklist de Compras da Semana",
    content: "Ovos caipiras, peito de frango, patinho moído, banana prata, aveia em flocos grossos, azeite extra virgem e pasta de amendoim.",
    color: "orange",
    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // Previous month
    pinned: false,
    category: "Rotina",
  },
];

export const INITIAL_WORKOUT_ROUTINES: WorkoutRoutine[] = [
  {
    id: "routine-a",
    name: "Treino A - Peitoral, Ombros & Tríceps",
    targetMuscles: "Peitoral Maior, Deltoide Anterior/Lateral, Tríceps Braquial",
    color: "#007AFF",
    exercises: [
      {
        id: "ex-1",
        name: "Supino Reto com Barra",
        muscleGroup: "Peitoral",
        restSeconds: 90,
        sets: [
          { id: "s-1-1", setNumber: 1, reps: 12, weight: 60, completed: true },
          { id: "s-1-2", setNumber: 2, reps: 10, weight: 70, completed: true },
          { id: "s-1-3", setNumber: 3, reps: 8, weight: 80, completed: false },
          { id: "s-1-4", setNumber: 4, reps: 6, weight: 85, completed: false },
        ],
      },
      {
        id: "ex-2",
        name: "Supino Inclinado com Halteres",
        muscleGroup: "Peitoral Superior",
        restSeconds: 75,
        sets: [
          { id: "s-2-1", setNumber: 1, reps: 12, weight: 24, completed: false },
          { id: "s-2-2", setNumber: 2, reps: 10, weight: 26, completed: false },
          { id: "s-2-3", setNumber: 3, reps: 10, weight: 26, completed: false },
        ],
      },
      {
        id: "ex-3",
        name: "Desenvolvimento com Halteres",
        muscleGroup: "Ombros (Deltoide)",
        restSeconds: 75,
        sets: [
          { id: "s-3-1", setNumber: 1, reps: 12, weight: 18, completed: false },
          { id: "s-3-2", setNumber: 2, reps: 10, weight: 20, completed: false },
          { id: "s-3-3", setNumber: 3, reps: 8, weight: 22, completed: false },
        ],
      },
      {
        id: "ex-4",
        name: "Elevação Lateral com Halteres",
        muscleGroup: "Ombros Lateral",
        restSeconds: 60,
        sets: [
          { id: "s-4-1", setNumber: 1, reps: 15, weight: 10, completed: false },
          { id: "s-4-2", setNumber: 2, reps: 12, weight: 12, completed: false },
          { id: "s-4-3", setNumber: 3, reps: 12, weight: 12, completed: false },
        ],
      },
      {
        id: "ex-5",
        name: "Tríceps Corda no Pulley",
        muscleGroup: "Tríceps",
        restSeconds: 60,
        sets: [
          { id: "s-5-1", setNumber: 1, reps: 15, weight: 25, completed: false },
          { id: "s-5-2", setNumber: 2, reps: 12, weight: 30, completed: false },
          { id: "s-5-3", setNumber: 3, reps: 10, weight: 35, completed: false },
        ],
      },
    ],
  },
  {
    id: "routine-b",
    name: "Treino B - Costas, Trapézio & Bíceps",
    targetMuscles: "Dorsais, Trapézio, Bíceps & Antebraço",
    color: "#38bdf8",
    exercises: [
      {
        id: "ex-b1",
        name: "Puxada Frontal Aberta (Pulldown)",
        muscleGroup: "Costas",
        restSeconds: 90,
        sets: [
          { id: "sb-1-1", setNumber: 1, reps: 12, weight: 55, completed: false },
          { id: "sb-1-2", setNumber: 2, reps: 10, weight: 65, completed: false },
          { id: "sb-1-3", setNumber: 3, reps: 8, weight: 75, completed: false },
        ],
      },
      {
        id: "ex-b2",
        name: "Remada Curvada com Barra",
        muscleGroup: "Costas",
        restSeconds: 90,
        sets: [
          { id: "sb-2-1", setNumber: 1, reps: 12, weight: 50, completed: false },
          { id: "sb-2-2", setNumber: 2, reps: 10, weight: 60, completed: false },
          { id: "sb-2-3", setNumber: 3, reps: 8, weight: 70, completed: false },
        ],
      },
      {
        id: "ex-b3",
        name: "Remada Baixa no Triângulo",
        muscleGroup: "Dorsais",
        restSeconds: 60,
        sets: [
          { id: "sb-3-1", setNumber: 1, reps: 12, weight: 50, completed: false },
          { id: "sb-3-2", setNumber: 2, reps: 10, weight: 60, completed: false },
        ],
      },
      {
        id: "ex-b4",
        name: "Rosca Direta com Barra W",
        muscleGroup: "Bíceps",
        restSeconds: 60,
        sets: [
          { id: "sb-4-1", setNumber: 1, reps: 12, weight: 26, completed: false },
          { id: "sb-4-2", setNumber: 2, reps: 10, weight: 30, completed: false },
          { id: "sb-4-3", setNumber: 3, reps: 8, weight: 34, completed: false },
        ],
      },
      {
        id: "ex-b5",
        name: "Rosca Martelo Alternada",
        muscleGroup: "Bíceps / Braquial",
        restSeconds: 60,
        sets: [
          { id: "sb-5-1", setNumber: 1, reps: 12, weight: 14, completed: false },
          { id: "sb-5-2", setNumber: 2, reps: 10, weight: 16, completed: false },
        ],
      },
    ],
  },
  {
    id: "routine-c",
    name: "Treino C - Pernas Completo & Abdômen",
    targetMuscles: "Quadríceps, Isquiotibiais, Glúteos, Panturrilhas & Core",
    color: "#22c55e",
    exercises: [
      {
        id: "ex-c1",
        name: "Agachamento Livre com Barra",
        muscleGroup: "Quadríceps & Glúteos",
        restSeconds: 120,
        sets: [
          { id: "sc-1-1", setNumber: 1, reps: 12, weight: 70, completed: false },
          { id: "sc-1-2", setNumber: 2, reps: 10, weight: 90, completed: false },
          { id: "sc-1-3", setNumber: 3, reps: 8, weight: 100, completed: false },
          { id: "sc-1-4", setNumber: 4, reps: 6, weight: 110, completed: false },
        ],
      },
      {
        id: "ex-c2",
        name: "Leg Press 45°",
        muscleGroup: "Membros Inferiores",
        restSeconds: 90,
        sets: [
          { id: "sc-2-1", setNumber: 1, reps: 15, weight: 160, completed: false },
          { id: "sc-2-2", setNumber: 2, reps: 12, weight: 200, completed: false },
          { id: "sc-2-3", setNumber: 3, reps: 10, weight: 240, completed: false },
        ],
      },
      {
        id: "ex-c3",
        name: "Cadeira Extensora",
        muscleGroup: "Quadríceps",
        restSeconds: 60,
        sets: [
          { id: "sc-3-1", setNumber: 1, reps: 15, weight: 50, completed: false },
          { id: "sc-3-2", setNumber: 2, reps: 12, weight: 65, completed: false },
          { id: "sc-3-3", setNumber: 3, reps: 10, weight: 75, completed: false },
        ],
      },
      {
        id: "ex-c4",
        name: "Mesa Flexora",
        muscleGroup: "Posterior de Coxa",
        restSeconds: 60,
        sets: [
          { id: "sc-4-1", setNumber: 1, reps: 12, weight: 45, completed: false },
          { id: "sc-4-2", setNumber: 2, reps: 10, weight: 50, completed: false },
        ],
      },
      {
        id: "ex-c5",
        name: "Panturrilha em Pé",
        muscleGroup: "Panturrilhas",
        restSeconds: 45,
        sets: [
          { id: "sc-5-1", setNumber: 1, reps: 20, weight: 60, completed: false },
          { id: "sc-5-2", setNumber: 2, reps: 15, weight: 75, completed: false },
          { id: "sc-5-3", setNumber: 3, reps: 15, weight: 80, completed: false },
        ],
      },
    ],
  },
];

export const INITIAL_WORKOUT_LOGS: WorkoutSessionLog[] = [
  {
    id: "wlog-1",
    routineId: "routine-a",
    routineName: "Treino A - Peitoral, Ombros & Tríceps",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    durationMinutes: 54,
    totalVolumeKg: 4620,
    completedSetsCount: 16,
    notes: "Treino intenso, cargas progredindo com facilidade no supino.",
  },
  {
    id: "wlog-2",
    routineId: "routine-b",
    routineName: "Treino B - Costas, Trapézio & Bíceps",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    durationMinutes: 48,
    totalVolumeKg: 4180,
    completedSetsCount: 14,
    notes: "Puxada com boa cadência e contração das escápulas.",
  },
];


export const StorageService = {
  getProfile(): UserProfile {
    try {
      const saved = localStorage.getItem(KEYS.PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  },

  getWeightLogs(): WeightLog[] {
    try {
      const saved = localStorage.getItem(KEYS.WEIGHT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WEIGHT_LOGS;
  },

  saveWeightLogs(logs: WeightLog[]): void {
    try {
      localStorage.setItem(KEYS.WEIGHT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  },

  getMealLogs(): MealLog[] {
    try {
      const saved = localStorage.getItem(KEYS.MEAL_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MEAL_LOGS;
  },

  saveMealLogs(logs: MealLog[]): void {
    try {
      localStorage.setItem(KEYS.MEAL_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  },

  getChatMessages(): ChatMessage[] {
    try {
      const saved = localStorage.getItem(KEYS.CHAT_MESSAGES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHAT_MESSAGES;
  },

  saveChatMessages(messages: ChatMessage[]): void {
    try {
      localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  },

  getWaterIntake(dateStr: string): number {
    try {
      const saved = localStorage.getItem(`${KEYS.WATER_INTAKE}_${dateStr}`);
      return saved ? Number(saved) : 1750;
    } catch {
      return 1750;
    }
  },

  saveWaterIntake(dateStr: string, amount: number): void {
    try {
      localStorage.setItem(`${KEYS.WATER_INTAKE}_${dateStr}`, String(amount));
    } catch (e) {
      console.error(e);
    }
  },

  getAuthUser(): AuthUser | null {
    try {
      const saved = localStorage.getItem(KEYS.AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  saveAuthUser(user: AuthUser | null): void {
    try {
      if (user) {
        localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(KEYS.AUTH_USER);
      }
    } catch (e) {
      console.error(e);
    }
  },

  clearAuthUser(): void {
    try {
      localStorage.removeItem(KEYS.AUTH_USER);
    } catch (e) {
      console.error(e);
    }
  },

  getNotes(): NoteItem[] {
    try {
      const saved = localStorage.getItem(KEYS.NOTES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTES;
  },

  saveNotes(notes: NoteItem[]): void {
    try {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  },

  getWorkoutRoutines(): WorkoutRoutine[] {
    try {
      const saved = localStorage.getItem(KEYS.WORKOUT_ROUTINES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WORKOUT_ROUTINES;
  },

  saveWorkoutRoutines(routines: WorkoutRoutine[]): void {
    try {
      localStorage.setItem(KEYS.WORKOUT_ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error(e);
    }
  },

  getWorkoutLogs(): WorkoutSessionLog[] {
    try {
      const saved = localStorage.getItem(KEYS.WORKOUT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WORKOUT_LOGS;
  },

  saveWorkoutLogs(logs: WorkoutSessionLog[]): void {
    try {
      localStorage.setItem(KEYS.WORKOUT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  },

  addWorkoutLog(log: WorkoutSessionLog): WorkoutSessionLog[] {
    try {
      const logs = this.getWorkoutLogs();
      const updated = [log, ...logs];
      this.saveWorkoutLogs(updated);
      return updated;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(KEYS.PROFILE);
      localStorage.removeItem(KEYS.WEIGHT_LOGS);
      localStorage.removeItem(KEYS.MEAL_LOGS);
      localStorage.removeItem(KEYS.CHAT_MESSAGES);
      localStorage.removeItem(KEYS.NOTES);
      // Remove all water keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(KEYS.WATER_INTAKE)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.error(e);
    }
  },
};
