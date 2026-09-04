import React, { useState, useEffect, useRef } from "react";
import {
  Dumbbell,
  Play,
  Square,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Clock,
  Flame,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Layers,
  Edit2,
  Timer,
  Volume2,
  Loader2,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  WorkoutRoutine,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSessionLog,
  UserProfile,
} from "../types";
import { StorageService } from "../utils/storage";

interface WorkoutTrackerProps {
  profile: UserProfile;
}

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ profile }) => {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>(() =>
    StorageService.getWorkoutRoutines()
  );
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>(() =>
    StorageService.getWorkoutLogs()
  );

  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    () => routines[0]?.id || ""
  );

  // Active workout session state
  const [isActiveSession, setIsActiveSession] = useState<boolean>(false);
  const [activeSessionRoutine, setActiveSessionRoutine] =
    useState<WorkoutRoutine | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Rest Timer state
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [initialRestDuration, setInitialRestDuration] = useState<number>(60);

  // Modal for new routine or exercise
  const [isCreatingRoutine, setIsCreatingRoutine] = useState<boolean>(false);
  const [newRoutineName, setNewRoutineName] = useState<string>("");
  const [newRoutineMuscles, setNewRoutineMuscles] = useState<string>("");
  const [isSavingRoutine, setIsSavingRoutine] = useState<boolean>(false);

  const [isAddingExercise, setIsAddingExercise] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>("");
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<string>("Peitoral");

  // Save routines on change
  useEffect(() => {
    StorageService.saveWorkoutRoutines(routines);
  }, [routines]);

  // Active workout stopwatch
  useEffect(() => {
    let interval: any = null;
    if (isActiveSession) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isActiveSession]);

  // Rest timer countdown
  useEffect(() => {
    let interval: any = null;
    if (restTimerSeconds !== null && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (restTimerSeconds === 0) {
      // Finished rest
      setRestTimerSeconds(null);
    }
    return () => clearInterval(interval);
  }, [restTimerSeconds]);

  const activeRoutine =
    routines.find((r) => r.id === selectedRoutineId) || routines[0];

  const currentRoutine = isActiveSession && activeSessionRoutine ? activeSessionRoutine : activeRoutine;

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // Start workout session
  const handleStartWorkout = () => {
    if (!activeRoutine) return;
    // Deep clone to track current session sets
    const clone: WorkoutRoutine = JSON.parse(JSON.stringify(activeRoutine));
    setActiveSessionRoutine(clone);
    setIsActiveSession(true);
    setSessionSeconds(0);
  };

  // Finish workout session
  const handleFinishWorkout = () => {
    if (!activeSessionRoutine) return;

    // Calculate total volume (reps * weight) and completed sets
    let totalVolume = 0;
    let completedSetsCount = 0;

    activeSessionRoutine.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVolume += (s.weight || 0) * (s.reps || 0);
          completedSetsCount += 1;
        }
      });
    });

    const durationMinutes = Math.max(1, Math.round(sessionSeconds / 60));

    const newLog: WorkoutSessionLog = {
      id: `wlog-${Date.now()}`,
      routineId: activeSessionRoutine.id,
      routineName: activeSessionRoutine.name,
      date: new Date().toISOString().split("T")[0],
      durationMinutes,
      totalVolumeKg: totalVolume,
      completedSetsCount,
      notes: `Treino finalizado com ${completedSetsCount} séries concluídas.`,
    };

    const updatedLogs = StorageService.addWorkoutLog(newLog);
    setWorkoutLogs(updatedLogs);

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#007AFF", "#38bdf8", "#ffffff"],
      });
    } catch {
      // ignore
    }

    setIsActiveSession(false);
    setActiveSessionRoutine(null);
    setRestTimerSeconds(null);
  };

  // Cancel workout
  const handleCancelWorkout = () => {
    if (window.confirm("Deseja realmente cancelar o treino em andamento?")) {
      setIsActiveSession(false);
      setActiveSessionRoutine(null);
      setRestTimerSeconds(null);
    }
  };

  // Toggle set completed
  const handleToggleSet = (exerciseId: string, setId: string) => {
    if (isActiveSession && activeSessionRoutine) {
      const updatedExercises = activeSessionRoutine.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s;
            const nextCompleted = !s.completed;
            if (nextCompleted && ex.restSeconds) {
              setInitialRestDuration(ex.restSeconds);
              setRestTimerSeconds(ex.restSeconds);
            }
            return { ...s, completed: nextCompleted };
          }),
        };
      });
      setActiveSessionRoutine({
        ...activeSessionRoutine,
        exercises: updatedExercises,
      });
    } else {
      // Editing routine blueprint
      const updated = routines.map((r) => {
        if (r.id !== activeRoutine.id) return r;
        return {
          ...r,
          exercises: r.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId ? { ...s, completed: !s.completed } : s
              ),
            };
          }),
        };
      });
      setRoutines(updated);
    }
  };

  // Update set values (weight or reps)
  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: number
  ) => {
    const updater = (routine: WorkoutRoutine) => ({
      ...routine,
      exercises: routine.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        };
      }),
    });

    if (isActiveSession && activeSessionRoutine) {
      setActiveSessionRoutine(updater(activeSessionRoutine));
    } else {
      setRoutines(routines.map((r) => (r.id === activeRoutine.id ? updater(r) : r)));
    }
  };

  // Add set to exercise
  const handleAddSet = (exerciseId: string) => {
    const updater = (routine: WorkoutRoutine) => ({
      ...routine,
      exercises: routine.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          setNumber: ex.sets.length + 1,
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : 20,
          completed: false,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      }),
    });

    if (isActiveSession && activeSessionRoutine) {
      setActiveSessionRoutine(updater(activeSessionRoutine));
    } else {
      setRoutines(routines.map((r) => (r.id === activeRoutine.id ? updater(r) : r)));
    }
  };

  // Remove set
  const handleRemoveSet = (exerciseId: string, setId: string) => {
    const updater = (routine: WorkoutRoutine) => ({
      ...routine,
      exercises: routine.exercises.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setId),
        };
      }),
    });

    if (isActiveSession && activeSessionRoutine) {
      setActiveSessionRoutine(updater(activeSessionRoutine));
    } else {
      setRoutines(routines.map((r) => (r.id === activeRoutine.id ? updater(r) : r)));
    }
  };

  // Add new exercise to routine
  const handleSaveNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      muscleGroup: newExerciseMuscle,
      restSeconds: 60,
      sets: [
        { id: `s-${Date.now()}-1`, setNumber: 1, reps: 12, weight: 20, completed: false },
        { id: `s-${Date.now()}-2`, setNumber: 2, reps: 10, weight: 25, completed: false },
        { id: `s-${Date.now()}-3`, setNumber: 3, reps: 8, weight: 30, completed: false },
      ],
    };

    const targetRoutineId = currentRoutine.id;
    const updated = routines.map((r) => {
      if (r.id !== targetRoutineId) return r;
      return {
        ...r,
        exercises: [...r.exercises, newEx],
      };
    });

    setRoutines(updated);
    if (isActiveSession && activeSessionRoutine) {
      setActiveSessionRoutine({
        ...activeSessionRoutine,
        exercises: [...activeSessionRoutine.exercises, newEx],
      });
    }

    setNewExerciseName("");
    setIsAddingExercise(false);
  };

  // Delete exercise
  const handleDeleteExercise = (exerciseId: string) => {
    if (window.confirm("Remover este exercício do treino?")) {
      const updated = routines.map((r) => {
        if (r.id !== currentRoutine.id) return r;
        return {
          ...r,
          exercises: r.exercises.filter((ex) => ex.id !== exerciseId),
        };
      });
      setRoutines(updated);
      if (isActiveSession && activeSessionRoutine) {
        setActiveSessionRoutine({
          ...activeSessionRoutine,
          exercises: activeSessionRoutine.exercises.filter((ex) => ex.id !== exerciseId),
        });
      }
    }
  };

  // Delete current routine
  const handleDeleteRoutine = (routineId: string) => {
    const routineToDelete = routines.find((r) => r.id === routineId);
    const routineName = routineToDelete?.name || "esta ficha";
    if (window.confirm(`Deseja realmente excluir permanentemente "${routineName}"?`)) {
      const remaining = routines.filter((r) => r.id !== routineId);
      setRoutines(remaining);
      if (selectedRoutineId === routineId) {
        setSelectedRoutineId(remaining[0]?.id || "");
      }
    }
  };

  // Create new routine (Blank/Custom or with quick presets)
  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    setIsSavingRoutine(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newRoutine: WorkoutRoutine = {
      id: `routine-${Date.now()}`,
      name: newRoutineName.trim(),
      targetMuscles: newRoutineMuscles.trim() || "Geral",
      color: "#007AFF",
      exercises: [],
    };

    const updated = [...routines, newRoutine];
    setRoutines(updated);
    setSelectedRoutineId(newRoutine.id);
    setIsSavingRoutine(false);
    setNewRoutineName("");
    setNewRoutineMuscles("");
    setIsCreatingRoutine(false);
  };

  // Quick action: Create blank routine directly
  const handleCreateBlankRoutine = () => {
    const count = routines.length + 1;
    const newRoutine: WorkoutRoutine = {
      id: `routine-${Date.now()}`,
      name: `Ficha ${String.fromCharCode(64 + Math.min(count, 26))} (Em Branco)`,
      targetMuscles: "Personalizado",
      color: "#007AFF",
      exercises: [],
    };

    const updated = [...routines, newRoutine];
    setRoutines(updated);
    setSelectedRoutineId(newRoutine.id);
    setIsCreatingRoutine(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Treino & Periodização
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Gerencie suas fichas de musculação, registre cargas e monitore o volume total.
          </p>
        </div>

        {/* Start / Finish Workout Button */}
        {!isActiveSession ? (
          <button
            type="button"
            onClick={handleStartWorkout}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/25 cursor-pointer self-start sm:self-auto"
          >
            <Play className="w-4 h-4 fill-black" />
            <span>Iniciar Sessão de Treino</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinishWorkout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Concluir Treino</span>
            </button>
            <button
              type="button"
              onClick={handleCancelWorkout}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Cancelar Treino"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Session Live Banner */}
      {isActiveSession && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#007AFF]/15 via-blue-950/30 to-zinc-950 border border-[#007AFF]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF] text-black flex items-center justify-center font-black">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#007AFF] uppercase tracking-wider">
                  Treino em Andamento
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-base font-black text-white font-['Outfit']">
                {currentRoutine.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            {/* Rest Timer Widget if active */}
            {restTimerSeconds !== null && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-[#007AFF]/40">
                <Timer className="w-4 h-4 text-[#007AFF] animate-spin" />
                <span className="text-xs text-zinc-400">Descanso:</span>
                <span className="text-sm font-mono font-black text-[#007AFF]">
                  {restTimerSeconds}s
                </span>
                <button
                  type="button"
                  onClick={() => setRestTimerSeconds(null)}
                  className="text-zinc-500 hover:text-white text-xs ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Stopwatch */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/70 border border-zinc-800">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span className="text-base font-mono font-black text-white tracking-wider">
                {formatTime(sessionSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Routine Selector Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          {routines.map((r) => {
            const isSelected = selectedRoutineId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (!isActiveSession) setSelectedRoutineId(r.id);
                }}
                disabled={isActiveSession}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#007AFF] text-black shadow-md shadow-[#007AFF]/25 font-black"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                } ${isActiveSession && !isSelected ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <span>{r.name.split(" - ")[0] || r.name}</span>
                <span className="text-[10px] opacity-75">
                  ({r.exercises.length})
                </span>
              </button>
            );
          })}
        </div>

        {!isActiveSession && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCreateBlankRoutine}
              title="Criar ficha em branco para preencher do zero"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Aba em Branco</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingRoutine(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/20 border border-[#007AFF]/30 text-[#007AFF] hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Ficha</span>
            </button>
          </div>
        )}
      </div>

      {/* Create New Routine Modal / Form */}
      {isCreatingRoutine && (
        <form
          onSubmit={handleCreateRoutine}
          className="p-4 rounded-2xl bg-zinc-950 border border-[#007AFF]/40 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Criar Nova Ficha de Treino
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingRoutine(false)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              placeholder="Nome (ex: Treino D - Ombros e Abdômen)"
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-[#007AFF] outline-none"
            />
            <input
              type="text"
              value={newRoutineMuscles}
              onChange={(e) => setNewRoutineMuscles(e.target.value)}
              placeholder="Grupamentos (ex: Deltoides & Core)"
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-[#007AFF] outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={isSavingRoutine}
              className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-70 disabled:cursor-not-allowed text-black text-xs font-black font-mono flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              {isSavingRoutine ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5]" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Ficha</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Routine Detail Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white font-['Outfit']">
              {currentRoutine.name}
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Foco muscular: <span className="text-zinc-200 font-bold">{currentRoutine.targetMuscles}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#007AFF] text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Exercício</span>
            </button>

            {!isActiveSession && routines.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteRoutine(currentRoutine.id)}
                title="Excluir esta ficha de treino"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/50 text-zinc-400 hover:text-red-400 text-xs font-mono transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir Ficha</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Exercise Inline Form */}
        {isAddingExercise && (
          <form
            onSubmit={handleSaveNewExercise}
            className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">
                Novo Exercício
              </span>
              <button
                type="button"
                onClick={() => setIsAddingExercise(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Nome do exercício (ex: Supino Inclinado)"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-[#007AFF]"
              />
              <input
                type="text"
                value={newExerciseMuscle}
                onChange={(e) => setNewExerciseMuscle(e.target.value)}
                placeholder="Músculo alvo (ex: Peitoral Superior)"
                className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-[#007AFF]"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#007AFF] text-black text-xs font-black font-mono"
              >
                Adicionar
              </button>
            </div>
          </form>
        )}

        {/* Exercises List */}
        {currentRoutine.exercises.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 space-y-2">
            <Dumbbell className="w-8 h-8 mx-auto stroke-[1.5] text-zinc-600" />
            <p className="text-xs">Esta ficha ainda não possui exercícios cadastrados.</p>
            <button
              type="button"
              onClick={() => setIsAddingExercise(true)}
              className="text-xs font-bold text-[#007AFF] hover:underline"
            >
              Clique para adicionar o primeiro exercício
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {currentRoutine.exercises.map((ex, exIdx) => (
              <div
                key={ex.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900/50 border border-zinc-850 hover:border-zinc-800 transition-all space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center">
                      {exIdx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-white font-['Outfit']">
                      {ex.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 text-[10px] font-mono">
                      {ex.muscleGroup}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ex.restSeconds && (
                      <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                        Descanso: {ex.restSeconds}s
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="p-1 rounded-lg text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remover exercício"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-zinc-500 border-b border-zinc-800/60 pb-1">
                        <th className="py-1 px-2 w-14">Série</th>
                        <th className="py-1 px-2 w-28">Carga (kg)</th>
                        <th className="py-1 px-2 w-24">Reps</th>
                        <th className="py-1 px-2 text-center w-16">Status</th>
                        <th className="py-1 px-1 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {ex.sets.map((set) => (
                        <tr
                          key={set.id}
                          className={`transition-colors ${
                            set.completed ? "bg-emerald-950/15" : ""
                          }`}
                        >
                          <td className="py-2 px-2 text-zinc-400 font-bold">
                            #{set.setNumber}
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={set.weight || ""}
                              onChange={(e) =>
                                handleUpdateSet(
                                  ex.id,
                                  set.id,
                                  "weight",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold text-xs focus:border-[#007AFF] outline-none"
                              placeholder="kg"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              value={set.reps || ""}
                              onChange={(e) =>
                                handleUpdateSet(
                                  ex.id,
                                  set.id,
                                  "reps",
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className="w-16 px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-white font-bold text-xs focus:border-[#007AFF] outline-none"
                              placeholder="reps"
                            />
                          </td>
                          <td className="py-1 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSet(ex.id, set.id)}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                set.completed
                                  ? "bg-emerald-500 text-black shadow-sm"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500"
                              }`}
                              title={set.completed ? "Série concluída" : "Marcar como concluída"}
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          </td>
                          <td className="py-1 px-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(ex.id, set.id)}
                              className="text-zinc-600 hover:text-zinc-400 text-xs p-1"
                              title="Remover série"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Set Button */}
                <div className="pt-1 flex justify-start">
                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-[#007AFF] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Série</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout History Section */}
      <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#007AFF]" />
            <h3 className="text-sm font-black text-white font-['Outfit'] uppercase tracking-wider">
              Histórico Recente de Treinos
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {workoutLogs.length} sessões registradas
          </span>
        </div>

        {workoutLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Nenhum treino concluído ainda. Inicie sua primeira sessão acima!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workoutLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white font-['Outfit'] truncate">
                    {log.routineName}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {log.date}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pt-1 border-t border-zinc-800/50">
                  <div className="flex items-center gap-1 text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{log.durationMinutes} min</span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-300">
                    <Layers className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>{log.completedSetsCount} séries</span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-200 font-bold">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{log.totalVolumeKg} kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
