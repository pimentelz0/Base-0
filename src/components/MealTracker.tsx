import React, { useState } from "react";
import { Utensils, Plus, Camera, Sparkles, Clock, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { MealLog, MealCategory, CalculatedMetrics, UserProfile } from "../types";
import { DateSelector } from "./DateSelector";

interface MealTrackerProps {
  meals: MealLog[];
  metrics: CalculatedMetrics;
  profile: UserProfile;
  selectedDate: string;
  onChangeDate: (dateStr: string) => void;
  onOpenAnalysisModal: () => void;
  onDeleteMeal: (id: string) => void;
}

const CATEGORY_NAMES: Record<MealCategory, string> = {
  breakfast: "Café da Manhã",
  lunch: "Almoço",
  snack: "Lanches",
  dinner: "Jantar",
  pre_workout: "Pré-Treino",
  post_workout: "Pós-Treino",
};

export const MealTracker: React.FC<MealTrackerProps> = ({
  meals,
  metrics,
  profile,
  selectedDate,
  onChangeDate,
  onOpenAnalysisModal,
  onDeleteMeal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // Group meals for the selected date
  const todayStr = new Date().toISOString().split("T")[0];
  const isCurrentDay = selectedDate === todayStr;
  const selectedDateMeals = meals.filter((m) => m.date === selectedDate);

  const filteredMeals = selectedCategory === "all"
    ? selectedDateMeals
    : selectedDateMeals.filter((m) => m.category === selectedCategory);

  const totalCalories = selectedDateMeals.reduce((a, b) => a + b.totalCalories, 0);
  const totalProtein = selectedDateMeals.reduce((a, b) => a + b.totalProtein, 0);
  const totalCarbs = selectedDateMeals.reduce((a, b) => a + b.totalCarbs, 0);
  const totalFat = selectedDateMeals.reduce((a, b) => a + b.totalFat, 0);

  // Formatted date string for display
  const [year, month, day] = selectedDate.split("-");
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <DateSelector
        selectedDate={selectedDate}
        onChangeDate={onChangeDate}
      />

      {/* Header with Quick Action & Day Macro Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white font-['Outfit',sans-serif]">
              Refeições
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
              {selectedDateMeals.length} {selectedDateMeals.length === 1 ? "refeição" : "refeições"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-400 font-mono">
            <span>Total da data: <strong className="text-white">{totalCalories} kcal</strong></span>
            <span>•</span>
            <span className="text-[#007AFF]">P: {totalProtein}g</span>
            <span>•</span>
            <span className="text-amber-400">C: {totalCarbs}g</span>
            <span>•</span>
            <span className="text-emerald-400">G: {totalFat}g</span>
          </div>
        </div>

        <button
          id="open-meal-scanner-btn"
          onClick={onOpenAnalysisModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-bold transition-all self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Registrar Refeição</span>
        </button>
      </div>

      {/* Quick Meal Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            selectedCategory === "all"
              ? "bg-[#007AFF] text-black shadow-sm"
              : "bg-zinc-950 text-zinc-400 border border-zinc-800/80 hover:text-white"
          }`}
        >
          Todas ({selectedDateMeals.length})
        </button>
        {Object.entries(CATEGORY_NAMES).map(([key, label]) => {
          const count = selectedDateMeals.filter((m) => m.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === key
                  ? "bg-[#007AFF] text-black shadow-sm"
                  : "bg-zinc-950 text-zinc-400 border border-zinc-800/80 hover:text-white"
              }`}
            >
              <span>{label}</span>
              {count > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center font-bold ${
                  selectedCategory === key ? "bg-black/25 text-black" : "bg-zinc-800 text-[#007AFF]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Meal List Cards - Flat Single Layer */}
      {filteredMeals.length > 0 ? (
        <div className="space-y-3">
          {filteredMeals.map((meal) => {
            const isExpanded = expandedMealId === meal.id;
            return (
              <div
                key={meal.id}
                className="rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all overflow-hidden"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {meal.photoUrl ? (
                      <img
                        src={meal.photoUrl}
                        alt={meal.title}
                        className="w-14 h-14 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#007AFF] shrink-0">
                        <Utensils className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] font-mono font-bold">
                          {CATEGORY_NAMES[meal.category] || "Refeição"}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {meal.time}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white mt-1 font-['Outfit',sans-serif]">
                        {meal.title}
                      </h3>

                      <div className="text-xs text-zinc-500 mt-0.5">
                        {meal.items.length} {meal.items.length === 1 ? "alimento" : "alimentos"}
                      </div>
                    </div>
                  </div>

                  {/* Macros and Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-900">
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-lg font-black text-white font-mono">
                          {meal.totalCalories} <span className="text-xs text-zinc-500 font-bold">kcal</span>
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#007AFF] font-mono font-bold">P: {meal.totalProtein}g</span>
                          <span>•</span>
                          <span className="text-amber-400 font-mono font-bold">C: {meal.totalCarbs}g</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono font-bold">G: {meal.totalFat}g</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
                        title="Ver detalhes"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => onDeleteMeal(meal.id)}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-900/50 text-zinc-500 hover:text-red-400"
                        title="Excluir refeição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-zinc-900 bg-zinc-950 space-y-4">
                    {meal.gulinhaFeedback && (
                      <div className="p-4 rounded-xl bg-zinc-900/60 border border-[#007AFF]/30 text-xs text-zinc-300 flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-[#007AFF] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#007AFF] block mb-1 font-mono uppercase tracking-wider text-[11px]">Comentário do Gulinha:</strong>
                          {meal.gulinhaFeedback}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-zinc-400">
                        Itens Desta Refeição
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {meal.items.map((item, i) => (
                          <div
                            key={item.id || i}
                            className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">{item.name}</div>
                              <div className="text-xs text-zinc-500">{item.portion}</div>
                            </div>
                            <div className="text-right font-mono text-xs">
                              <div className="text-[#007AFF] font-bold">{item.calories} kcal</div>
                              <div className="text-[10px] text-zinc-500">
                                P:{item.protein}g | C:{item.carbs}g | G:{item.fat}g
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-10 rounded-2xl bg-zinc-900/30 border border-dashed border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#007AFF]/10 border border-[#007AFF]/20 text-[#007AFF] flex items-center justify-center mx-auto">
            <Utensils className="w-7 h-7" />
          </div>
          <div className="text-base font-black text-white">
            Nenhuma refeição registrada {isCurrentDay ? "hoje" : `em ${formattedDate}`}
          </div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Tire uma foto do seu prato ou digite os alimentos consumidos para calcular calorias e macronutrientes desta data.
          </p>
          <button
            onClick={onOpenAnalysisModal}
            className="px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-md shadow-[#007AFF]/25 cursor-pointer"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Refeição {isCurrentDay ? "" : `(${formattedDate})`}</span>
          </button>
        </div>
      )}
    </div>
  );
};
