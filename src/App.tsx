import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, WeightLog, MealLog, ChatMessage, ChatSession, NoteItem, AuthUser } from "./types";
import { StorageService, DEFAULT_PROFILE } from "./utils/storage";
import { calculateMetrics } from "./utils/calculations";
import { Navbar } from "./components/Navbar";
import { HomeTab } from "./components/HomeTab";
import { GymTab, GymSectionType } from "./components/GymTab";
import { NotesTab } from "./components/NotesTab";
import { ProjectsTab } from "./components/projects/ProjectsTab";
import { ProfileTab } from "./components/ProfileTab";
import { ProfileModal } from "./components/ProfileModal";
import { BottomNav } from "./components/BottomNav";
import { MealAnalysisModal } from "./components/MealAnalysisModal";
import { ExportModal } from "./components/ExportModal";
import { SupabaseModal } from "./components/SupabaseModal";
import { GulinhaChat } from "./components/GulinhaChat";
import { LoginScreen } from "./components/LoginScreen";
import { SupabaseService } from "./lib/supabase";
import { GulinhaService, UserFitnessContext } from "./services/gulinhaService";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => StorageService.getAuthUser());
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => StorageService.getWeightLogs());
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => StorageService.getMealLogs());
  
  // Chat Sessions (like ChatGPT)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => StorageService.getChatSessions());
  const [activeChatSessionId, setActiveChatSessionId] = useState<string>(() => {
    const saved = StorageService.getActiveChatSessionId();
    const sessions = StorageService.getChatSessions();
    if (saved && sessions.some((s) => s.id === saved)) return saved;
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => StorageService.getNotes());
  
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [waterIntake, setWaterIntake] = useState<number>(() => StorageService.getWaterIntake(todayStr));

  // Theme state (Dark/Light mode)
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("base0_theme");
      if (saved === "light" || saved === "dark") return saved;
      if (document.documentElement.classList.contains("light")) return "light";
    }
    return "dark";
  });

  const handleToggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("base0_theme", next);
        if (next === "light") {
          document.documentElement.classList.add("light");
          document.documentElement.classList.remove("dark");
        } else {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        }
      }
      return next;
    });
  };

  // Keep DOM class synchronized with theme state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "light") {
        document.documentElement.classList.add("light");
        document.documentElement.classList.remove("dark");
      } else {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      }
    }
  }, [theme]);

  // Current active session and its messages
  const activeSession = useMemo(() => {
    return (
      chatSessions.find((s) => s.id === activeChatSessionId) ||
      chatSessions[0] || {
        id: activeChatSessionId,
        title: "Nova Conversa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      }
    );
  }, [chatSessions, activeChatSessionId]);

  const chatMessages = activeSession.messages;

  // Navigation and Modals
  const [activeTab, setActiveTab] = useState<string>("home");
  const [tabHistory, setTabHistory] = useState<string[]>(["home"]);
  const [gymSection, setGymSection] = useState<GymSectionType>("overview");

  const [isMealAnalysisOpen, setIsMealAnalysisOpen] = useState<boolean>(false);
  const [mealAnalysisDate, setMealAnalysisDate] = useState<string>(todayStr);
  const [mealAnalysisMode, setMealAnalysisMode] = useState<"manual" | "photo" | "text">("manual");
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const handleNavigateTab = (newTab: string) => {
    if (newTab !== activeTab) {
      setTabHistory((prev) => [...prev, newTab]);
      setActiveTab(newTab);
    }
  };

  const handleGoBack = () => {
    if (activeTab === "gym" && gymSection !== "overview") {
      setGymSection("overview");
      return;
    }
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop();
      const prevTab = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setActiveTab(prevTab || "home");
    } else if (activeTab !== "home") {
      setActiveTab("home");
    }
  };


  // Initial cloud sync from Supabase with timestamp-based conflict resolution
  useEffect(() => {
    async function loadCloudData() {
      try {
        const remote = await SupabaseService.fetchAllData();
        
        // 1. Profile: timestamp conflict resolution (never let old cloud data overwrite newer local edits)
        if (remote.profile) {
          const localProfile = StorageService.getProfile();
          const remoteTime = new Date(remote.profile.updatedAt || 0).getTime();
          const localTime = new Date(localProfile.updatedAt || 0).getTime();

          // Only accept remote if remote is strictly newer than local
          if (remoteTime > localTime) {
            const mergedProfile: UserProfile = {
              ...localProfile,
              ...remote.profile,
              measurements: {
                ...(localProfile.measurements || {}),
                ...(remote.profile.measurements || {}),
              },
              avatarUrl: remote.profile.avatarUrl || localProfile.avatarUrl,
            };
            setProfile(mergedProfile);
            StorageService.saveProfile(mergedProfile);
          } else if (localTime > remoteTime) {
            // Local has newer edits! Push local to Supabase so cloud catches up
            SupabaseService.syncProfile(localProfile).catch(console.warn);
          }
        }

        // 2. Weight logs: Merge union by ID without deleting any local or remote entry
        if (remote.weightLogs && remote.weightLogs.length > 0) {
          const localLogs = StorageService.getWeightLogs();
          const map = new Map<string, WeightLog>();
          remote.weightLogs.forEach((w) => map.set(w.id, w));
          localLogs.forEach((w) => map.set(w.id, w));
          const mergedLogs = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setWeightLogs(mergedLogs);
          StorageService.saveWeightLogs(mergedLogs);
        }

        // 3. Meal logs: Merge union by ID
        if (remote.mealLogs && remote.mealLogs.length > 0) {
          const localMeals = StorageService.getMealLogs();
          const map = new Map<string, MealLog>();
          remote.mealLogs.forEach((m) => map.set(m.id, m));
          localMeals.forEach((m) => map.set(m.id, m));
          const mergedMeals = Array.from(map.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setMealLogs(mergedMeals);
          StorageService.saveMealLogs(mergedMeals);
        }

        // 4. Chat messages: Merge union by ID and sort chronologically
        if (remote.chatMessages && remote.chatMessages.length > 0) {
          const localChat = StorageService.getChatMessages();
          const map = new Map<string, ChatMessage>();
          remote.chatMessages.forEach((c) => map.set(c.id, c));
          localChat.forEach((c) => map.set(c.id, c));
          const mergedChat = Array.from(map.values()).sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          setChatSessions((prev) => {
            const current = prev.map((s, idx) => {
              if (idx === 0) {
                return { ...s, messages: mergedChat };
              }
              return s;
            });
            StorageService.saveChatSessions(current);
            return current;
          });
          StorageService.saveChatMessages(mergedChat);
        }

        // 5. Water intake: Merge today's intake taking maximum
        if (remote.waterIntake && remote.waterIntake[todayStr] !== undefined) {
          const localWater = StorageService.getWaterIntake(todayStr);
          const maxWater = Math.max(localWater, remote.waterIntake[todayStr]);
          setWaterIntake(maxWater);
          StorageService.saveWaterIntake(todayStr, maxWater);
        }
      } catch (err) {
        console.warn("Supabase background init load error:", err);
      }
    }
    loadCloudData();
  }, [todayStr]);

  // Sync with localStorage
  useEffect(() => {
    StorageService.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    StorageService.saveWeightLogs(weightLogs);
  }, [weightLogs]);

  useEffect(() => {
    StorageService.saveMealLogs(mealLogs);
  }, [mealLogs]);

  useEffect(() => {
    StorageService.saveChatMessages(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    StorageService.saveWaterIntake(todayStr, waterIntake);
  }, [todayStr, waterIntake]);

  useEffect(() => {
    StorageService.saveNotes(notes);
  }, [notes]);

  // Derived calculated metrics
  const calculatedMetrics = useMemo(() => {
    return calculateMetrics(profile);
  }, [profile]);

  // Update profile
  const handleUpdateProfile = (updated: UserProfile) => {
    const toSave: UserProfile = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setProfile(toSave);
    StorageService.saveProfile(toSave);
    SupabaseService.syncProfile(toSave).catch(console.warn);
  };

  // Add new weight log
  const handleAddWeightLog = (newLog: Omit<WeightLog, "id">) => {
    const createdLog: WeightLog = {
      ...newLog,
      id: `w-${Date.now()}`,
    };
    const updatedLogs = [createdLog, ...weightLogs];
    setWeightLogs(updatedLogs);
    StorageService.saveWeightLogs(updatedLogs);

    // Update profile current weight
    const updatedProfile: UserProfile = {
      ...profile,
      currentWeight: newLog.weight,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);

    // Background sync to Supabase
    SupabaseService.syncWeightLog(createdLog).catch(console.warn);
    SupabaseService.syncProfile(updatedProfile).catch(console.warn);

    // Inform Gulinha in chat as an insight message based on the earliest registered weight
    const sortedLogs = [...updatedLogs].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const firstRecordedWeight = sortedLogs[0]?.weight ?? newLog.weight;
    const delta = Math.round((newLog.weight - firstRecordedWeight) * 10) / 10;
    const autoBotMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: "model",
      content: `⚖️ **Novo peso registrado:** ${newLog.weight} kg! ${
        delta < 0
          ? `Parabéns pela dedicação! Você já eliminou ${Math.abs(delta)} kg no total desde o início.`
          : delta > 0
          ? `Massa corporal em evolução (+${delta} kg desde o primeiro registro). Mantenha o foco nos treinos e proteínas!`
          : "Primeiro registro ou peso estável. Consistência é a chave do processo!"
      } \n\nSuas metas diárias de calorias (${calculatedMetrics.targetCalories} kcal) e TMB foram atualizadas.`,
      timestamp: new Date().toISOString(),
    };
    setChatSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, autoBotMsg] }
          : s
      );
      StorageService.saveChatSessions(next);
      return next;
    });
    SupabaseService.syncChatMessage(autoBotMsg).catch(console.warn);
  };

  const handleDeleteWeightLog = (id: string) => {
    const next = weightLogs.filter((l) => l.id !== id);
    setWeightLogs(next);
    StorageService.saveWeightLogs(next);
    SupabaseService.deleteWeightLog(id).catch(console.warn);
  };

  // Add new meal log
  const handleAddMealLog = (newMeal: Omit<MealLog, "id">) => {
    const createdMeal: MealLog = {
      ...newMeal,
      id: `m-${Date.now()}`,
    };
    const nextMeals = [createdMeal, ...mealLogs];
    setMealLogs(nextMeals);
    StorageService.saveMealLogs(nextMeals);
    SupabaseService.syncMealLog(createdMeal).catch(console.warn);

    // Send notification in chat
    const mealBotMsg: ChatMessage = {
      id: `bot-meal-${Date.now()}`,
      role: "model",
      content: `🥗 **Refeição adicionada com sucesso:** *${newMeal.title}* (${newMeal.totalCalories} kcal | ${newMeal.totalProtein}g Proteína).\n\n${newMeal.gulinhaFeedback || "Excelente escolha para seus objetivos físicos!"}`,
      timestamp: new Date().toISOString(),
    };
    setChatSessions((prev) => {
      const next = prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, updatedAt: new Date().toISOString(), messages: [...s.messages, mealBotMsg] }
          : s
      );
      StorageService.saveChatSessions(next);
      return next;
    });
    SupabaseService.syncChatMessage(mealBotMsg).catch(console.warn);
  };

  const handleDeleteMealLog = (id: string) => {
    const next = mealLogs.filter((m) => m.id !== id);
    setMealLogs(next);
    StorageService.saveMealLogs(next);
    SupabaseService.deleteMealLog(id).catch(console.warn);
  };

  // Add Water
  const handleAddWater = (amount: number) => {
    setWaterIntake((prev) => {
      const next = prev + amount;
      StorageService.saveWaterIntake(todayStr, next);
      SupabaseService.syncWaterIntake(todayStr, next).catch(console.warn);
      return next;
    });
  };

  // Notes actions
  const handleAddNote = (newNote: Omit<NoteItem, "id">) => {
    const created: NoteItem = {
      ...newNote,
      id: `note-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const next = [created, ...notes];
    setNotes(next);
    StorageService.saveNotes(next);
  };

  const handleUpdateNote = (updated: NoteItem) => {
    const next = notes.map((n) =>
      n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n
    );
    setNotes(next);
    StorageService.saveNotes(next);
  };

  const handleDeleteNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    StorageService.saveNotes(next);
  };

  // Chat Sessions handlers (like ChatGPT)
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova Conversa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    const updated = [newSession, ...chatSessions];
    setChatSessions(updated);
    setActiveChatSessionId(newSession.id);
    StorageService.saveChatSessions(updated);
    StorageService.saveActiveChatSessionId(newSession.id);
  };

  const handleSelectChatSession = (sessionId: string) => {
    setActiveChatSessionId(sessionId);
    StorageService.saveActiveChatSessionId(sessionId);
  };

  const handleDeleteChatSession = (sessionId: string) => {
    const remaining = chatSessions.filter((s) => s.id !== sessionId);
    if (remaining.length === 0) {
      const fresh: ChatSession = {
        id: `session-${Date.now()}`,
        title: "Nova Conversa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      setChatSessions([fresh]);
      setActiveChatSessionId(fresh.id);
      StorageService.saveChatSessions([fresh]);
      StorageService.saveActiveChatSessionId(fresh.id);
    } else {
      setChatSessions(remaining);
      StorageService.saveChatSessions(remaining);
      if (activeChatSessionId === sessionId) {
        setActiveChatSessionId(remaining[0].id);
        StorageService.saveActiveChatSessionId(remaining[0].id);
      }
    }
  };

  const handleClearAllChatSessions = () => {
    const fresh: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova Conversa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    setChatSessions([fresh]);
    setActiveChatSessionId(fresh.id);
    StorageService.saveChatSessions([fresh]);
    StorageService.saveActiveChatSessionId(fresh.id);
  };

  // Gulinha Chat Message Dispatcher with FULL APP CONTEXT across all tabs
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const targetSessionId = activeSession.id;
    const currentMsgs = activeSession.messages;
    const updatedWithUser = [...currentMsgs, userMsg];

    // Determine smart title if it's the first user message
    let sessionTitle = activeSession.title;
    if (
      (!sessionTitle || sessionTitle === "Nova Conversa" || sessionTitle === "Conversa Sem Título" || sessionTitle === "Conversa Inicial") &&
      userMsg.content.trim().length > 0
    ) {
      sessionTitle = userMsg.content.trim().slice(0, 32);
      if (userMsg.content.trim().length > 32) sessionTitle += "...";
    }

    const sessionsAfterUser = chatSessions.map((s) => {
      if (s.id === targetSessionId) {
        return {
          ...s,
          title: sessionTitle,
          updatedAt: new Date().toISOString(),
          messages: updatedWithUser,
        };
      }
      return s;
    });

    setChatSessions(sessionsAfterUser);
    StorageService.saveChatSessions(sessionsAfterUser);
    SupabaseService.syncChatMessage(userMsg).catch(console.warn);

    // Initial placeholder bot message for real-time typewriter stream
    const botMsgId = `bot-${Date.now()}`;
    const initialBotMsg: ChatMessage = {
      id: botMsgId,
      role: "model",
      content: "",
      isStreaming: true,
      timestamp: new Date().toISOString(),
    };

    const sessionsWithBotPending = sessionsAfterUser.map((s) => {
      if (s.id === targetSessionId) {
        return {
          ...s,
          messages: [...s.messages, initialBotMsg],
        };
      }
      return s;
    });

    setChatSessions(sessionsWithBotPending);

    // ==========================================
    // AGGREGATE COMPLETE DATA FROM ALL APP TABS
    // ==========================================

    // 1. Refeições e Nutrição (Aba GYM)
    const todayMeals = mealLogs.filter((m) => m.date === todayStr);
    const todayCalories = todayMeals.reduce((a, b) => a + (b.totalCalories || 0), 0);
    const todayProtein = todayMeals.reduce((a, b) => a + (b.totalProtein || 0), 0);
    const todayCarbs = todayMeals.reduce((a, b) => a + (b.totalCarbs || 0), 0);
    const todayFat = todayMeals.reduce((a, b) => a + (b.totalFat || 0), 0);

    const todayMealsSummary = todayMeals.length > 0
      ? todayMeals
          .map((m) => `${m.title} [${m.category}]: ${m.totalCalories} kcal, ${m.totalProtein}g prot, ${m.totalCarbs || 0}g carb, ${m.totalFat || 0}g gord`)
          .join("; ")
      : "Nenhuma refeição registrada hoje ainda";

    const recentMealsHistory = mealLogs
      .slice(0, 6)
      .map((m) => `${m.date} - ${m.title} (${m.totalCalories} kcal)`)
      .join("; ");

    // 2. Pesagens e Evolução de Peso
    const recentWeights = weightLogs.length > 0
      ? weightLogs
          .slice(0, 6)
          .map((w) => `${w.date}: ${w.weight}kg${w.note ? ` (${w.note})` : ""}`)
          .join(" -> ")
      : "Apenas peso cadastrado";

    const weightDiff = (profile.currentWeight - profile.startWeight).toFixed(1);
    const targetDiff = (profile.currentWeight - profile.targetWeight).toFixed(1);
    const weightEvolutionSummary = `Peso inicial: ${profile.startWeight}kg, Peso atual: ${profile.currentWeight}kg (${Number(weightDiff) > 0 ? "+" : ""}${weightDiff}kg). Meta: ${profile.targetWeight}kg (distância: ${targetDiff}kg).`;

    // 3. Rotinas de Treino (Aba GYM)
    const routines = StorageService.getWorkoutRoutines();
    const workoutRoutinesSummary = routines && routines.length > 0
      ? routines
          .map(
            (r) =>
              `${r.name}: ${r.exercises
                .map((e) =>
                  e.sets && e.sets.length > 0
                    ? `${e.name} (${e.sets.length} séries, ${e.sets[0].weight}kg x ${e.sets[0].reps} reps)`
                    : e.name
                )
                .join(", ")}`
          )
          .join(" | ")
      : "Nenhuma rotina de treino cadastrada";

    // 4. Sessões de Treino Concluídas
    const workoutLogs = StorageService.getWorkoutLogs();
    const recentWorkoutLogs = workoutLogs && workoutLogs.length > 0
      ? workoutLogs
          .slice(0, 5)
          .map((w) => `${w.date} (${w.routineName || "Treino"}): ${w.durationMinutes}min, ${w.totalVolumeKg || 0}kg volume total`)
          .join("; ")
      : "Nenhum histórico recente de treino";

    // Contexto estritamente restrito à aba GYM (treinos, nutrição, água, pesagens e medidas)
    const userContext: UserFitnessContext = {
      name: profile.name,
      height: profile.height,
      weight: profile.currentWeight,
      startWeight: profile.startWeight,
      targetWeight: profile.targetWeight,
      goal: profile.goal,
      gender: profile.gender,
      age: profile.age,
      activityLevel: profile.activityLevel,
      tmb: calculatedMetrics.tmb,
      get: calculatedMetrics.get,
      imc: calculatedMetrics.imc,
      imcCategory: calculatedMetrics.imcCategory,
      measurements: profile.measurements,
      // Nutrição da GYM
      todayCalories,
      targetCalories: calculatedMetrics.targetCalories,
      todayProtein,
      targetProtein: calculatedMetrics.targetProtein,
      todayCarbs,
      targetCarbs: calculatedMetrics.targetCarbs,
      todayFat,
      targetFat: calculatedMetrics.targetFat,
      todayMealsSummary,
      recentMealsHistory,
      // Hidratação
      todayWaterMl: waterIntake,
      targetWaterMl: Math.round(profile.currentWeight * 35),
      // Pesagens e Evolução
      recentWeights,
      weightEvolutionSummary,
      // Treinos e Rotinas da GYM
      workoutRoutinesSummary,
      recentWorkoutLogs,
    };

    let accumulatedContent = "";
    try {
      const finalReply = await GulinhaService.chatStream(
        updatedWithUser.map((m) => ({ role: m.role, content: m.content })),
        userContext,
        (_chunk, accumulated) => {
          accumulatedContent = accumulated;
          setChatSessions((prev) =>
            prev.map((s) => {
              if (s.id === targetSessionId) {
                return {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: accumulated, isStreaming: true }
                      : m
                  ),
                };
              }
              return s;
            })
          );
        }
      );

      const finalBotMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        content: finalReply || accumulatedContent || "Excelente pergunta! Como posso te ajudar mais?",
        isStreaming: false,
        timestamp: new Date().toISOString(),
      };

      setChatSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: s.messages.map((m) => (m.id === botMsgId ? finalBotMsg : m)),
            };
          }
          return s;
        });
        StorageService.saveChatSessions(next);
        return next;
      });

      SupabaseService.syncChatMessage(finalBotMsg).catch(console.warn);
    } catch (err: any) {
      console.error("Erro no Gulinha Chat:", err);
      const fallbackMsg: ChatMessage = {
        id: botMsgId,
        role: "model",
        content:
          err?.message?.includes("VITE_GEMINI_API_KEY") || err?.message?.includes("GEMINI_API_KEY")
            ? `⚠️ ${err.message}`
            : "Ops! Tive uma oscilação na conexão com o servidor. Mas lembre-se: sua TMB é de **" +
              calculatedMetrics.tmb +
              " kcal**, sua meta diária é **" +
              calculatedMetrics.targetCalories +
              " kcal** e você consumiu **" +
              todayCalories +
              " kcal** hoje. Como posso te orientar agora?",
        isStreaming: false,
        timestamp: new Date().toISOString(),
      };

      setChatSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              updatedAt: new Date().toISOString(),
              messages: s.messages.map((m) => (m.id === botMsgId ? fallbackMsg : m)),
            };
          }
          return s;
        });
        StorageService.saveChatSessions(next);
        return next;
      });
    }
  };

  const handleClearChat = () => {
    handleNewChat();
  };

  const handleLogin = (user: AuthUser, initialName?: string) => {
    setAuthUser(user);
    StorageService.saveAuthUser(user);

    if (initialName) {
      const updated: UserProfile = {
        ...profile,
        name: initialName,
        email: user.email,
        updatedAt: new Date().toISOString(),
      };
      setProfile(updated);
      StorageService.saveProfile(updated);
      SupabaseService.syncProfile(updated).catch(console.warn);
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    StorageService.clearAuthUser();
    setActiveTab("home");
  };

  const handleDeleteAccount = () => {
    StorageService.clearAll();
    StorageService.clearAuthUser();
    setAuthUser(null);
    setProfile(DEFAULT_PROFILE);
    setWeightLogs([]);
    setMealLogs([]);
    setNotes([]);
    setWaterIntake(0);
    const fresh: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova Conversa",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `c-init-${Date.now()}`,
          role: "model",
          content: "Conta reiniciada com sucesso! Sou o **Gulinha**, pronto para começar um novo ciclo com você.",
          timestamp: new Date().toISOString(),
        },
      ],
    };
    setChatSessions([fresh]);
    setActiveChatSessionId(fresh.id);
    StorageService.saveChatSessions([fresh]);
    StorageService.saveActiveChatSessionId(fresh.id);
    setActiveTab("home");
  };

  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col grid-bg-pattern relative w-full overflow-x-hidden transition-colors ${
        theme === "dark" ? "bg-black text-zinc-100" : "bg-[#f8fafc] text-zinc-900"
      }`}
    >
      {/* Ambient background glow */}
      <div
        className={`fixed inset-0 pointer-events-none z-0 ${
          theme === "dark" ? "bg-radial-ambient" : "bg-radial-ambient opacity-50"
        }`}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        canGoBack={activeTab === "gym" ? gymSection !== "overview" || tabHistory.length > 1 : activeTab !== "home"}
        onGoBack={handleGoBack}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenChat={() => setIsFloatingChatOpen((prev) => !prev)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        profile={profile}
        isChatOpen={isFloatingChatOpen}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area with bottom padding for fixed navigation bar */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-32">
        {activeTab === "home" ? (
          <HomeTab
            profile={profile}
            notes={notes}
            weightLogs={weightLogs}
            mealLogs={mealLogs}
            waterIntake={waterIntake}
            onNavigateTab={handleNavigateTab}
          />
        ) : activeTab === "gym" ? (
          <GymTab
            profile={profile}
            metrics={calculatedMetrics}
            weightLogs={weightLogs}
            mealLogs={mealLogs}
            chatMessages={chatMessages}
            chatSessions={chatSessions}
            activeChatSessionId={activeChatSessionId}
            onSelectChatSession={handleSelectChatSession}
            onNewChat={handleNewChat}
            onDeleteChatSession={handleDeleteChatSession}
            onClearAllChatSessions={handleClearAllChatSessions}
            waterIntake={waterIntake}
            activeGymSection={gymSection}
            onChangeGymSection={setGymSection}
            onAddWater={handleAddWater}
            onAddWeightLog={handleAddWeightLog}
            onDeleteWeightLog={handleDeleteWeightLog}
            onAddMealLog={handleAddMealLog}
            onDeleteMealLog={handleDeleteMealLog}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onOpenProfile={() => setIsProfileModalOpen(true)}
            onOpenMealAnalysis={(dateStr, mode) => {
              setMealAnalysisDate(dateStr || todayStr);
              setMealAnalysisMode(mode || "manual");
              setIsMealAnalysisOpen(true);
            }}
            onUpdateProfile={handleUpdateProfile}
          />
        ) : activeTab === "projects" ? (
          <ProjectsTab />
        ) : activeTab === "notes" ? (
          <NotesTab
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
          />
        ) : activeTab === "profile" ? (
          <ProfileTab
            profile={profile}
            onSave={handleUpdateProfile}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            onEditProfile={() => setIsProfileModalOpen(true)}
          />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold">Módulo em Desenvolvimento</h2>
          </div>
        )}
      </main>


      {/* Floating Gulinha Chat Window */}
      {isFloatingChatOpen && (
        <GulinhaChat
          isOpen={isFloatingChatOpen}
          onClose={() => setIsFloatingChatOpen(false)}
          messages={chatMessages}
          sessions={chatSessions}
          activeSessionId={activeChatSessionId}
          onSelectSession={handleSelectChatSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteChatSession}
          onClearAllSessions={handleClearAllChatSessions}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          profile={profile}
          metrics={calculatedMetrics}
          todayMeals={mealLogs.filter((m) => m.date === todayStr)}
          isFloating={true}
        />
      )}

      {/* Meal Analysis Modal (Manual / Photo / Text) */}
      <MealAnalysisModal
        isOpen={isMealAnalysisOpen}
        onClose={() => setIsMealAnalysisOpen(false)}
        onSaveMeal={handleAddMealLog}
        profile={profile}
        initialDate={mealAnalysisDate}
        initialMode={mealAnalysisMode}
      />

      {/* Vercel & Icon Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        profile={profile}
        weightLogs={weightLogs}
        mealLogs={mealLogs}
      />

      {/* Supabase Cloud Connection & Sync Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        profile={profile}
        weightLogs={weightLogs}
        mealLogs={mealLogs}
        chatMessages={chatMessages}
        waterIntake={waterIntake}
        onDataPulled={(data) => {
          if (data.profile) setProfile(data.profile);
          if (data.weightLogs) setWeightLogs(data.weightLogs);
          if (data.mealLogs) setMealLogs(data.mealLogs);
          if (data.chatMessages) {
            setChatSessions((prev) => {
              const updated = prev.map((s, idx) => (idx === 0 ? { ...s, messages: data.chatMessages! } : s));
              StorageService.saveChatSessions(updated);
              return updated;
            });
            StorageService.saveChatMessages(data.chatMessages);
          }
          if (data.waterIntake !== undefined) setWaterIntake(data.waterIntake);
        }}
      />

      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleUpdateProfile}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Fixed Bottom Task Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        notesCount={notes.length}
      />
    </div>
  );
}

