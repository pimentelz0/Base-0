import React, { useState } from "react";
import {
  LayoutDashboard,
  Scale,
  Utensils,
  Bot,
  Ruler,
  Camera,
  UserCheck,
} from "lucide-react";
import {
  UserProfile,
  CalculatedMetrics,
  WeightLog,
  MealLog,
  ChatMessage,
} from "../types";
import { MetricsOverview } from "./MetricsOverview";
import { WeightTracker } from "./WeightTracker";
import { MealTracker } from "./MealTracker";
import { MeasurementsTracker } from "./MeasurementsTracker";
import { GymProfileSettings } from "./GymProfileSettings";
import { GulinhaChat } from "./GulinhaChat";

interface GymTabProps {
  profile: UserProfile;
  metrics: CalculatedMetrics;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
  chatMessages: ChatMessage[];
  waterIntake: number;
  onAddWater: (amount: number) => void;
  onAddWeightLog: (log: Omit<WeightLog, "id">) => void;
  onDeleteWeightLog: (id: string) => void;
  onAddMealLog: (meal: Omit<MealLog, "id">) => void;
  onDeleteMealLog: (id: string) => void;
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  onOpenProfile: () => void;
  onOpenMealAnalysis: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const GymTab: React.FC<GymTabProps> = ({
  profile,
  metrics,
  weightLogs,
  mealLogs,
  chatMessages,
  waterIntake,
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
  const [activeGymSection, setActiveGymSection] = useState<
    "overview" | "profile" | "weight" | "meals" | "measurements" | "gulinha"
  >("overview");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayMeals = mealLogs.filter((m) => m.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Gym Sub-Navigation Bar - Flat & Minimalist */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            id="gym-nav-overview-btn"
            onClick={() => setActiveGymSection("overview")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "overview"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            id="gym-nav-profile-btn"
            onClick={() => setActiveGymSection("profile")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "profile"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Perfil & Metas</span>
          </button>

          <button
            id="gym-nav-weight-btn"
            onClick={() => setActiveGymSection("weight")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "weight"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Peso</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                activeGymSection === "weight"
                  ? "bg-black/20 text-black"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {weightLogs.length}
            </span>
          </button>

          <button
            id="gym-nav-meals-btn"
            onClick={() => setActiveGymSection("meals")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "meals"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Refeições</span>
            {todayMeals.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                  activeGymSection === "meals"
                    ? "bg-black/20 text-black"
                    : "bg-[#007AFF]/20 text-[#007AFF]"
                }`}
              >
                {todayMeals.length}
              </span>
            )}
          </button>

          <button
            id="gym-nav-measurements-btn"
            onClick={() => setActiveGymSection("measurements")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "measurements"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Medidas</span>
          </button>

          <button
            id="gym-nav-gulinha-btn"
            onClick={() => setActiveGymSection("gulinha")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeGymSection === "gulinha"
                ? "bg-[#007AFF] text-black shadow-sm"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Gulinha IA</span>
          </button>
        </div>

        {/* Quick Meal Action Button */}
        <button
          onClick={onOpenMealAnalysis}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all border border-zinc-800"
        >
          <Camera className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Foto / IA</span>
        </button>
      </div>

      {/* Main Section Content */}
      {activeGymSection === "overview" && (
        <MetricsOverview
          profile={profile}
          metrics={metrics}
          todayMeals={todayMeals}
          weightLogs={weightLogs}
          waterIntake={waterIntake}
          onAddWater={onAddWater}
          onOpenProfile={() => setActiveGymSection("profile")}
        />
      )}

      {activeGymSection === "profile" && (
        <GymProfileSettings
          profile={profile}
          metrics={metrics}
          onUpdateProfile={onUpdateProfile}
        />
      )}

      {activeGymSection === "weight" && (
        <WeightTracker
          logs={weightLogs}
          profile={profile}
          onAddLog={onAddWeightLog}
          onDeleteLog={onDeleteWeightLog}
        />
      )}

      {activeGymSection === "meals" && (
        <MealTracker
          meals={mealLogs}
          metrics={metrics}
          profile={profile}
          onOpenAnalysisModal={onOpenMealAnalysis}
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
            todayMeals={todayMeals}
            isFloating={false}
          />
        </div>
      )}
    </div>
  );
};
