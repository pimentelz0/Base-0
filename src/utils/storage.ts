import { UserProfile, WeightLog, MealLog, ChatMessage, ChatSession, NoteItem, AuthUser, WorkoutRoutine, WorkoutSessionLog, ProjectItem } from "../types";

const KEYS = {
  AUTH_USER: "base0_auth_user_v1",
  PROFILE: "base0_profile_v1",
  WEIGHT_LOGS: "base0_weight_logs_v1",
  MEAL_LOGS: "base0_meal_logs_v1",
  CHAT_MESSAGES: "base0_chat_messages_v1",
  CHAT_SESSIONS: "base0_chat_sessions_v1",
  ACTIVE_CHAT_SESSION_ID: "base0_active_chat_session_id_v1",
  WATER_INTAKE: "base0_water_intake_v1",
  NOTES: "base0_notes_v1",
  WORKOUT_ROUTINES: "base0_workout_routines_v1",
  WORKOUT_LOGS: "base0_workout_logs_v1",
  ACTIVE_WORKOUT_SESSION: "base0_active_workout_session_v1",
  APP_ACCESS_DAYS: "base0_app_access_days_v1",
  PROJECTS: "base0_projects_v1",
};

/**
 * Resilient localStorage write wrapper with auto-recovery against QuotaExceededError.
 */
function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    console.warn(`localStorage setItem warning for key "${key}":`, e);
    // Quota recovery if browser runs out of space
    if (e?.name === "QuotaExceededError" || e?.code === 22 || e?.code === 1014) {
      try {
        // 1. Trim chat messages to last 15
        const chat = localStorage.getItem(KEYS.CHAT_MESSAGES);
        if (chat) {
          const parsed = JSON.parse(chat);
          if (Array.isArray(parsed) && parsed.length > 15) {
            localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(parsed.slice(-15)));
          }
        }
        // 2. Strip large photoUrls from older meal logs
        const meals = localStorage.getItem(KEYS.MEAL_LOGS);
        if (meals) {
          const parsedMeals = JSON.parse(meals);
          if (Array.isArray(parsedMeals)) {
            let cleaned = false;
            parsedMeals.forEach((m, idx) => {
              if (idx > 2 && m.photoUrl) {
                delete m.photoUrl;
                cleaned = true;
              }
            });
            if (cleaned) {
              localStorage.setItem(KEYS.MEAL_LOGS, JSON.stringify(parsedMeals));
            }
          }
        }
        // Retry write
        localStorage.setItem(key, value);
      } catch (retryErr) {
        console.error("Critical: Storage quota recovery failed:", retryErr);
      }
    }
  }
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: 0,
  gender: "male",
  height: 0,
  currentWeight: 0,
  startWeight: 0,
  targetWeight: undefined,
  activityLevel: "moderate",
  goal: "maintain",
  measurements: {},
  isConfigured: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_WEIGHT_LOGS: WeightLog[] = [];

export const INITIAL_MEAL_LOGS: MealLog[] = [];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [];

export const INITIAL_NOTES: NoteItem[] = [];

export const INITIAL_WORKOUT_ROUTINES: WorkoutRoutine[] = [];

export const INITIAL_WORKOUT_LOGS: WorkoutSessionLog[] = [];

