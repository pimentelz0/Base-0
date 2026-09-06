import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserProfile, WeightLog, MealLog, ChatMessage } from "../types";

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
      },
    });
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();

// SQL Schema for user to execute in Supabase SQL Editor if needed
export const SUPABASE_SCHEMA_SQL = `-- Schema SQL para o Supabase - Base 0 (Gym & Nutrition)
-- Execute no SQL Editor do seu projeto Supabase: https://supabase.com/dashboard/project/gknroyivfcfyrlkhjxst/sql

-- 1. Tabela de Perfil do Atleta
CREATE TABLE IF NOT EXISTS base0_profiles (
  id TEXT PRIMARY KEY DEFAULT 'default_user',
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
  profile_id TEXT DEFAULT 'default_user',
  date TIMESTAMPTZ NOT NULL,
  weight NUMERIC NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Diário de Refeições
CREATE TABLE IF NOT EXISTS base0_meal_logs (
  id TEXT PRIMARY KEY,
  profile_id TEXT DEFAULT 'default_user',
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
  date TEXT PRIMARY KEY,
  profile_id TEXT DEFAULT 'default_user',
  amount_ml NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Conversas com Gulinha AI
CREATE TABLE IF NOT EXISTS base0_chat_messages (
  id TEXT PRIMARY KEY,
  profile_id TEXT DEFAULT 'default_user',
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS e criar políticas públicas permissivas para anon
ALTER TABLE base0_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE base0_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access base0_profiles') THEN
    CREATE POLICY "Public Access base0_profiles" ON base0_profiles FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access base0_weight_logs') THEN
    CREATE POLICY "Public Access base0_weight_logs" ON base0_weight_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access base0_meal_logs') THEN
    CREATE POLICY "Public Access base0_meal_logs" ON base0_meal_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access base0_water_logs') THEN
    CREATE POLICY "Public Access base0_water_logs" ON base0_water_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access base0_chat_messages') THEN
    CREATE POLICY "Public Access base0_chat_messages" ON base0_chat_messages FOR ALL USING (true) WITH CHECK (true);
  END IF;
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
  };
  lastSyncedAt: string | null;
  error?: string | null;
}

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
      },
      lastSyncedAt: null,
      error: null,
    };

    try {
      const client = getSupabaseClient();

      // Check profiles table
      const { data: pData, error: pErr } = await client
        .from("base0_profiles")
        .select("id")
        .limit(1);

      if (!pErr) {
        status.isConnected = true;
        status.tableStatus.profiles = true;
      } else {
        // Try fallback table name 'profiles'
        const { error: p2Err } = await client.from("profiles").select("id").limit(1);
        if (!p2Err) {
          status.isConnected = true;
          status.tableStatus.profiles = true;
        }
      }

      // Check weight logs
      const { error: wErr } = await client.from("base0_weight_logs").select("id").limit(1);
      if (!wErr) status.tableStatus.weightLogs = true;

      // Check meal logs
      const { error: mErr } = await client.from("base0_meal_logs").select("id").limit(1);
      if (!mErr) status.tableStatus.mealLogs = true;

      // Check water logs
      const { error: waterErr } = await client.from("base0_water_logs").select("date").limit(1);
      if (!waterErr) status.tableStatus.waterLogs = true;

      // Check chat messages
      const { error: cErr } = await client.from("base0_chat_messages").select("id").limit(1);
      if (!cErr) status.tableStatus.chatMessages = true;

      // If at least one check responded without network fail, we are connected
      if (!status.isConnected && !pErr?.message?.includes("Failed to fetch")) {
        status.isConnected = true;
      }

      status.lastSyncedAt = new Date().toISOString();
      return status;
    } catch (e: any) {
      console.warn("Supabase connection check warning:", e);
      status.error = e?.message || "Erro ao conectar ao Supabase";
      return status;
    }
  },

  // 1. Fetch all data from Supabase
  async fetchAllData(): Promise<{
    profile: UserProfile | null;
    weightLogs: WeightLog[] | null;
    mealLogs: MealLog[] | null;
    chatMessages: ChatMessage[] | null;
    waterIntake: Record<string, number> | null;
  }> {
    const client = getSupabaseClient();

    let profile: UserProfile | null = null;
    let weightLogs: WeightLog[] | null = null;
    let mealLogs: MealLog[] | null = null;
    let chatMessages: ChatMessage[] | null = null;
    let waterIntake: Record<string, number> | null = null;

    try {
      // Fetch profile
      const { data: pRows, error: pErr } = await client
        .from("base0_profiles")
        .select("*")
        .eq("id", "default_user")
        .maybeSingle();

      if (!pErr && pRows) {
        profile = {
          name: pRows.name || "Atleta Base 0",
          age: pRows.age ?? 26,
          gender: pRows.gender || "male",
          height: Number(pRows.height) || 178,
          currentWeight: Number(pRows.current_weight) || 78.5,
          startWeight: Number(pRows.start_weight) || 84.0,
          targetWeight: pRows.target_weight ? Number(pRows.target_weight) : undefined,
          activityLevel: pRows.activity_level || "moderate",
          goal: pRows.goal || "lose_fat",
          measurements: pRows.measurements || {},
          avatarUrl: pRows.avatar_url || undefined,
          isConfigured: pRows.is_configured ?? true,
          createdAt: pRows.created_at || new Date().toISOString(),
          updatedAt: pRows.updated_at || new Date().toISOString(),
        };
      }

      // Fetch weight logs
      const { data: wRows, error: wErr } = await client
        .from("base0_weight_logs")
        .select("*")
        .order("date", { ascending: false });

      if (!wErr && wRows && wRows.length > 0) {
        weightLogs = wRows.map((r: any) => ({
          id: r.id,
          date: r.date,
          weight: Number(r.weight),
          note: r.note || "",
        }));
      }

      // Fetch meal logs
      const { data: mRows, error: mErr } = await client
        .from("base0_meal_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!mErr && mRows && mRows.length > 0) {
        mealLogs = mRows.map((r: any) => ({
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

      // Fetch water logs
      const { data: waterRows, error: waterErr } = await client
        .from("base0_water_logs")
        .select("*");

      if (!waterErr && waterRows && waterRows.length > 0) {
        waterIntake = {};
        for (const row of waterRows) {
          waterIntake[row.date] = Number(row.amount_ml);
        }
      }

      // Fetch chat messages
      const { data: cRows, error: cErr } = await client
        .from("base0_chat_messages")
        .select("*")
        .order("timestamp", { ascending: true });

      if (!cErr && cRows && cRows.length > 0) {
        chatMessages = cRows.map((r: any) => ({
          id: r.id,
          role: r.role,
          content: r.content,
          timestamp: r.timestamp,
        }));
      }
    } catch (err) {
      console.warn("Error fetching data from Supabase:", err);
    }

    return { profile, weightLogs, mealLogs, chatMessages, waterIntake };
  },

  // 2. Save profile
  async syncProfile(profile: UserProfile): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const payload = {
        id: "default_user",
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        height: profile.height,
        current_weight: profile.currentWeight,
        start_weight: profile.startWeight,
        target_weight: profile.targetWeight || null,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        measurements: profile.measurements || {},
        avatar_url: profile.avatarUrl || null,
        is_configured: profile.isConfigured,
        created_at: profile.createdAt,
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from("base0_profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not sync profile to Supabase:", e);
      return false;
    }
  },

  // 3. Sync weight logs
  async syncWeightLog(log: WeightLog): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_weight_logs").upsert(
        {
          id: log.id,
          profile_id: "default_user",
          date: log.date,
          weight: log.weight,
          note: log.note || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not sync weight log to Supabase:", e);
      return false;
    }
  },

  async deleteWeightLog(id: string): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_weight_logs").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not delete weight log from Supabase:", e);
      return false;
    }
  },

  // 4. Sync meal logs
  async syncMealLog(meal: MealLog): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_meal_logs").upsert(
        {
          id: meal.id,
          profile_id: "default_user",
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
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not sync meal log to Supabase:", e);
      return false;
    }
  },

  async deleteMealLog(id: string): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_meal_logs").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not delete meal log from Supabase:", e);
      return false;
    }
  },

  // 5. Sync water intake
  async syncWaterIntake(dateStr: string, amount: number): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_water_logs").upsert(
        {
          date: dateStr,
          profile_id: "default_user",
          amount_ml: amount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      );
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not sync water log to Supabase:", e);
      return false;
    }
  },

  // 6. Sync chat message
  async syncChatMessage(msg: ChatMessage): Promise<boolean> {
    try {
      const client = getSupabaseClient();
      const { error } = await client.from("base0_chat_messages").upsert(
        {
          id: msg.id,
          profile_id: "default_user",
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Could not sync chat message to Supabase:", e);
      return false;
    }
  },

  // 7. Full sync push (push all current local storage state into Supabase)
  async pushAllToSupabase(
    profile: UserProfile,
    weightLogs: WeightLog[],
    mealLogs: MealLog[],
    chatMessages: ChatMessage[],
    waterIntake: number,
    todayStr: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    const client = getSupabaseClient();

    try {
      // 1. Profile
      const pOk = await this.syncProfile(profile);
      if (!pOk) errors.push("base0_profiles");

      // 2. Weight logs
      if (weightLogs.length > 0) {
        const rows = weightLogs.map((w) => ({
          id: w.id,
          profile_id: "default_user",
          date: w.date,
          weight: w.weight,
          note: w.note || null,
        }));
        const { error } = await client.from("base0_weight_logs").upsert(rows, { onConflict: "id" });
        if (error) errors.push("base0_weight_logs");
      }

      // 3. Meal logs
      if (mealLogs.length > 0) {
        const rows = mealLogs.map((m) => ({
          id: m.id,
          profile_id: "default_user",
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
        const { error } = await client.from("base0_meal_logs").upsert(rows, { onConflict: "id" });
        if (error) errors.push("base0_meal_logs");
      }

      // 4. Water log
      const wOk = await this.syncWaterIntake(todayStr, waterIntake);
      if (!wOk) errors.push("base0_water_logs");

      // 5. Chat messages
      if (chatMessages.length > 0) {
        const rows = chatMessages.map((c) => ({
          id: c.id,
          profile_id: "default_user",
          role: c.role,
          content: c.content,
          timestamp: c.timestamp,
        }));
        const { error } = await client.from("base0_chat_messages").upsert(rows, { onConflict: "id" });
        if (error) errors.push("base0_chat_messages");
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (e: any) {
      return {
        success: false,
        errors: [e?.message || "Erro inesperado ao sincronizar"],
      };
    }
  },
};
