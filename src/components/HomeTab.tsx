import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Quote,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  CalendarDays,
  Flame,
  Clock,
} from "lucide-react";
import { UserProfile, NoteItem } from "../types";
import { getDailyInsights } from "../data/dailyInsights";

interface HomeTabProps {
  profile: UserProfile;
  notes: NoteItem[];
  onNavigateTab?: (tab: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  profile,
  notes,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(() => {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon...
    return day === 0 ? 6 : day - 1; // Map to 0 = Mon, 6 = Sun
  });

  // Calculate greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  // Format today's date in Portuguese
  const formattedDate = useMemo(() => {
    const now = new Date();
    const days = [
      "Domingo",
      "Segunda-Feira",
      "Terça-Feira",
      "Quarta-Feira",
      "Quinta-Feira",
      "Sexta-Feira",
      "Sábado",
    ];
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    return `${dayName}, ${dayNum} De ${monthName}`;
  }, []);

  // Retrieve today's unique daily insights (never repeating per day of the year)
  const dailyInsight = useMemo(() => {
    return getDailyInsights(new Date());
  }, []);

  // Productivity weekly tracking simulation based on notes and current day
  const currentWeekDays = useMemo(() => {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    // Deterministic base scores for the week
    const baseScores = [85, 92, 78, 95, 88, 72, 80];

    return days.map((day, idx) => {
      const isToday = idx === todayIndex;
      const isPast = idx <= todayIndex;
      const score = isPast ? baseScores[idx] : 0;
      return {
        label: day,
        score,
        isToday,
        isPast,
        tasksDone: isPast ? Math.round((score / 100) * 8) : 0,
        focusHours: isPast ? ((score / 100) * 6).toFixed(1) : "0.0",
      };
    });
  }, []);

  const selectedDayData = currentWeekDays[selectedDayIdx];

  const averageProductivity = useMemo(() => {
    const activeDays = currentWeekDays.filter((d) => d.isPast);
    if (activeDays.length === 0) return 85;
    const sum = activeDays.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / activeDays.length);
  }, [currentWeekDays]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Top Header with Greeting and Date (Clean, without "Manutenção") */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          {greeting},{" "}
          <span className="text-[#007AFF]">
            {profile.name || "Pimentel"}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
          {formattedDate}
        </p>
      </div>

      {/* Gráfico Simples de Produtividade */}
      <div className="rounded-[22px] bg-zinc-950 border border-zinc-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/30 flex items-center justify-center text-[#007AFF]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white font-['Outfit']">
                Produtividade Semanal
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Índice de consistência e foco diário
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-zinc-400 font-mono">Média:</span>
            <div className="px-3 py-1 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-xs font-mono font-bold">
              {averageProductivity}% Produtivo
            </div>
          </div>
        </div>

        {/* Minimalist Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2 border-b border-zinc-900 min-h-[140px]">
          {currentWeekDays.map((day, idx) => {
            const isSelected = idx === selectedDayIdx;
            const heightPercent = day.isPast ? Math.max(day.score, 18) : 10;

            return (
              <button
                key={day.label}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className="group flex flex-col items-center gap-2 h-full justify-end focus:outline-none transition-transform active:scale-95"
              >
                {/* Score popup on hover / selected */}
                <span
                  className={`text-[10px] font-mono font-bold transition-opacity ${
                    day.isPast
                      ? isSelected
                        ? "text-[#007AFF] opacity-100"
                        : "text-zinc-500 group-hover:text-zinc-300"
                      : "opacity-0"
                  }`}
                >
                  {day.isPast ? `${day.score}%` : "-"}
                </span>

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-zinc-900 rounded-xl p-1 flex items-end h-[90px]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all duration-500 ${
                      day.isToday
                        ? "bg-[#007AFF] shadow-lg shadow-[#007AFF]/40"
                        : day.isPast
                        ? isSelected
                          ? "bg-zinc-200"
                          : "bg-zinc-700 group-hover:bg-zinc-500"
                        : "bg-zinc-800/40"
                    }`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[11px] font-mono font-bold uppercase transition-colors ${
                    day.isToday
                      ? "text-[#007AFF]"
                      : isSelected
                      ? "text-white"
                      : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                >
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Quick Stats Bar */}
        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <CalendarDays className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>
              {selectedDayData.label}{" "}
              {selectedDayData.isToday ? "(Hoje)" : ""}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <strong className="text-white font-mono">
                {selectedDayData.tasksDone}
              </strong>{" "}
              tarefas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
              <strong className="text-white font-mono">
                {selectedDayData.focusHours}h
              </strong>{" "}
              foco
            </span>
          </div>
        </div>
      </div>

      {/* Motivação do Dia */}
      <div className="rounded-[22px] bg-zinc-950 border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
              Motivação do Dia
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            {dailyInsight.motivation.focusWord}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-amber-200 font-['Outfit'] mb-2">
          {dailyInsight.motivation.title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {dailyInsight.motivation.message}
        </p>
      </div>

      {/* Frase de Filósofo */}
      <div className="rounded-[22px] bg-zinc-950 border border-purple-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Quote className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
              Frase de Filósofo
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-mono font-bold">
            {dailyInsight.quote.eraOrSchool}
          </span>
        </div>

        <blockquote className="text-sm sm:text-base font-medium text-white italic leading-relaxed border-l-2 border-purple-500 pl-4 py-1">
          "{dailyInsight.quote.text}"
        </blockquote>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-bold text-purple-300 font-['Outfit']">
            — {dailyInsight.quote.author}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-900 text-xs text-zinc-400 leading-relaxed font-mono">
          <strong className="text-purple-400 font-semibold">Reflexão Prática: </strong>
          {dailyInsight.quote.reflection}
        </div>
      </div>

      {/* Dicas de Produtividade */}
      <div className="rounded-[22px] bg-zinc-950 border border-emerald-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
              Dica de Produtividade
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            {dailyInsight.productivityTip.category}
          </span>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-emerald-200 font-['Outfit'] mb-1.5">
          {dailyInsight.productivityTip.technique}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">
          {dailyInsight.productivityTip.description}
        </p>

        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-xs text-emerald-300 font-mono">
          <strong className="text-emerald-400">Ação de Hoje: </strong>
          {dailyInsight.productivityTip.actionStep}
        </div>
      </div>
    </div>
  );
};