// Automatic cleanup of legacy demo/mock data from previous versions
function cleanupLegacyDemoData(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;

    // 1. Clean legacy demo weight logs (w-1 to w-5)
    const weightRaw = localStorage.getItem(KEYS.WEIGHT_LOGS);
    if (weightRaw) {
      const parsed = JSON.parse(weightRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((l: any) => !["w-1", "w-2", "w-3", "w-4", "w-5"].includes(l.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(KEYS.WEIGHT_LOGS, JSON.stringify(cleaned));
        }
      }
    }

    // 2. Clean legacy demo meals (m-1, m-2)
    const mealRaw = localStorage.getItem(KEYS.MEAL_LOGS);
    if (mealRaw) {
      const parsed = JSON.parse(mealRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((m: any) => !["m-1", "m-2"].includes(m.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(KEYS.MEAL_LOGS, JSON.stringify(cleaned));
        }
      }
    }

    // 3. Clean legacy demo chat message (c-1)
    const chatRaw = localStorage.getItem(KEYS.CHAT_MESSAGES);
    if (chatRaw) {
      const parsed = JSON.parse(chatRaw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((c: any) => c.id !== "c-1");
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(KEYS.CHAT_MESSAGES, JSON.stringify(cleaned));
        }
      }
    }

    // 4. Clean legacy demo profile ("Atleta Base 0" or 78.5kg sample)
    const profileRaw = localStorage.getItem(KEYS.PROFILE);
    if (profileRaw) {
      const parsed = JSON.parse(profileRaw);
      if (parsed.name === "Atleta Base 0" || (parsed.currentWeight === 78.5 && parsed.measurements?.chest === 102)) {
        localStorage.removeItem(KEYS.PROFILE);
      }
    }

    // 5. Clean mock default water intake
    const today = new Date().toISOString().split("T")[0];
    const waterKey = `${KEYS.WATER_INTAKE}_${today}`;
    if (localStorage.getItem(waterKey) === "1750") {
      localStorage.removeItem(waterKey);
    }
  } catch (e) {
    // Ignore error in safe environments
  }
}

// Run cleanup immediately on load
cleanupLegacyDemoData();

