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
  Utensils,
  Scale,
  Dumbbell,
  Droplets,
} from "lucide-react";
import {
  UserProfile,
  NoteItem,
  WeightLog,
  MealLog,
  WorkoutSessionLog,
} from "../types";
import { StorageService } from "../utils/storage";
import { getDailyInsights } from "../data/dailyInsights";

interface HomeTabProps {
  profile: UserProfile;
  notes: NoteItem[];
  weightLogs?: WeightLog[];
  mealLogs?: MealLog[];
  workoutLogs?: WorkoutSessionLog[];
  waterIntake?: number;
  onNavigateTab?: (tab: string) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  profile,
  notes,
  weightLogs = [],
  mealLogs = [],
  workoutLogs = [],
  waterIntake = 0,
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

  // Holistic Productivity weekly tracking based on the whole app's usage
  const currentWeekDays = useMemo(() => {
    const daysLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const now = new Date();
    const todayDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 = Mon, 6 = Sun

    // Monday of current week
    const monday = new Date(now);
    monday.setDate(now.getDate() - todayDayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const accessDays = StorageService.getAppAccessDays();
    const todayStr = now.toISOString().split("T")[0];

    return daysLabels.map((dayLabel, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const dayStr = dayDate.toISOString().split("T")[0];

      const isToday = idx === todayDayOfWeek;
      const isPast = idx <= todayDayOfWeek;

      if (!isPast) {
        return {
          label: dayLabel,
          dayStr,
          score: 0,
          isToday: false,
          isPast: false,
          focusHours: "0.0",
          breakdown: {
            appAccess: false,
            tasksDone: 0,
            mealsCount: 0,
            weightLogged: false,
            workoutsCount: 0,
            waterLogged: false,
          },
        };
      }

      // 1. App entry / check-in (20 pts for being active)
      const didAccess = isToday || accessDays.includes(dayStr);
      const accessScore = didAccess ? 20 : 0;

      // 2. Checklist / Tasks completed in notes (up to 25 pts)
      let dayTasksDone = 0;
      notes.forEach((n) => {
        const noteDate = n.updatedAt?.split("T")[0] || n.date?.split("T")[0];
        if (noteDate === dayStr) {
          dayTasksDone += n.checklist?.filter((c) => c.done).length || 0;
        } else if (isToday) {
          dayTasksDone += n.checklist?.filter((c) => c.done).length || 0;
        }
      });
      const notesCreated = notes.filter((n) => (n.date || "").startsWith(dayStr)).length;
      const tasksScore = Math.min(25, dayTasksDone * 10 + (notesCreated > 0 ? 5 : 0));

      // 3. New weight log on that date (20 pts)
      const weightLogged = weightLogs.some((w) => (w.date || "").startsWith(dayStr));
      const weightScore = weightLogged ? 20 : 0;

      // 4. Meal logs on that date (up to 20 pts: 10 per meal)
      const mealsOnDay = mealLogs.filter((m) => m.date === dayStr);
      const mealsScore = Math.min(20, mealsOnDay.length * 10);

      // 5. Workout sessions on that date (up to 20 pts)
      const workoutsOnDay = workoutLogs.filter((w) => w.date === dayStr);
      const workoutScore = Math.min(20, workoutsOnDay.length * 20);

      // 6. Water intake on that date (up to 15 pts)
      const dayWater = isToday ? waterIntake : StorageService.getWaterIntake(dayStr);
      const waterScore = dayWater >= 1000 ? 15 : dayWater > 0 ? 8 : 0;

      // Total composite score (clamped 0 to 100)
      let totalRaw = accessScore + tasksScore + weightScore + mealsScore + workoutScore + waterScore;
      if (didAccess && totalRaw < 25) {
        totalRaw = 25; // Base engagement reward for opening the app
      }
      const score = Math.min(100, totalRaw);

      // Focus / engagement hours estimation
      const workoutMinutes = workoutsOnDay.reduce((acc, w) => acc + (w.durationMinutes || 45), 0);
      const calculatedHours = (score / 100) * 2.5 + (workoutMinutes / 60) + (dayTasksDone * 0.2);
      const focusHours = (didAccess ? Math.max(0.5, calculatedHours) : 0).toFixed(1);

      return {
        label: dayLabel,
        dayStr,
        score,
        isToday,
        isPast,
        focusHours,
        breakdown: {
          appAccess: didAccess,
          tasksDone: dayTasksDone,
          mealsCount: mealsOnDay.length,
          weightLogged,
          workoutsCount: workoutsOnDay.length,
          waterLogged: dayWater > 0,
        },
      };
    });
  }, [notes, weightLogs, mealLogs, workoutLogs, waterIntake]);

  const selectedDayData = currentWeekDays[selectedDayIdx] || currentWeekDays[0];

  const averageProductivity = useMemo(() => {
    const activeDays = currentWeekDays.filter((d) => d.isPast && d.score > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / activeDays.length);
  }, [currentWeekDays]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-24">
      {/* Top Header with Greeting and Date */}
      <div className="border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
          {greeting}
          {profile.name ? (
            <>
              , <span className="text-[#007AFF]">{profile.name}</span>
            </>
          ) : (
            "!"
          )}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
          {formattedDate}
        </p>
      </div>

      {/* Gráfico Simples de Produtividade */}
      <div className="rounded-[22px] bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 p-5 sm:p-6 shadow-xl relative overflow-hidden">
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
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-900 min-h-[140px]">
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
                        : "text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                      : "opacity-0"
                  }`}
                >
                  {day.isPast ? `${day.score}%` : "-"}
                </span>

                {/* Bar */}
                <div className="w-full max-w-[36px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-transparent rounded-xl p-1 flex items-end h-[90px]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all duration-500 ${
                      day.isToday
                        ? "bg-[#007AFF] shadow-lg shadow-[#007AFF]/40"
                        : day.isPast
                        ? isSelected
                          ? "bg-zinc-900 dark:bg-zinc-200"
                          : "bg-zinc-400 dark:bg-zinc-700 group-hover:bg-zinc-500 dark:group-hover:bg-zinc-500"
                        : "bg-zinc-200 dark:bg-zinc-800/40"
                    }`}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[11px] font-mono font-bold uppercase transition-colors ${
                    day.isToday
                      ? "text-[#007AFF]"
                      : isSelected
                      ? "text-zinc-900 dark:text-white"
                      : "text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-300"
                  }`}
                >
                  {day.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Day Quick Stats Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-900/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <CalendarDays className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>
                {selectedDayData.label}{" "}
                {selectedDayData.isToday ? "(Hoje)" : ""}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <strong className="text-white font-mono">
                  {selectedDayData.score}%
                </strong>{" "}
                produtividade
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

          {/* Activity Breakdown Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {selectedDayData.breakdown.tasksDone > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                {selectedDayData.breakdown.tasksDone}{" "}
                {selectedDayData.breakdown.tasksDone === 1 ? "tarefa" : "tarefas"}
              </span>
            )}
            {selectedDayData.breakdown.mealsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
                <Utensils className="w-3 h-3" />
                {selectedDayData.breakdown.mealsCount}{" "}
                {selectedDayData.breakdown.mealsCount === 1 ? "refeição" : "refeições"}
              </span>
            )}
            {selectedDayData.breakdown.weightLogged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold">
                <Scale className="w-3 h-3" />
                Pesagem
              </span>
            )}
            {selectedDayData.breakdown.workoutsCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-semibold">
                <Dumbbell className="w-3 h-3" />
                {selectedDayData.breakdown.workoutsCount}{" "}
                {selectedDayData.breakdown.workoutsCount === 1 ? "treino" : "treinos"}
              </span>
            )}
            {selectedDayData.breakdown.waterLogged && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-semibold">
                <Droplets className="w-3 h-3" />
                Hidratação
              </span>
            )}
            {!selectedDayData.breakdown.appAccess &&
              selectedDayData.breakdown.tasksDone === 0 &&
              selectedDayData.breakdown.mealsCount === 0 &&
              !selectedDayData.breakdown.weightLogged && (
                <span className="text-[11px] text-zinc-500 italic">
                  {selectedDayData.isPast
                    ? "Nenhuma atividade registrada neste dia."
                    : "Dia futuro na semana."}
                </span>
              )}
          </div>
        </div>
      </div>

      {/* Motivação do Dia */}
      <div className="rounded-[22px] bg-zinc-950 border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden group">
        <div className="mb-3">
          <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
            Motivação do Dia
          </h2>
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
        <div className="mb-4">
          <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
            Frase de Filósofo
          </h2>
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
        <div className="mb-3">
          <h2 className="text-sm sm:text-base font-black text-white font-['Outfit']">
            Dica de Produtividade
          </h2>
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
