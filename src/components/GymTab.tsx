import React, { useState } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  Scale,
  Utensils,
  Bot,
  Ruler,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import {
  UserProfile,
  CalculatedMetrics,
  WeightLog,
  MealLog,
  ChatMessage,
} from "../types";
import { MetricsOverview } from "./MetricsOverview";
import { WorkoutTracker } from "./WorkoutTracker";
import { WeightTracker } from "./WeightTracker";
import { MealTracker } from "./MealTracker";
import { MeasurementsTracker } from "./MeasurementsTracker";
import { GymProfileSettings } from "./GymProfileSettings";
import { GulinhaChat } from "./GulinhaChat";

export type GymSectionType =
  | "overview"
  | "treino"
  | "profile"
  | "weight"
  | "meals"
  | "measurements"
  | "gulinha";

interface GymTabProps {
  profile: UserProfile;
  metrics: CalculatedMetrics;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
  chatMessages: ChatMessage[];
  waterIntake: number;
  activeGymSection?: GymSectionType;
  onChangeGymSection?: (sec: GymSectionType) => void;
  onAddWater: (amount: number) => void;
  onAddWeightLog: (log: Omit<WeightLog, "id">) => void;
  onDeleteWeightLog: (id: string) => void;
  onAddMealLog: (meal: Omit<MealLog, "id">) => void;
  onDeleteMealLog: (id: string) => void;
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  onOpenProfile: () => void;
  onOpenMealAnalysis: (dateStr?: string) => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const GymTab: React.FC<GymTabProps> = ({
  profile,
  metrics,
  weightLogs,
  mealLogs,
  chatMessages,
  waterIntake,
  activeGymSection: controlledGymSection,
  onChangeGymSection,
  onAddWater,
  onAddWeightLog,
  onDeleteWeightLog,
  onAddMealLog,
  onDeleteMealLog,
  onSendMessage,
  onClearChat,
  onOpenProfile,
  onOpenMealAnalysis,
  onUpdateProfile,
}) => {
  const [internalSection, setInternalSection] = useState<GymSectionType>("overview");

  const activeGymSection = controlledGymSection ?? internalSection;
  const setActiveGymSection = (sec: GymSectionType) => {
    setInternalSection(sec);
    onChangeGymSection?.(sec);
  };

  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );

  const selectedDateMeals = mealLogs.filter((m) => m.date === selectedDate);

  const navItems: Array<{
    id: GymSectionType;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "treino", label: "Treino", icon: Dumbbell },
    { id: "profile", label: "Perfil & Metas", icon: UserCheck },
    { id: "weight", label: "Pesagem", icon: Scale, count: weightLogs.length > 0 ? weightLogs.length : undefined },
    { id: "meals", label: "Refeições", icon: Utensils, count: selectedDateMeals.length > 0 ? selectedDateMeals.length : undefined },
    { id: "measurements", label: "Medidas", icon: Ruler },
    { id: "gulinha", label: "Gulinha IA", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Subnav & Back Arrow */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-900/80 pb-2">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none flex items-center gap-2">
          {/* Back arrow inside GymTab when not on overview */}
          {activeGymSection !== "overview" && (
            <button
              type="button"
              onClick={() => setActiveGymSection("overview")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
              title="Voltar para Visão Geral"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Visão Geral</span>
            </button>
          )}

          <nav className="inline-flex items-center gap-1 p-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeGymSection === item.id;

              return (
                <button
                  key={item.id}
                  id={`gym-nav-${item.id}-btn`}
                  type="button"
                  onClick={() => setActiveGymSection(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#007AFF] text-black font-black shadow-md shadow-[#007AFF]/25"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 font-semibold"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                        isActive
                          ? "bg-black/20 text-black"
                          : "bg-zinc-800/80 text-zinc-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Section Content */}
      {activeGymSection === "overview" && (
        <MetricsOverview
          profile={profile}
          metrics={metrics}
          todayMeals={selectedDateMeals}
          weightLogs={weightLogs}
          waterIntake={waterIntake}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onAddWater={onAddWater}
          onOpenProfile={() => setActiveGymSection("profile")}
          onOpenWeight={() => setActiveGymSection("weight")}
        />
      )}

      {activeGymSection === "treino" && (
        <WorkoutTracker profile={profile} />
      )}

      {activeGymSection === "profile" && (
        <GymProfileSettings
          profile={profile}
          metrics={metrics}
          onUpdateProfile={onUpdateProfile}
          onNavigateSection={setActiveGymSection}
        />
      )}

      {activeGymSection === "weight" && (
        <WeightTracker
          logs={weightLogs}
          profile={profile}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onAddLog={onAddWeightLog}
          onDeleteLog={onDeleteWeightLog}
        />
      )}

      {activeGymSection === "meals" && (
        <MealTracker
          meals={mealLogs}
          metrics={metrics}
          profile={profile}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onOpenAnalysisModal={() => onOpenMealAnalysis(selectedDate)}
          onDeleteMeal={onDeleteMealLog}
        />
      )}

      {activeGymSection === "measurements" && (
        <MeasurementsTracker
          profile={profile}
          onUpdateProfile={onUpdateProfile}
        />
      )}

      {activeGymSection === "gulinha" && (
        <div className="max-w-3xl mx-auto">
          <GulinhaChat
            isOpen={true}
            onClose={() => {}}
            messages={chatMessages}
            onSendMessage={onSendMessage}
            onClearChat={onClearChat}
            profile={profile}
            metrics={metrics}
            todayMeals={selectedDateMeals}
            isFloating={false}
          />
        </div>
      )}
    </div>
  );
};

