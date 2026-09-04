import React from "react";
import { Flame, Scale, Activity, Droplets, Target, Award, ArrowUpRight, ArrowDownRight, Dumbbell, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { UserProfile, CalculatedMetrics, MealLog, WeightLog } from "../types";
import { GOAL_LABELS } from "../utils/calculations";
import { DateSelector } from "./DateSelector";

interface MetricsOverviewProps {
  profile: UserProfile;
  metrics: CalculatedMetrics;
  todayMeals: MealLog[];
  weightLogs: WeightLog[];
  waterIntake: number;
  selectedDate: string;
  onChangeDate: (dateStr: string) => void;
  onAddWater: (amount: number) => void;
  onOpenProfile: () => void;
  onOpenWeight?: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  profile,
  metrics,
  todayMeals,
  weightLogs,
  waterIntake,
  selectedDate,
  onChangeDate,
  onAddWater,
  onOpenProfile,
  onOpenWeight,
}) => {
  // Aggregate nutrition for selected date
  const todayCalories = todayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
  const todayProtein = todayMeals.reduce((acc, m) => acc + m.totalProtein, 0);
  const todayCarbs = todayMeals.reduce((acc, m) => acc + m.totalCarbs, 0);
  const todayFat = todayMeals.reduce((acc, m) => acc + m.totalFat, 0);

  const calPercentage = Math.min(100, Math.round((todayCalories / metrics.targetCalories) * 100));
  const proteinPercentage = Math.min(100, Math.round((todayProtein / metrics.targetProtein) * 100));
  const carbsPercentage = Math.min(100, Math.round((todayCarbs / metrics.targetCarbs) * 100));
  const fatPercentage = Math.min(100, Math.round((todayFat / metrics.targetFat) * 100));
  const waterPercentage = Math.min(100, Math.round((waterIntake / metrics.targetWater) * 100));

  // Determine true start weight from profile.startWeight or earliest weight log
  const effectiveStartWeight =
    profile.startWeight !== undefined && profile.startWeight !== null && profile.startWeight > 0
      ? profile.startWeight
      : weightLogs && weightLogs.length > 0
      ? [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].weight
      : profile.currentWeight;

  // Weight progress calculations relative to initial registered weight
  const totalWeightChange = Math.round((profile.currentWeight - effectiveStartWeight) * 10) / 10;
  const isLoss = totalWeightChange < 0;

  // Target progression calculation
  const targetWeight = profile.targetWeight;
  const targetDelta = targetWeight ? Math.abs(Math.round((profile.currentWeight - targetWeight) * 10) / 10) : 0;
  const totalTargetDistance = targetWeight ? Math.abs(effectiveStartWeight - targetWeight) : 0;
  const currentCoveredDistance = targetWeight ? Math.abs(effectiveStartWeight - profile.currentWeight) : 0;
  const progressPercentage =
    totalTargetDistance > 0
      ? Math.min(100, Math.max(0, Math.round((currentCoveredDistance / totalTargetDistance) * 100)))
      : 0;

  const isCurrentDay = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Date Selector for day, month, and year */}
      <DateSelector
        selectedDate={selectedDate}
        onChangeDate={onChangeDate}
      />

      {/* Top Header - Pure Minimalist 'Peso Atual' Signature with Quick Action */}
      <div className="flex flex-col gap-2 py-2 border-b border-zinc-900 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-[#007AFF] font-bold font-mono">
            Peso Atual
          </p>
          <div className="flex items-center gap-3">
            {onOpenWeight && (
              <button
                type="button"
                onClick={onOpenWeight}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#007AFF] hover:bg-[#006fe6] text-black font-black text-xs transition-all shadow-sm active:scale-95"
              >
                <Scale className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Nova Pesagem</span>
              </button>
            )}
            <button
              onClick={onOpenProfile}
              className="text-xs text-zinc-500 hover:text-[#007AFF] font-semibold transition-colors"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-4 sm:gap-6 mt-1">
          <h2 className="text-7xl sm:text-8xl md:text-9xl font-black leading-none tracking-tighter text-white font-['Outfit',sans-serif]">
            {profile.currentWeight}
            <span className="text-2xl sm:text-3xl text-zinc-600 font-bold ml-1">kg</span>
          </h2>

          <div className="flex flex-col justify-center">
            <span className={`text-sm sm:text-base font-black font-mono flex items-center gap-1 ${
              isLoss ? "text-emerald-400" : totalWeightChange > 0 ? "text-[#007AFF]" : "text-zinc-400"
            }`}>
              {isLoss ? <TrendingDown className="w-4 h-4" /> : totalWeightChange > 0 ? <TrendingUp className="w-4 h-4" /> : null}
              {totalWeightChange > 0 ? `+${totalWeightChange}` : totalWeightChange} kg
            </span>
            <span className="text-zinc-500 text-xs font-semibold">
              desde o início
            </span>
          </div>

          {profile.targetWeight && (
            <div className="ml-auto hidden sm:flex flex-col items-end justify-center">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Meta
              </span>
              <span className="text-2xl font-black text-zinc-300 font-mono">
                {profile.targetWeight} <span className="text-xs text-zinc-600">kg</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comparativo de Evolução (Peso Inicial -> Peso Atual -> Meta) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#007AFF]" />
            <h3 className="text-sm font-black text-white font-['Outfit'] uppercase tracking-wider">
              Comparativo de Evolução (Pesagem)
            </h3>
          </div>
          {onOpenWeight && (
            <button
              onClick={onOpenWeight}
              className="text-xs text-[#007AFF] hover:underline font-mono font-bold flex items-center gap-1"
            >
              <span>Histórico de Pesagens</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold block mb-1">
              Peso Inicial
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {effectiveStartWeight} <span className="text-xs text-zinc-500 font-normal">kg</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">Ponto de partida</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-[#007AFF]/40">
            <span className="text-[10px] text-[#007AFF] uppercase font-mono font-bold block mb-1">
              Peso Atual
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {profile.currentWeight} <span className="text-xs text-zinc-500 font-normal">kg</span>
            </div>
            <div className={`text-[11px] font-mono font-bold ${
              isLoss ? "text-emerald-400" : "text-[#007AFF]"
            }`}>
              {totalWeightChange > 0 ? `+${totalWeightChange}` : totalWeightChange} kg desde início
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold block mb-1">
              Meta de Peso
            </span>
            <div className="text-2xl font-black text-[#007AFF] font-mono">
              {targetWeight ? `${targetWeight}` : "—"} <span className="text-xs text-zinc-500 font-normal">kg</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {targetWeight ? `Faltam ${targetDelta} kg` : "Defina no perfil"}
            </span>
          </div>
        </div>

        {targetWeight && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Progresso rumo à meta ({targetWeight} kg)</span>
              <span className="text-[#007AFF] font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Core Metrics: Single flat clean cards with no nested boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TMB */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">TMB</p>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono tracking-tight">
            {metrics.tmb.toLocaleString("pt-BR")} <span className="text-sm text-zinc-500 font-bold">kcal</span>
          </p>
        </div>

        {/* IMC */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">IMC</p>
            <Scale className="w-4 h-4 text-[#007AFF]" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white font-mono tracking-tight">
              {metrics.imc}
            </p>
            <span className={`text-xs font-bold ${metrics.imcColor}`}>
              {metrics.imcCategory}
            </span>
          </div>
        </div>

        {/* GET */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Gasto Diário</p>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white font-mono tracking-tight">
            {metrics.get.toLocaleString("pt-BR")} <span className="text-sm text-zinc-500 font-bold">kcal</span>
          </p>
        </div>

        {/* Meta Diária */}
        <div className="bg-zinc-950 p-5 rounded-2xl border border-[#007AFF]/40 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#007AFF] text-xs uppercase font-bold tracking-wider">Meta Diária</p>
            <Target className="w-4 h-4 text-[#007AFF]" />
          </div>
          <div>
            <p className="text-3xl font-black text-[#007AFF] font-mono tracking-tight">
              {metrics.targetCalories.toLocaleString("pt-BR")} <span className="text-sm text-zinc-500 font-bold">kcal</span>
            </p>
            <div className="flex justify-between text-xs mt-2 text-zinc-400 font-mono">
              <span>{isCurrentDay ? "Hoje" : "Consumido"}: {todayCalories} kcal</span>
              <span className="text-[#007AFF] font-bold">{calPercentage}%</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                style={{ width: `${calPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Macros & Hydration Section - Flat single-layer cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Macronutrientes */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit',sans-serif]">
              Macronutrientes
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {todayMeals.length} {todayMeals.length === 1 ? "refeição nesta data" : "refeições nesta data"}
            </span>
          </div>

          <div className="space-y-4">
            {/* Proteínas */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                  Proteínas
                </span>
                <span className="font-mono text-zinc-300">
                  <strong className="text-white text-sm font-black">{todayProtein}g</strong> / {metrics.targetProtein}g
                  <span className="text-zinc-500 ml-1">({proteinPercentage}%)</span>
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercentage}%` }}
                />
              </div>
            </div>

            {/* Carboidratos */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Carboidratos
                </span>
                <span className="font-mono text-zinc-300">
                  <strong className="text-white text-sm font-black">{todayCarbs}g</strong> / {metrics.targetCarbs}g
                  <span className="text-zinc-500 ml-1">({carbsPercentage}%)</span>
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercentage}%` }}
                />
              </div>
            </div>

            {/* Gorduras */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Gorduras
                </span>
                <span className="font-mono text-zinc-300">
                  <strong className="text-white text-sm font-black">{todayFat}g</strong> / {metrics.targetFat}g
                  <span className="text-zinc-500 ml-1">({fatPercentage}%)</span>
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${fatPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Hidratação */}
        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-white font-['Outfit',sans-serif]">
              Hidratação
            </h3>
            <span className="text-xs font-mono font-bold text-sky-400">
              {waterPercentage}%
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl font-black text-white font-mono tracking-tight">
              {waterIntake} <span className="text-base font-bold text-zinc-500">/ {metrics.targetWater} ml</span>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                style={{ width: `${waterPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
            <button
              onClick={() => onAddWater(250)}
              className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors"
            >
              +250ml
            </button>
            <button
              onClick={() => onAddWater(500)}
              className="py-2.5 px-3 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-xs font-bold text-black transition-colors shadow-sm"
            >
              +500ml
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