export const StorageService = {
  getProfile(): UserProfile {
    try {
      const saved = localStorage.getItem(KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name === "Atleta Base 0") {
          return DEFAULT_PROFILE;
        }
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          measurements: {
            ...DEFAULT_PROFILE.measurements,
            ...(parsed.measurements || {}),
          },
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error("StorageService getProfile error:", e);
    }
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: UserProfile): void {
    const toSave: UserProfile = {
      ...profile,
      updatedAt: profile.updatedAt || new Date().toISOString(),
    };
    safeSetItem(KEYS.PROFILE, JSON.stringify(toSave));

    // Keep authUser synchronized so name and email are always up-to-date
    try {
      const currentRaw = localStorage.getItem(KEYS.AUTH_USER);
      if (currentRaw) {
        const currentAuth = JSON.parse(currentRaw);
        if (currentAuth) {
          const updatedAuth: AuthUser = {
            ...currentAuth,
            name: profile.name || currentAuth.name,
            email: profile.email || currentAuth.email,
          };
          safeSetItem(KEYS.AUTH_USER, JSON.stringify(updatedAuth));
        }
      }
    } catch (e) {}
  },

  getWeightLogs(): WeightLog[] {
    try {
      const saved = localStorage.getItem(KEYS.WEIGHT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((l: any) => !["w-1", "w-2", "w-3", "w-4", "w-5"].includes(l.id));
        }
      }
    } catch (e) {
      console.error("StorageService getWeightLogs error:", e);
    }
    return INITIAL_WEIGHT_LOGS;
  },

  saveWeightLogs(logs: WeightLog[]): void {
    safeSetItem(KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  },

  getMealLogs(): MealLog[] {
    try {
      const saved = localStorage.getItem(KEYS.MEAL_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => !["m-1", "m-2"].includes(m.id));
        }
      }
    } catch (e) {
      console.error("StorageService getMealLogs error:", e);
    }
    return INITIAL_MEAL_LOGS;
  },

  saveMealLogs(logs: MealLog[]): void {
    safeSetItem(KEYS.MEAL_LOGS, JSON.stringify(logs));
  },

  getChatMessages(): ChatMessage[] {
    try {
      const saved = localStorage.getItem(KEYS.CHAT_MESSAGES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => c.id !== "c-1");
        }
      }
    } catch (e) {
      console.error("StorageService getChatMessages error:", e);
    }
    return INITIAL_CHAT_MESSAGES;
  },

  saveChatMessages(messages: ChatMessage[]): void {
    safeSetItem(KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  getChatSessions(): ChatSession[] {
    try {
      const saved = localStorage.getItem(KEYS.CHAT_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      // Migration from legacy chat messages if any exist
      const legacyMsgs = this.getChatMessages();
      if (legacyMsgs && legacyMsgs.length > 0) {
        const initialSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: legacyMsgs[0]?.content?.slice(0, 30) || "Conversa Salva",
          createdAt: legacyMsgs[0]?.timestamp || new Date().toISOString(),
          updatedAt: legacyMsgs[legacyMsgs.length - 1]?.timestamp || new Date().toISOString(),
          messages: legacyMsgs,
        };
        this.saveChatSessions([initialSession]);
        return [initialSession];
      }
    } catch (e) {
      console.error("StorageService getChatSessions error:", e);
    }
    const defaultSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova Conversa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    return [defaultSession];
  },

  saveChatSessions(sessions: ChatSession[]): void {
    safeSetItem(KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
    // Mirror active session messages to legacy KEYS.CHAT_MESSAGES
    const activeId = this.getActiveChatSessionId();
    const active = sessions.find((s) => s.id === activeId) || sessions[0];
    if (active) {
      safeSetItem(KEYS.CHAT_MESSAGES, JSON.stringify(active.messages));
    }
  },

  getActiveChatSessionId(): string | null {
    try {
      return localStorage.getItem(KEYS.ACTIVE_CHAT_SESSION_ID);
    } catch (e) {
      return null;
    }
  },

  saveActiveChatSessionId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(KEYS.ACTIVE_CHAT_SESSION_ID, id);
      } else {
        localStorage.removeItem(KEYS.ACTIVE_CHAT_SESSION_ID);
      }
    } catch (e) {
      console.error(e);
    }
  },

  getWaterIntake(dateStr: string): number {
    try {
      const saved = localStorage.getItem(`${KEYS.WATER_INTAKE}_${dateStr}`);
      if (saved !== null && saved !== undefined) {
        const num = Number(saved);
        return isNaN(num) ? 0 : num;
      }
    } catch (e) {
      console.error("StorageService getWaterIntake error:", e);
    }
    return 0;
  },

  saveWaterIntake(dateStr: string, amount: number): void {
    safeSetItem(`${KEYS.WATER_INTAKE}_${dateStr}`, String(Math.max(0, amount)));
  },

  getAllWaterIntake(): Record<string, number> {
    const res: Record<string, number> = {};
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`${KEYS.WATER_INTAKE}_`)) {
          const dateStr = key.replace(`${KEYS.WATER_INTAKE}_`, "");
          const val = Number(localStorage.getItem(key));
          if (!isNaN(val)) res[dateStr] = val;
        }
      });
    } catch (e) {
      console.error(e);
    }
    return res;
  },

  getAuthUser(): AuthUser {
    try {
      const saved = localStorage.getItem(KEYS.AUTH_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && (parsed.email || parsed.id)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("StorageService getAuthUser error:", e);
    }

    // Auto-create or link active session so clicking the home screen icon opens immediately without login prompt
    let initialName = "Atleta";
    let initialEmail = "atleta@base0.app";
    try {
      const profRaw = localStorage.getItem(KEYS.PROFILE);
      if (profRaw) {
        const parsedProf = JSON.parse(profRaw);
        if (parsedProf?.name) initialName = parsedProf.name;
        if (parsedProf?.email) initialEmail = parsedProf.email;
      }
    } catch (e) {}

    const defaultUser: AuthUser = {
      id: "usr_athlete_main",
      email: initialEmail,
      name: initialName,
      createdAt: new Date().toISOString(),
    };

    try {
      safeSetItem(KEYS.AUTH_USER, JSON.stringify(defaultUser));
    } catch (e) {}

    return defaultUser;
  },

  saveAuthUser(user: AuthUser | null): void {
    try {
      if (user) {
        safeSetItem(KEYS.AUTH_USER, JSON.stringify(user));
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar os 4 exemplos pré-definidos antigos de demonstração
          return parsed.filter(
            (n: any) => !["note-1", "note-2", "note-3", "note-4"].includes(n.id)
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTES;
  },

  saveNotes(notes: NoteItem[]): void {
    safeSetItem(KEYS.NOTES, JSON.stringify(notes));
  },

  getWorkoutRoutines(): WorkoutRoutine[] {
    try {
      const saved = localStorage.getItem(KEYS.WORKOUT_ROUTINES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WORKOUT_ROUTINES;
  },

  saveWorkoutRoutines(routines: WorkoutRoutine[]): void {
    safeSetItem(KEYS.WORKOUT_ROUTINES, JSON.stringify(routines));
  },

  deleteWorkoutRoutine(routineId: string): WorkoutRoutine[] {
    const current = this.getWorkoutRoutines();
    const updated = current.filter((r) => r.id !== routineId);
    this.saveWorkoutRoutines(updated);
    const active = this.getActiveWorkoutSession();
    if (active && active.routine?.id === routineId) {
      this.clearActiveWorkoutSession();
    }
    return updated;
  },

  getWorkoutLogs(): WorkoutSessionLog[] {
    try {
      const saved = localStorage.getItem(KEYS.WORKOUT_LOGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (l: any) => !["wlog-1", "wlog-2"].includes(l.id)
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_WORKOUT_LOGS;
  },

  saveWorkoutLogs(logs: WorkoutSessionLog[]): void {
    safeSetItem(KEYS.WORKOUT_LOGS, JSON.stringify(logs));
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

  // Active workout session in progress (preserves workout across tab switches)
  saveActiveWorkoutSession(session: {
    routine: WorkoutRoutine;
    sessionSeconds: number;
    startedAt: number;
  } | null): void {
    if (session) {
      safeSetItem(KEYS.ACTIVE_WORKOUT_SESSION, JSON.stringify(session));
    } else {
      try {
        localStorage.removeItem(KEYS.ACTIVE_WORKOUT_SESSION);
      } catch (e) {
        console.error(e);
      }
    }
  },

  getActiveWorkoutSession(): {
    routine: WorkoutRoutine;
    sessionSeconds: number;
    startedAt: number;
  } | null {
    try {
      const saved = localStorage.getItem(KEYS.ACTIVE_WORKOUT_SESSION);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  clearActiveWorkoutSession(): void {
    try {
      localStorage.removeItem(KEYS.ACTIVE_WORKOUT_SESSION);
    } catch (e) {
      console.error(e);
    }
  },

  // Track daily app visits for holistic productivity analytics
  recordDailyAppAccess(dateStr?: string): string[] {
    const today = dateStr || new Date().toISOString().split("T")[0];
    try {
      const days = this.getAppAccessDays();
      if (!days.includes(today)) {
        const updated = [...days, today];
        safeSetItem(KEYS.APP_ACCESS_DAYS, JSON.stringify(updated));
        return updated;
      }
      return days;
    } catch (e) {
      console.error("Error recording daily app access:", e);
      return [today];
    }
  },

  getAppAccessDays(): string[] {
    try {
      const saved = localStorage.getItem(KEYS.APP_ACCESS_DAYS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error reading app access days:", e);
    }
    return [];
  },

  getProjects(): ProjectItem[] {
    try {
      const saved = localStorage.getItem(KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error reading projects:", e);
    }
    return [];
  },

  saveProjects(projects: ProjectItem[]): void {
    try {
      safeSetItem(KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error("Error saving projects:", e);
    }
  },

  getProjectById(id: string): ProjectItem | null {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || null;
  },

  saveProject(project: ProjectItem): void {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = project;
    } else {
      list.unshift(project);
    }
    this.saveProjects(list);
  },

  deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    this.saveProjects(list);
  },

  clearAll(): void {
    try {
      localStorage.removeItem(KEYS.PROFILE);
      localStorage.removeItem(KEYS.WEIGHT_LOGS);
      localStorage.removeItem(KEYS.MEAL_LOGS);
      localStorage.removeItem(KEYS.CHAT_MESSAGES);
      localStorage.removeItem(KEYS.NOTES);
      localStorage.removeItem(KEYS.ACTIVE_WORKOUT_SESSION);
      localStorage.removeItem(KEYS.PROJECTS);
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
