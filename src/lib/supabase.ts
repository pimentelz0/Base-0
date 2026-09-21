import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  UserProfile,
  WeightLog,
  MealLog,
  ChatMessage,
  ChatSession,
  NoteItem,
  ProjectItem,
  WorkoutRoutine,
  WorkoutSessionLog,
  AuthUser,
} from "../types";

// User-provided Supabase credentials (with fallback to env vars)
export const SUPABASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  "https://gknroyivfcfyrlkhjxst.supabase.co";

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "sb_publishable_rI5tI-lhYw0L22AgnaqSmQ_YNNldKbh";

// Clean URL ensuring no trailing /rest/v1
export const CLEAN_SUPABASE_URL = SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    clientInstance = createClient(CLEAN_SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "base0_sb_session",
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();

// SQL Schema for user to execute in Supabase SQL Editor if needed
export const SUPABASE_SCHEMA_SQL = `-- Schema SQL Completo para Supabase - Base 0 (Gym, Projetos & Notas)
-- Execute no SQL Editor do seu projeto Supabase: https://supabase.com/dashboard/project/gknroyivfcfyrlkhjxst/sql

-- 1. Tabela de Perfil do Atleta
CREATE TABLE IF NOT EXISTS base0_profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height NUMERIC,
  current_weight NUMERIC,
  start_weight NUMERIC,
  target_weight NUMERIC,
  activity_level TEXT,
  goal TEXT,
  measurements JSONB DEFAULT '{}'::jsonb,
  is_configured BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Histórico de Peso
CREATE TABLE IF NOT EXISTS base0_weight_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  weight NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Diário de Refeições
CREATE TABLE IF NOT EXISTS base0_meal_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  total_calories NUMERIC NOT NULL,
  total_protein NUMERIC NOT NULL,
  total_carbs NUMERIC NOT NULL,
  total_fat NUMERIC NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  gulinha_feedback TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Consumo de Água
CREATE TABLE IF NOT EXISTS base0_water_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  amount_ml NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Conversas com Gulinha AI
CREATE TABLE IF NOT EXISTS base0_chat_messages (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  session_id TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Notas e Anotações Rápidas
CREATE TABLE IF NOT EXISTS base0_notes (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  color TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Projetos & Objetivos
CREATE TABLE IF NOT EXISTS base0_projects (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  color TEXT,
  assistant_tone TEXT DEFAULT 'simple',
  notes JSONB DEFAULT '[]'::jsonb,
  chat_messages JSONB DEFAULT '[]'::jsonb,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Rotinas de Treino (Gym)
CREATE TABLE IF NOT EXISTS base0_workout_routines (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Histórico de Sessões de Treino Executadas
CREATE TABLE IF NOT EXISTS base0_workout_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  routine_id TEXT,
  routine_name TEXT NOT NULL,
  date TEXT NOT NULL,
  duration_minutes NUMERIC,
  total_volume_kg NUMERIC,
  completed_sets_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE base0_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_workout_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Permissivas para sincronização perfeita
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'base0_profiles', 'base0_weight_logs', 'base0_meal_logs', 'base0_water_logs',
    'base0_chat_messages', 'base0_notes', 'base0_projects', 'base0_workout_routines', 'base0_workout_logs'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Access %s" ON %I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Public Access %s" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;
`;

export interface SupabaseSyncStatus {
  isConnected: boolean;
  tableStatus: {
    profiles: boolean;
    weightLogs: boolean;
    mealLogs: boolean;
    waterLogs: boolean;
    chatMessages: boolean;
    notes: boolean;
    projects: boolean;
    workoutRoutines: boolean;
    workoutLogs: boolean;
  };
  lastSyncedAt: string | null;
  error?: string | null;
}

export interface FullUserData {
  profile?: UserProfile;
  weightLogs?: WeightLog[];
  mealLogs?: MealLog[];
  chatMessages?: ChatMessage[];
  chatSessions?: ChatSession[];
  notes?: NoteItem[];
  projects?: ProjectItem[];
  workoutRoutines?: WorkoutRoutine[];
  workoutLogs?: WorkoutSessionLog[];
  waterIntake?: Record<string, number>;
}

// Debounce timer for background cloud backups
let cloudSyncTimeout: any = null;

export const SupabaseService = {
  // Test connection to Supabase and check if tables exist
  async checkConnection(): Promise<SupabaseSyncStatus> {
    const status: SupabaseSyncStatus = {
      isConnected: false,
      tableStatus: {
        profiles: false,
        weightLogs: false,
        mealLogs: false,
        waterLogs: false,
        chatMessages: false,
        notes: false,
        projects: false,
        workoutRoutines: false,
        workoutLogs: false,
      },
      lastSyncedAt: null,
      error: null,
    };

    try {
      const client = getSupabaseClient();

      // Check auth connection
      const { data: sessionData } = await client.auth.getSession();
      if (sessionData) {
        status.isConnected = true;
      }

      // Check profiles table
      const { error: pErr } = await client.from("base0_profiles").select("id").limit(1);
      if (!pErr) {
        status.isConnected = true;
        status.tableStatus.profiles = true;
      }

      // Check weight logs
      const { error: wErr } = await client.from("base0_weight_logs").select("id").limit(1);
      if (!wErr) status.tableStatus.weightLogs = true;

      // Check meal logs
      const { error: mErr } = await client.from("base0_meal_logs").select("id").limit(1);
      if (!mErr) status.tableStatus.mealLogs = true;

      // Check water logs
      const { error: wtErr } = await client.from("base0_water_logs").select("id").limit(1);
      if (!wtErr) status.tableStatus.waterLogs = true;

      // Check chat messages
      const { error: cErr } = await client.from("base0_chat_messages").select("id").limit(1);
      if (!cErr) status.tableStatus.chatMessages = true;

      // Check notes
      const { error: nErr } = await client.from("base0_notes").select("id").limit(1);
      if (!nErr) status.tableStatus.notes = true;

      // Check projects
      const { error: prErr } = await client.from("base0_projects").select("id").limit(1);
      if (!prErr) status.tableStatus.projects = true;

      // Check workout routines
      const { error: wrErr } = await client.from("base0_workout_routines").select("id").limit(1);
      if (!wrErr) status.tableStatus.workoutRoutines = true;

      // Check workout logs
      const { error: wlErr } = await client.from("base0_workout_logs").select("id").limit(1);
      if (!wlErr) status.tableStatus.workoutLogs = true;
    } catch (e: any) {
      status.error = e?.message || "Erro ao conectar ao Supabase";
    }

    return status;
  },

  // ---------------- AUTHENTICATION ---------------- //

  async getSession() {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (e) {
      console.warn("Supabase getSession error:", e);
      return null;
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const client = getSupabaseClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return null;

      const meta = user.user_metadata || {};
      return {
        id: user.id,
        email: user.email || meta.email || "atleta@base0.app",
        name: meta.name || meta.profile?.name || (user.email ? user.email.split("@")[0] : "Atleta"),
        avatarUrl: meta.avatarUrl || meta.profile?.avatarUrl,
        createdAt: user.created_at || new Date().toISOString(),
      };
    } catch (e) {
      console.warn("Supabase getCurrentUser error:", e);
      return null;
    }
  },

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const meta = data.user.user_metadata || {};
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || email.trim().toLowerCase(),
          name: meta.name || (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)),
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        return { user: authUser };
      }
      return { user: null, error: "Usuário não encontrado." };
    } catch (e: any) {
      return { user: null, error: e?.message || "Erro ao autenticar." };
    }
  },

  async signUp(email: string, password: string, name: string): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const client = getSupabaseClient();
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: cleanName,
          },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: cleanName || "Atleta",
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        return { user: authUser };
      }
      return { user: null, error: "Erro ao criar conta." };
    } catch (e: any) {
      return { user: null, error: e?.message || "Erro ao cadastrar usuário." };
    }
  },

  async signOut(): Promise<void> {
    try {
      const client = getSupabaseClient();
      await client.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut error:", e);
    }
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const client = getSupabaseClient();
    return client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        callback({
          id: session.user.id,
          email: session.user.email || "atleta@base0.app",
          name: meta.name || "Atleta",
          createdAt: session.user.created_at || new Date().toISOString(),
        });
      } else {
        callback(null);
      }
    });
  },

  // ---------------- CLOUD DATA PERSISTENCE & RESTORE ---------------- //

  /**
   * Fetches ALL user data from Supabase.
   * Checks both Supabase Auth user_metadata (which always works without tables)
   * and relational tables if created in the project.
   */
  async fetchAllUserData(): Promise<FullUserData> {
    const client = getSupabaseClient();
    const result: FullUserData = {};

    try {
      // 1. Get authenticated user
      const { data: { user } } = await client.auth.getUser();

      // Read from Supabase user_metadata first (guaranteed cloud storage)
      if (user?.user_metadata) {
        const meta = user.user_metadata;
        if (meta.profile) result.profile = meta.profile;
        if (Array.isArray(meta.weightLogs) && meta.weightLogs.length > 0) result.weightLogs = meta.weightLogs;
        if (Array.isArray(meta.mealLogs) && meta.mealLogs.length > 0) result.mealLogs = meta.mealLogs;
        if (Array.isArray(meta.chatMessages) && meta.chatMessages.length > 0) result.chatMessages = meta.chatMessages;
        if (Array.isArray(meta.chatSessions) && meta.chatSessions.length > 0) result.chatSessions = meta.chatSessions;
        if (Array.isArray(meta.notes) && meta.notes.length > 0) result.notes = meta.notes;
        if (Array.isArray(meta.projects) && meta.projects.length > 0) result.projects = meta.projects;
        if (Array.isArray(meta.workoutRoutines) && meta.workoutRoutines.length > 0) result.workoutRoutines = meta.workoutRoutines;
        if (Array.isArray(meta.workoutLogs) && meta.workoutLogs.length > 0) result.workoutLogs = meta.workoutLogs;
        if (meta.waterIntake && typeof meta.waterIntake === "object") result.waterIntake = meta.waterIntake;

        // Also check if stored under base0_cloud_data bundle
        if (meta.base0_cloud_data) {
          const bundle = meta.base0_cloud_data;
          if (!result.profile && bundle.profile) result.profile = bundle.profile;
          if ((!result.weightLogs || result.weightLogs.length === 0) && Array.isArray(bundle.weightLogs)) result.weightLogs = bundle.weightLogs;
          if ((!result.mealLogs || result.mealLogs.length === 0) && Array.isArray(bundle.mealLogs)) result.mealLogs = bundle.mealLogs;
          if ((!result.notes || result.notes.length === 0) && Array.isArray(bundle.notes)) result.notes = bundle.notes;
          if ((!result.projects || result.projects.length === 0) && Array.isArray(bundle.projects)) result.projects = bundle.projects;
          if ((!result.workoutRoutines || result.workoutRoutines.length === 0) && Array.isArray(bundle.workoutRoutines)) result.workoutRoutines = bundle.workoutRoutines;
          if ((!result.workoutLogs || result.workoutLogs.length === 0) && Array.isArray(bundle.workoutLogs)) result.workoutLogs = bundle.workoutLogs;
          if (!result.waterIntake && bundle.waterIntake) result.waterIntake = bundle.waterIntake;
          if ((!result.chatSessions || result.chatSessions.length === 0) && Array.isArray(bundle.chatSessions)) result.chatSessions = bundle.chatSessions;
        }
      }

      // 2. Also query relational database tables if user ran the SQL migration
      const userId = user?.id || "default_user";

      // Profiles table
      try {
        const { data: pRows } = await client
          .from("base0_profiles")
          .select("*")
          .or(`id.eq.${userId},id.eq.default_user`)
          .limit(1)
          .maybeSingle();

        if (pRows) {
          result.profile = {
            name: pRows.name,
            email: pRows.email || user?.email,
            age: pRows.age || 28,
            gender: (pRows.gender as any) || "male",
            height: Number(pRows.height) || 175,
            currentWeight: Number(pRows.current_weight) || 75,
            startWeight: Number(pRows.start_weight) || 75,
            targetWeight: pRows.target_weight ? Number(pRows.target_weight) : undefined,
            activityLevel: (pRows.activity_level as any) || "moderate",
            goal: (pRows.goal as any) || "maintain",
            measurements: pRows.measurements || {},
            isConfigured: pRows.is_configured ?? true,
            createdAt: pRows.created_at || new Date().toISOString(),
            updatedAt: pRows.updated_at || new Date().toISOString(),
          };
        }
      } catch {}

      // Weight logs table
      try {
        const { data: wRows } = await client
          .from("base0_weight_logs")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`)
          .order("date", { ascending: false });

        if (wRows && wRows.length > 0) {
          result.weightLogs = wRows.map((r: any) => ({
            id: r.id,
            date: r.date,
            weight: Number(r.weight),
            note: r.note || undefined,
          }));
        }
      } catch {}

      // Meal logs table
      try {
        const { data: mRows } = await client
          .from("base0_meal_logs")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`)
          .order("created_at", { ascending: false });

        if (mRows && mRows.length > 0) {
          result.mealLogs = mRows.map((r: any) => ({
            id: r.id,
            date: r.date,
            time: r.time,
            title: r.title,
            category: r.category,
            totalCalories: Number(r.total_calories),
            totalProtein: Number(r.total_protein),
            totalCarbs: Number(r.total_carbs),
            totalFat: Number(r.total_fat),
            items: r.items || [],
            gulinhaFeedback: r.gulinha_feedback || undefined,
            photoUrl: r.photo_url || undefined,
          }));
        }
      } catch {}

      // Water logs table
      try {
        const { data: wtRows } = await client
          .from("base0_water_logs")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`);

        if (wtRows && wtRows.length > 0) {
          result.waterIntake = result.waterIntake || {};
          wtRows.forEach((r: any) => {
            result.waterIntake![r.date] = Number(r.amount_ml);
          });
        }
      } catch {}

      // Notes table
      try {
        const { data: nRows } = await client
          .from("base0_notes")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`)
          .order("updated_at", { ascending: false });

        if (nRows && nRows.length > 0) {
          result.notes = nRows.map((r: any) => ({
            id: r.id,
            title: r.title,
            content: r.content,
            category: r.category,
            color: r.color || "zinc",
            checklist: r.checklist || [],
            date: r.created_at || r.updated_at || new Date().toISOString(),
            updatedAt: r.updated_at,
          }));
        }
      } catch {}

      // Projects table
      try {
        const { data: prRows } = await client
          .from("base0_projects")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`)
          .order("updated_at", { ascending: false });

        if (prRows && prRows.length > 0) {
          result.projects = prRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            description: r.description,
            category: r.category,
            status: r.status,
            color: r.color,
            assistantTone: r.assistant_tone || "simple",
            notes: r.notes || [],
            chatMessages: r.chat_messages || [],
            tasks: r.tasks || [],
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      } catch {}

      // Workout Routines table
      try {
        const { data: wrRows } = await client
          .from("base0_workout_routines")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`);

        if (wrRows && wrRows.length > 0) {
          result.workoutRoutines = wrRows.map((r: any) => ({
            id: r.id,
            name: r.name,
            targetMuscles: r.description || "Geral",
            color: r.color,
            exercises: r.exercises || [],
            updatedAt: r.updated_at,
          }));
        }
      } catch {}

      // Workout Logs table
      try {
        const { data: wlRows } = await client
          .from("base0_workout_logs")
          .select("*")
          .or(`profile_id.eq.${userId},profile_id.eq.default_user`)
          .order("created_at", { ascending: false });

        if (wlRows && wlRows.length > 0) {
          result.workoutLogs = wlRows.map((r: any) => ({
            id: r.id,
            routineId: r.routine_id,
            routineName: r.routine_name,
            date: r.date,
            durationMinutes: Number(r.duration_minutes),
            totalVolumeKg: Number(r.total_volume_kg),
            completedSetsCount: Number(r.completed_sets_count),
            notes: r.notes,
          }));
        }
      } catch {}
    } catch (err) {
      console.warn("Error fetching data from Supabase:", err);
    }

    return result;
  },

  /**
   * Synchronizes full state to Supabase.
   * Debounced to ensure snappy performance without flooding network.
   */
  scheduleCloudBackup(data: Partial<FullUserData>): void {
    if (cloudSyncTimeout) clearTimeout(cloudSyncTimeout);
    cloudSyncTimeout = setTimeout(() => {
      this.syncAllUserData(data).catch((err) => {
        console.warn("Background cloud sync error:", err);
      });
    }, 400);
  },

  async syncAllUserData(data: Partial<FullUserData>): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id || "default_user";

      // 1. Update Supabase Auth user_metadata (works in 100% of Supabase projects without needing SQL tables)
      if (user) {
        const existingMeta = user.user_metadata || {};
        const updatedMeta: any = {
          ...existingMeta,
          lastSyncAt: new Date().toISOString(),
        };

        if (data.profile) updatedMeta.profile = data.profile;
        if (data.weightLogs) updatedMeta.weightLogs = data.weightLogs;
        if (data.mealLogs) updatedMeta.mealLogs = data.mealLogs;
        if (data.waterIntake) updatedMeta.waterIntake = data.waterIntake;
        if (data.notes) updatedMeta.notes = data.notes;
        if (data.projects) updatedMeta.projects = data.projects;
        if (data.workoutRoutines) updatedMeta.workoutRoutines = data.workoutRoutines;
        if (data.workoutLogs) updatedMeta.workoutLogs = data.workoutLogs;
        if (data.chatSessions) updatedMeta.chatSessions = data.chatSessions;

        // Bundle backup for instant restore
        updatedMeta.base0_cloud_data = {
          ...(existingMeta.base0_cloud_data || {}),
          ...data,
          syncedAt: new Date().toISOString(),
        };

        await client.auth.updateUser({ data: updatedMeta }).catch((e) => {
          console.warn("Could not update user_metadata in Supabase:", e);
        });
      }

      // 2. Also push to relational tables if they exist
      if (data.profile) {
        try {
          await client
            .from("base0_profiles")
            .upsert(
              {
                id: userId,
                email: user?.email || data.profile.email,
                name: data.profile.name,
                age: data.profile.age,
                gender: data.profile.gender,
                height: data.profile.height,
                current_weight: data.profile.currentWeight,
                start_weight: data.profile.startWeight,
                target_weight: data.profile.targetWeight || null,
                activity_level: data.profile.activityLevel,
                goal: data.profile.goal,
                measurements: data.profile.measurements || {},
                is_configured: data.profile.isConfigured,
                created_at: data.profile.createdAt,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );
        } catch {}
      }

      if (data.weightLogs && data.weightLogs.length > 0) {
        try {
          const rows = data.weightLogs.map((w) => ({
            id: w.id,
            profile_id: userId,
            date: w.date,
            weight: w.weight,
            note: w.note || null,
          }));
          await client.from("base0_weight_logs").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      if (data.mealLogs && data.mealLogs.length > 0) {
        try {
          const rows = data.mealLogs.map((m) => ({
            id: m.id,
            profile_id: userId,
            date: m.date,
            time: m.time,
            title: m.title,
            category: m.category,
            total_calories: m.totalCalories,
            total_protein: m.totalProtein,
            total_carbs: m.totalCarbs,
            total_fat: m.totalFat,
            items: m.items || [],
            gulinha_feedback: m.gulinhaFeedback || null,
            photo_url: m.photoUrl || null,
          }));
          await client.from("base0_meal_logs").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      if (data.notes && data.notes.length > 0) {
        try {
          const rows = data.notes.map((n) => ({
            id: n.id,
            profile_id: userId,
            title: n.title,
            content: n.content,
            category: n.category || "Geral",
            color: n.color || "zinc",
            checklist: n.checklist || [],
            created_at: n.date || n.updatedAt || new Date().toISOString(),
            updated_at: n.updatedAt || new Date().toISOString(),
          }));
          await client.from("base0_notes").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      if (data.projects && data.projects.length > 0) {
        try {
          const rows = data.projects.map((p) => ({
            id: p.id,
            profile_id: userId,
            name: p.name,
            description: p.description || "",
            category: p.category || "Geral",
            status: p.status || "active",
            color: p.color || null,
            assistant_tone: p.assistantTone || "simple",
            notes: p.notes || [],
            chat_messages: p.chatMessages || [],
            tasks: p.tasks || [],
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          }));
          await client.from("base0_projects").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      if (data.workoutRoutines && data.workoutRoutines.length > 0) {
        try {
          const rows = data.workoutRoutines.map((r) => ({
            id: r.id,
            profile_id: userId,
            name: r.name,
            description: r.targetMuscles || "",
            color: r.color || null,
            exercises: r.exercises || [],
            updated_at: new Date().toISOString(),
          }));
          await client.from("base0_workout_routines").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      if (data.workoutLogs && data.workoutLogs.length > 0) {
        try {
          const rows = data.workoutLogs.map((l) => ({
            id: l.id,
            profile_id: userId,
            routine_id: l.routineId || null,
            routine_name: l.routineName,
            date: l.date,
            duration_minutes: l.durationMinutes,
            total_volume_kg: l.totalVolumeKg,
            completed_sets_count: l.completedSetsCount,
            notes: l.notes || null,
          }));
          await client.from("base0_workout_logs").upsert(rows, { onConflict: "id" });
        } catch {}
      }

      return true;
    } catch (err) {
      console.warn("Supabase syncAllUserData warning:", err);
      return false;
    }
  },

  // Individual Sync Handlers
  async syncProfile(profile: UserProfile): Promise<boolean> {
    return this.syncAllUserData({ profile });
  },

  async syncWeightLog(log: WeightLog): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id || "default_user";
      await client.from("base0_weight_logs").upsert(
        {
          id: log.id,
          profile_id: userId,
          date: log.date,
          weight: log.weight,
          note: log.note || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      return true;
    } catch {
      return false;
    }
  },

  async deleteWeightLog(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      await client.from("base0_weight_logs").delete().eq("id", id);
      return true;
    } catch {
      return false;
    }
  },

  async syncMealLog(meal: MealLog): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id || "default_user";
      await client.from("base0_meal_logs").upsert(
        {
          id: meal.id,
          profile_id: userId,
          date: meal.date,
          time: meal.time,
          title: meal.title,
          category: meal.category,
          total_calories: meal.totalCalories,
          total_protein: meal.totalProtein,
          total_carbs: meal.totalCarbs,
          total_fat: meal.totalFat,
          items: meal.items || [],
          gulinha_feedback: meal.gulinhaFeedback || null,
          photo_url: meal.photoUrl || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      return true;
    } catch {
      return false;
    }
  },

  async deleteMealLog(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      await client.from("base0_meal_logs").delete().eq("id", id);
      return true;
    } catch {
      return false;
    }
  },

  async syncWaterIntake(dateStr: string, amount: number): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id || "default_user";
      await client.from("base0_water_logs").upsert(
        {
          id: `${userId}_${dateStr}`,
          date: dateStr,
          profile_id: userId,
          amount_ml: amount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      return true;
    } catch {
      return false;
    }
  },

  async syncChatMessage(msg: ChatMessage): Promise<boolean> {
    const client = getSupabaseClient();
    try {
      const { data: { user } } = await client.auth.getUser();
      const userId = user?.id || "default_user";
      await client.from("base0_chat_messages").upsert(
        {
          id: msg.id,
          profile_id: userId,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        },
        { onConflict: "id" }
      );
      return true;
    } catch {
      return false;
    }
  },

  async syncProjects(projects: ProjectItem[]): Promise<boolean> {
    return this.syncAllUserData({ projects });
  },

  async syncNotes(notes: NoteItem[]): Promise<boolean> {
    return this.syncAllUserData({ notes });
  },

  async syncWorkoutRoutines(workoutRoutines: WorkoutRoutine[]): Promise<boolean> {
    return this.syncAllUserData({ workoutRoutines });
  },

  async syncWorkoutLogs(workoutLogs: WorkoutSessionLog[]): Promise<boolean> {
    return this.syncAllUserData({ workoutLogs });
  },

  // Legacy full push for modal button
  async pushAllToSupabase(
    profile: UserProfile,
    weightLogs: WeightLog[],
    mealLogs: MealLog[],
    chatMessages: ChatMessage[],
    waterIntake: number,
    todayStr: string,
    notes?: NoteItem[],
    projects?: ProjectItem[],
    workoutRoutines?: WorkoutRoutine[],
    workoutLogs?: WorkoutSessionLog[]
  ): Promise<{ success: boolean; errors: string[] }> {
    try {
      const waterMap: Record<string, number> = {};
      waterMap[todayStr] = waterIntake;

      const ok = await this.syncAllUserData({
        profile,
        weightLogs,
        mealLogs,
        chatMessages,
        notes,
        projects,
        workoutRoutines,
        workoutLogs,
        waterIntake: waterMap,
      });

      return {
        success: ok,
        errors: ok ? [] : ["Falha parcial de sincronização"],
      };
    } catch (e: any) {
      return {
        success: false,
        errors: [e?.message || "Erro inesperado ao sincronizar"],
      };
    }
  },

  // Legacy fetchAllData alias for backwards compatibility
  async fetchAllData() {
    return this.fetchAllUserData();
  },
};
