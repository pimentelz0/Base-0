import { UserProfile, WeightLog, MealLog, NoteItem, ProjectItem, ChatSession, AuthUser } from "../types";
import { StorageService, DEFAULT_PROFILE } from "./storage";
import { IdbService } from "./idbStorage";
import { SupabaseService } from "../lib/supabase";

export interface RecoveredDataSummary {
  profile?: UserProfile;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
  notes: NoteItem[];
  projects: ProjectItem[];
  chatSessions: ChatSession[];
  waterLogs: Record<string, number>;
  source: "supabase" | "indexeddb" | "browser_storage" | "none";
  details: string;
}

export const DeepRecoveryService = {
  /**
   * Scans all browser storages (IndexedDB, localStorage residual keys, sessionStorage, Supabase)
   * to discover any previously filled data.
   */
  async scanForLostData(): Promise<RecoveredDataSummary> {
    const summary: RecoveredDataSummary = {
      weightLogs: [],
      mealLogs: [],
      notes: [],
      projects: [],
      chatSessions: [],
      waterLogs: {},
      source: "none",
      details: "",
    };

    const sourcesFound: string[] = [];

    // 1. Scan IndexedDB snapshots
    try {
      const snap = await IdbService.getLatestSnapshot();
      if (snap && snap.data) {
        if (snap.data.base0_profile_v1) {
          try {
            const p = typeof snap.data.base0_profile_v1 === "string" ? JSON.parse(snap.data.base0_profile_v1) : snap.data.base0_profile_v1;
            if (p && (p.name || p.currentWeight)) summary.profile = p;
          } catch {}
        }
        if (snap.data.base0_weight_logs_v1) {
          try {
            const w = typeof snap.data.base0_weight_logs_v1 === "string" ? JSON.parse(snap.data.base0_weight_logs_v1) : snap.data.base0_weight_logs_v1;
            if (Array.isArray(w) && w.length > 0) summary.weightLogs = w;
          } catch {}
        }
        if (snap.data.base0_meal_logs_v1) {
          try {
            const m = typeof snap.data.base0_meal_logs_v1 === "string" ? JSON.parse(snap.data.base0_meal_logs_v1) : snap.data.base0_meal_logs_v1;
            if (Array.isArray(m) && m.length > 0) summary.mealLogs = m;
          } catch {}
        }
        if (snap.data.base0_notes_v1) {
          try {
            const n = typeof snap.data.base0_notes_v1 === "string" ? JSON.parse(snap.data.base0_notes_v1) : snap.data.base0_notes_v1;
            if (Array.isArray(n) && n.length > 0) summary.notes = n;
          } catch {}
        }
        if (snap.data.base0_projects_v1) {
          try {
            const pr = typeof snap.data.base0_projects_v1 === "string" ? JSON.parse(snap.data.base0_projects_v1) : snap.data.base0_projects_v1;
            if (Array.isArray(pr) && pr.length > 0) summary.projects = pr;
          } catch {}
        }
        if (summary.weightLogs.length || summary.mealLogs.length || summary.profile) {
          sourcesFound.push("Cofre Permanente IndexedDB");
          summary.source = "indexeddb";
        }
      }
    } catch (e) {
      console.warn("Idb snapshot scan error:", e);
    }

    // 2. Scan all localStorage keys for residual data (including legacy keys without prefix)
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;

          try {
            const val = localStorage.getItem(k);
            if (!val || val.length < 5) continue;

            const parsed = JSON.parse(val);

            // Check if profile-like
            if (!summary.profile && parsed && typeof parsed === "object" && ("currentWeight" in parsed || "startWeight" in parsed || "goal" in parsed)) {
              if (parsed.currentWeight || parsed.name) {
                summary.profile = parsed;
                sourcesFound.push(`Memória Local (chave ${k})`);
              }
            }

            // Check if weight logs array
            if (summary.weightLogs.length === 0 && Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.weight) {
              summary.weightLogs = parsed;
              sourcesFound.push(`Pesagens encontradas (${k})`);
            }

            // Check if meal logs array
            if (summary.mealLogs.length === 0 && Array.isArray(parsed) && parsed.length > 0 && (parsed[0]?.totalCalories !== undefined || parsed[0]?.category)) {
              summary.mealLogs = parsed;
              sourcesFound.push(`Refeições encontradas (${k})`);
            }

            // Check if notes array
            if (summary.notes.length === 0 && Array.isArray(parsed) && parsed.length > 0 && (parsed[0]?.title !== undefined || parsed[0]?.content !== undefined)) {
              summary.notes = parsed;
              sourcesFound.push(`Notas encontradas (${k})`);
            }

            // Check if projects array
            if (summary.projects.length === 0 && Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.title && parsed[0]?.metrics) {
              summary.projects = parsed;
              sourcesFound.push(`Projetos encontrados (${k})`);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.warn("Local residual scan error:", e);
    }

    // 3. Scan Supabase Cloud database
    try {
      const remote = await SupabaseService.fetchAllData();
      if (remote) {
        if (remote.profile && remote.profile.isConfigured && (!summary.profile || !summary.profile.isConfigured)) {
          summary.profile = remote.profile;
          sourcesFound.push("Nuvem Supabase (Perfil)");
          summary.source = "supabase";
        }
        if (remote.weightLogs && remote.weightLogs.length > summary.weightLogs.length) {
          summary.weightLogs = remote.weightLogs;
          sourcesFound.push(`Nuvem Supabase (${remote.weightLogs.length} Pesagens)`);
          summary.source = "supabase";
        }
        if (remote.mealLogs && remote.mealLogs.length > summary.mealLogs.length) {
          summary.mealLogs = remote.mealLogs;
          sourcesFound.push(`Nuvem Supabase (${remote.mealLogs.length} Refeições)`);
          summary.source = "supabase";
        }
        if (remote.waterIntake && Object.keys(remote.waterIntake).length > 0) {
          summary.waterLogs = { ...summary.waterLogs, ...remote.waterIntake };
          sourcesFound.push("Nuvem Supabase (Registros de Água)");
        }
      }
    } catch (e) {
      console.warn("Supabase scan error:", e);
    }

    if (sourcesFound.length > 0) {
      summary.details = sourcesFound.join(", ");
    } else {
      summary.details = "Nenhum dado residual encontrado nas memórias locais ou nuvem.";
    }

    return summary;
  },

  /**
   * Applies the recovered data into active Storage and IndexedDB vault.
   */
  async applyRecoveredData(data: RecoveredDataSummary): Promise<void> {
    if (data.profile) {
      StorageService.saveProfile(data.profile);
    }
    if (data.weightLogs.length > 0) {
      StorageService.saveWeightLogs(data.weightLogs);
    }
    if (data.mealLogs.length > 0) {
      StorageService.saveMealLogs(data.mealLogs);
    }
    if (data.notes.length > 0) {
      StorageService.saveNotes(data.notes);
    }
    if (data.projects.length > 0) {
      StorageService.saveProjects(data.projects);
    }
    if (Object.keys(data.waterLogs).length > 0) {
      Object.entries(data.waterLogs).forEach(([date, amount]) => {
        StorageService.saveWaterIntake(date, amount);
      });
    }

    // Force dual-vault synchronization
    await StorageService.initPersistence();
  },
};
