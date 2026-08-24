import React, { useState, useEffect, useMemo } from "react";
import { UserProfile, WeightLog, MealLog, ChatMessage, NoteItem } from "./types";
import { StorageService, DEFAULT_PROFILE } from "./utils/storage";
import { calculateMetrics } from "./utils/calculations";
import { Navbar } from "./components/Navbar";
import { HomeTab } from "./components/HomeTab";
import { GymTab } from "./components/GymTab";
import { NotesTab } from "./components/NotesTab";
import { ProfileTab } from "./components/ProfileTab";
import { BottomNav } from "./components/BottomNav";
import { MealAnalysisModal } from "./components/MealAnalysisModal";
import { ExportModal } from "./components/ExportModal";
import { SupabaseModal } from "./components/SupabaseModal";
import { GulinhaChat } from "./components/GulinhaChat";
import { SupabaseService } from "./lib/supabase";

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => StorageService.getWeightLogs());
  const [mealLogs, setMealLogs] = useState<MealLog[]>(() => StorageService.getMealLogs());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => StorageService.getChatMessages());
  const [notes, setNotes] = useState<NoteItem[]>(() => StorageService.getNotes());
  
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [waterIntake, setWaterIntake] = useState<number>(() => StorageService.getWaterIntake(todayStr));

  // Navigation and Modals
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isMealAnalysisOpen, setIsMealAnalysisOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState<boolean>(false);

  // Initial cloud sync from Supabase
  useEffect(() => {
    async function loadCloudData() {
      try {
        const remote = await SupabaseService.fetchAllData();
        if (remote.profile) {
          setProfile(remote.profile);
        }
        if (remote.weightLogs && remote.weightLogs.length > 0) {
          setWeightLogs(remote.weightLogs);
        }
        if (remote.mealLogs && remote.mealLogs.length > 0) {
          setMealLogs(remote.mealLogs);
        }
        if (remote.chatMessages && remote.chatMessages.length > 0) {
          setChatMessages(remote.chatMessages);
        }
        if (remote.waterIntake && remote.waterIntake[todayStr] !== undefined) {
          setWaterIntake(remote.waterIntake[todayStr]);
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
    setProfile(updated);
    SupabaseService.syncProfile(updated).catch(console.warn);
  };

  // Add new weight log
  const handleAddWeightLog = (newLog: Omit<WeightLog, "id">) => {
    const createdLog: WeightLog = {
      ...newLog,
      id: `w-${Date.now()}`,
    };
    const updatedLogs = [createdLog, ...weightLogs];
    setWeightLogs(updatedLogs);

    // Update profile current weight
    const updatedProfile: UserProfile = {
      ...profile,
      currentWeight: newLog.weight,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updatedProfile);

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
    setChatMessages((prev) => [...prev, autoBotMsg]);
    SupabaseService.syncChatMessage(autoBotMsg).catch(console.warn);
  };

  const handleDeleteWeightLog = (id: string) => {
    setWeightLogs((prev) => prev.filter((l) => l.id !== id));
    SupabaseService.deleteWeightLog(id).catch(console.warn);
  };

  // Add new meal log
  const handleAddMealLog = (newMeal: Omit<MealLog, "id">) => {
    const createdMeal: MealLog = {
      ...newMeal,
      id: `m-${Date.now()}`,
    };
    setMealLogs((prev) => [createdMeal, ...prev]);
    SupabaseService.syncMealLog(createdMeal).catch(console.warn);

    // Send notification in chat
    const mealBotMsg: ChatMessage = {
      id: `bot-meal-${Date.now()}`,
      role: "model",
      content: `🥗 **Refeição adicionada com sucesso:** *${newMeal.title}* (${newMeal.totalCalories} kcal | ${newMeal.totalProtein}g Proteína).\n\n${newMeal.gulinhaFeedback || "Excelente escolha para seus objetivos físicos!"}`,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, mealBotMsg]);
    SupabaseService.syncChatMessage(mealBotMsg).catch(console.warn);
  };

  const handleDeleteMealLog = (id: string) => {
    setMealLogs((prev) => prev.filter((m) => m.id !== id));
    SupabaseService.deleteMealLog(id).catch(console.warn);
  };

  // Add Water
  const handleAddWater = (amount: number) => {
    setWaterIntake((prev) => {
      const next = prev + amount;
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
    setNotes((prev) => [created, ...prev]);
  };

  const handleUpdateNote = (updated: NoteItem) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Gulinha Chat Message Dispatcher
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    SupabaseService.syncChatMessage(userMsg).catch(console.warn);

    // Prepare context for backend Gulinha AI
    const todayMeals = mealLogs.filter((m) => m.date === todayStr);
    const todayCalories = todayMeals.reduce((a, b) => a + b.totalCalories, 0);
    const todayProtein = todayMeals.reduce((a, b) => a + b.totalProtein, 0);

    const userContext = {
      name: profile.name,
      height: profile.height,
      weight: profile.currentWeight,
      startWeight: profile.startWeight,
      targetWeight: profile.targetWeight,
      goal: profile.goal,
      gender: profile.gender,
      age: profile.age,
      tmb: calculatedMetrics.tmb,
      get: calculatedMetrics.get,
      imc: calculatedMetrics.imc,
      imcCategory: calculatedMetrics.imcCategory,
      measurements: profile.measurements,
      todayCalories,
      targetCalories: calculatedMetrics.targetCalories,
      todayProtein,
      targetProtein: calculatedMetrics.targetProtein,
      todayMealsSummary: todayMeals.map((m) => `${m.title} (${m.totalCalories}kcal, ${m.totalProtein}g prot)`).join("; "),
      recentWeights: weightLogs.slice(0, 4).map((w) => `${w.weight}kg`).join(" -> "),
    };

    try {
      const res = await fetch("/api/gulinha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao conectar com Gulinha.");
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        content: data.reply || "Excelente pergunta! Como posso te ajudar mais?",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
      SupabaseService.syncChatMessage(botMsg).catch(console.warn);
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "model",
        content: "Ops! Tive uma oscilação na conexão com o servidor. Mas mantenha o foco: sua TMB atual é " + calculatedMetrics.tmb + " kcal e meta de " + calculatedMetrics.targetCalories + " kcal!",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: `c-init-${Date.now()}`,
        role: "model",
        content: "Conversa reiniciada! Sou o **Gulinha**, sua inteligência artificial no Base 0. O que vamos planejar hoje?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleLogout = () => {
    setActiveTab("home");
  };

  const handleDeleteAccount = () => {
    StorageService.clearAll();
    setProfile(DEFAULT_PROFILE);
    setWeightLogs([]);
    setMealLogs([]);
    setNotes([]);
    setWaterIntake(0);
    setChatMessages([
      {
        id: `c-init-${Date.now()}`,
        role: "model",
        content: "Conta reiniciada com sucesso! Sou o **Gulinha**, pronto para começar um novo ciclo com você.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setActiveTab("home");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col grid-bg-pattern relative selection:bg-blue-600 selection:text-white w-full overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 bg-radial-ambient pointer-events-none z-0" />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setActiveTab("profile")}
        onOpenChat={() => setIsFloatingChatOpen((prev) => !prev)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        profile={profile}
        isChatOpen={isFloatingChatOpen}
      />

      {/* Main Content Area with bottom padding for fixed navigation bar */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 sm:pb-32">
        {activeTab === "home" ? (
          <HomeTab
            profile={profile}
            notes={notes}
            onNavigateTab={setActiveTab}
          />
        ) : activeTab === "gym" ? (
          <GymTab
            profile={profile}
            metrics={calculatedMetrics}
            weightLogs={weightLogs}
            mealLogs={mealLogs}
            chatMessages={chatMessages}
            waterIntake={waterIntake}
            onAddWater={handleAddWater}
            onAddWeightLog={handleAddWeightLog}
            onDeleteWeightLog={handleDeleteWeightLog}
            onAddMealLog={handleAddMealLog}
            onDeleteMealLog={handleDeleteMealLog}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            onOpenProfile={() => setActiveTab("profile")}
            onOpenMealAnalysis={() => setIsMealAnalysisOpen(true)}
            onUpdateProfile={handleUpdateProfile}
          />
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
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          profile={profile}
          metrics={calculatedMetrics}
          todayMeals={mealLogs.filter((m) => m.date === todayStr)}
          isFloating={true}
        />
      )}

      {/* Meal Analysis Modal (Photo / Text) */}
      <MealAnalysisModal
        isOpen={isMealAnalysisOpen}
        onClose={() => setIsMealAnalysisOpen(false)}
        onSaveMeal={handleAddMealLog}
        profile={profile}
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
          if (data.chatMessages) setChatMessages(data.chatMessages);
          if (data.waterIntake !== undefined) setWaterIntake(data.waterIntake);
        }}
      />

      {/* Fixed Bottom Task Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notesCount={notes.length}
      />
    </div>
  );
}

