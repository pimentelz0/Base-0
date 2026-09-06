import React, { useState } from "react";
import {
  Activity,
  Dumbbell,
  Scale,
  Utensils,
  Bot,
  Ruler,
  UserCheck,
} from "lucide-react";
import {
  UserProfile,
  CalculatedMetrics,
  WeightLog,
  MealLog,
  ChatMessage,
} from "../types";
import { StorageService } from "../utils/storage";
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
  onOpenMealAnalysis: (dateStr?: string, mode?: "manual" | "photo" | "text") => void;
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
  }> = [
    { id: "overview", label: "Visão Geral", icon: Activity },
    { id: "treino", label: "Treino", icon: Dumbbell },
    { id: "profile", label: "Perfil & Metas", icon: UserCheck },
    { id: "weight", label: "Pesagem", icon: Scale },
    { id: "meals", label: "Refeições", icon: Utensils },
    { id: "measurements", label: "Medidas", icon: Ruler },
    { id: "gulinha", label: "Gulinha IA", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      {/* Subnav Centered */}
      <div className="flex items-center justify-center w-full border-b border-zinc-900/80 pb-3">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none flex items-center justify-center">
          <nav className="inline-flex items-center mx-auto gap-1 p-1 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-md shadow-sm">
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
          onOpenAnalysisModal={(mode) => onOpenMealAnalysis(selectedDate, mode)}
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

