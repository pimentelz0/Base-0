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

  // Active workout session state with persistent recovery across tab switches
  const savedActive = StorageService.getActiveWorkoutSession();
  const isRecentActive =
    savedActive && Date.now() - savedActive.startedAt < 3 * 3600 * 1000;

  const [isActiveSession, setIsActiveSession] = useState<boolean>(
    () => !!isRecentActive
  );
  const [activeSessionRoutine, setActiveSessionRoutine] =
    useState<WorkoutRoutine | null>(() =>
      isRecentActive ? savedActive.routine : null
    );
  const [sessionSeconds, setSessionSeconds] = useState<number>(() => {
    if (isRecentActive) {
      const elapsed = Math.floor((Date.now() - savedActive.startedAt) / 1000);
      return Math.max(savedActive.sessionSeconds, elapsed);
    }
    return 0;
  });
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(() =>
    isRecentActive ? savedActive.startedAt : 0
  );

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

  // Deletion and renaming modal states
  const [routineToDelete, setRoutineToDelete] = useState<WorkoutRoutine | null>(null);
  const [routineToRename, setRoutineToRename] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  // Save routines on change
  useEffect(() => {
    StorageService.saveWorkoutRoutines(routines);
  }, [routines]);

  // Persist active workout session continuously so tab switches never lose workout progress
  useEffect(() => {
    if (isActiveSession && activeSessionRoutine) {
      StorageService.saveActiveWorkoutSession({
        routine: activeSessionRoutine,
        sessionSeconds,
        startedAt: sessionStartedAt || Date.now(),
      });
    }
  }, [isActiveSession, activeSessionRoutine, sessionSeconds, sessionStartedAt]);

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
    const now = Date.now();
    setActiveSessionRoutine(clone);
    setIsActiveSession(true);
    setSessionSeconds(0);
    setSessionStartedAt(now);
    StorageService.saveActiveWorkoutSession({
      routine: clone,
      sessionSeconds: 0,
      startedAt: now,
    });
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

    // Save progressive overload back to routines so updated weights/reps are preserved for next time
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id !== activeSessionRoutine.id) return r;
        return {
          ...r,
          exercises: activeSessionRoutine.exercises.map((activeEx) => ({
            ...activeEx,
            sets: activeEx.sets.map((s) => ({ ...s, completed: false })),
          })),
        };
      })
    );

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
    StorageService.clearActiveWorkoutSession();
  };

  // Cancel workout
  const handleCancelWorkout = () => {
    if (window.confirm("Deseja realmente cancelar o treino em andamento?")) {
      setIsActiveSession(false);
      setActiveSessionRoutine(null);
      setRestTimerSeconds(null);
      StorageService.clearActiveWorkoutSession();
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
    const updated = routines.map((r) => {
      if (r.id !== currentRoutine.id) return r;
      return {
        ...r,
        exercises: r.exercises.filter((ex) => ex.id !== exerciseId),
      };
    });
    setRoutines(updated);
    StorageService.saveWorkoutRoutines(updated);
    if (isActiveSession && activeSessionRoutine) {
      setActiveSessionRoutine({
        ...activeSessionRoutine,
        exercises: activeSessionRoutine.exercises.filter((ex) => ex.id !== exerciseId),
      });
    }
  };

  // Confirm delete routine
  const confirmDeleteRoutine = () => {
    if (!routineToDelete) return;
    const idToDelete = routineToDelete.id;
    const nameToDelete = routineToDelete.name;
    const remaining = routines.filter(
      (r) => r.id !== idToDelete && r.name.toLowerCase() !== nameToDelete.toLowerCase()
    );
    StorageService.saveWorkoutRoutines(remaining);
    setRoutines(remaining);
    if (selectedRoutineId === idToDelete) {
      setSelectedRoutineId(remaining[0]?.id || "");
    }
    if (
      isActiveSession &&
      (activeSessionRoutine?.id === idToDelete ||
        activeSessionRoutine?.name.toLowerCase() === nameToDelete.toLowerCase())
    ) {
      setIsActiveSession(false);
      setActiveSessionRoutine(null);
      StorageService.clearActiveWorkoutSession();
    }
    setRoutineToDelete(null);
  };

  // Handle save rename routine
  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!routineToRename || !renameValue.trim()) return;
    const newName = renameValue.trim();
    const updated = routines.map((r) => {
      if (r.id === routineToRename.id) {
        return { ...r, name: newName };
      }
      return r;
    });
    setRoutines(updated);
    StorageService.saveWorkoutRoutines(updated);
    if (activeSessionRoutine?.id === routineToRename.id) {
      setActiveSessionRoutine({ ...activeSessionRoutine, name: newName });
    }
    setRoutineToRename(null);
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
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn pb-12">
      {/* Header Simplificado */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
            Treinos
          </h2>
        </div>

        {/* Start / Finish Workout Button */}
        {routines.length > 0 && (
          !isActiveSession ? (
            <button
              type="button"
              onClick={handleStartWorkout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/25 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Iniciar Treino</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFinishWorkout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Concluir</span>
              </button>
              <button
                type="button"
                onClick={handleCancelWorkout}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                title="Cancelar Sessão"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        )}
      </div>

      {/* Active Session Live Banner */}
      {isActiveSession && currentRoutine && (
        <div className="p-3.5 rounded-2xl bg-[#007AFF]/10 border border-[#007AFF]/30 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#007AFF] text-black flex items-center justify-center font-black">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#007AFF] uppercase tracking-wider block">
                Em Andamento
              </span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                {currentRoutine.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {restTimerSeconds !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-[#007AFF]/40">
                <Timer className="w-3.5 h-3.5 text-[#007AFF] animate-spin" />
                <span className="text-xs font-mono font-bold text-[#007AFF]">
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

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-sm font-mono font-bold text-white tracking-wider">
                {formatTime(sessionSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Estado Vazio: Sem Fichas */}
      {routines.length === 0 ? (
        <div className="py-14 text-center flex flex-col items-center justify-center space-y-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-6">
          <Dumbbell className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
          <div>
            <h3 className="text-sm font-bold text-white">Nenhum treino criado</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Crie sua primeira ficha para adicionar seus exercícios.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreatingRoutine(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black text-xs transition-all shadow-md shadow-[#007AFF]/25 cursor-pointer mt-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Criar Ficha</span>
          </button>
        </div>
      ) : (
        <>
          {/* Seletor de Fichas Simplificado */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-1">
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-850">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "bg-[#007AFF] text-black shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    } ${isActiveSession && !isSelected ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {r.name}
                  </button>
                );
              })}
            </div>

            {!isActiveSession && (
              <button
                type="button"
                onClick={() => setIsCreatingRoutine(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3 text-[#007AFF]" />
                <span>Nova Ficha</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Form de Criação de Ficha */}
      {isCreatingRoutine && (
        <form
          onSubmit={handleCreateRoutine}
          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Nova Ficha de Treino</span>
            <button
              type="button"
              onClick={() => setIsCreatingRoutine(false)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </div>
          <div>
            <input
              type="text"
              required
              autoFocus
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              placeholder="Nome da ficha (ex: Treino A, Costas & Bíceps...)"
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:border-[#007AFF] outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingRoutine}
              className="px-4 py-1.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black"
            >
              {isSavingRoutine ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}

      {/* Card da Ficha Selecionada */}
      {currentRoutine && (
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-black text-white font-['Outfit']">
                {currentRoutine.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRoutineToRename({ id: currentRoutine.id, name: currentRoutine.name });
                  setRenameValue(currentRoutine.name);
                }}
                title="Renomear esta ficha/bloco"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <Edit2 className="w-3 h-3 text-[#007AFF]" />
                <span>Renomear</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingExercise(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#007AFF] text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Exercício</span>
              </button>

              {!isActiveSession && (
                <button
                  type="button"
                  onClick={() => setRoutineToDelete(currentRoutine)}
                  title="Excluir ficha permanentemente"
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form de Adicionar Exercício */}
          {isAddingExercise && (
            <form
              onSubmit={handleSaveNewExercise}
              className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Novo Exercício</span>
                <button
                  type="button"
                  onClick={() => setIsAddingExercise(false)}
                  className="text-zinc-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                required
                autoFocus
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                placeholder="Nome do exercício (ex: Supino Reto)"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs outline-none focus:border-[#007AFF]"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#007AFF] text-black text-xs font-black"
                >
                  Adicionar
                </button>
              </div>
            </form>
          )}

          {/* Lista de Exercícios */}
          {currentRoutine.exercises.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 space-y-1">
              <p className="text-xs">Nenhum exercício nesta ficha.</p>
              <button
                type="button"
                onClick={() => setIsAddingExercise(true)}
                className="text-xs font-bold text-[#007AFF] hover:underline"
              >
                + Adicionar exercício
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentRoutine.exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-850 space-y-2.5"
                >
                  {/* Cabeçalho do Exercício */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono font-bold flex items-center justify-center">
                        {exIdx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {ex.name}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(ex.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Remover exercício"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Linhas de Séries Compactas e Limpas */}
                  <div className="space-y-1.5">
                    {ex.sets.map((set) => (
                      <div
                        key={set.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                          set.completed
                            ? "bg-emerald-950/20 border-emerald-900/40"
                            : "bg-zinc-950 border-zinc-850"
                        }`}
                      >
                        <span className="text-zinc-500 font-mono w-6 text-center text-[11px] font-bold">
                          #{set.setNumber}
                        </span>

                        <div className="flex items-center gap-1">
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
                            className="w-16 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white font-bold text-xs text-center focus:border-[#007AFF] outline-none"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-zinc-500">kg</span>
                        </div>

                        <div className="flex items-center gap-1 ml-1">
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
                            className="w-14 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-white font-bold text-xs text-center focus:border-[#007AFF] outline-none"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-zinc-500">reps</span>
                        </div>

                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSet(ex.id, set.id)}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
                              set.completed
                                ? "bg-emerald-500 text-black shadow-sm"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-500"
                            }`}
                            title={set.completed ? "Concluída" : "Marcar como concluída"}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSet(ex.id, set.id)}
                            className="text-zinc-600 hover:text-zinc-400 text-xs px-1"
                            title="Remover série"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Adicionar Série */}
                  <button
                    type="button"
                    onClick={() => handleAddSet(ex.id)}
                    className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-[#007AFF] transition-colors pt-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar Série</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Histórico Recente Simplificado (apenas se houver sessões) */}
      {workoutLogs.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Histórico
            </h4>
            <span className="text-[10px] font-mono text-zinc-500">
              {workoutLogs.length} treinos
            </span>
          </div>

          <div className="space-y-2">
            {workoutLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850 text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-white">{log.routineName}</span>
                  <span className="text-[10px] text-zinc-500 ml-2 font-mono">
                    {log.date}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px] shrink-0">
                  <span>{log.durationMinutes} min</span>
                  <span>{log.completedSetsCount} séries</span>
                  <span className="text-zinc-200 font-bold">{log.totalVolumeKg} kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Renomear Ficha / Bloco */}
      {routineToRename && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white">Renomear Bloco de Treino</h4>
              <button
                type="button"
                onClick={() => setRoutineToRename(null)}
                className="text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Nome da Ficha / Bloco
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Ex: Treino A, Costas & Bíceps, Full Body..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm font-bold focus:border-[#007AFF] outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRoutineToRename(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-50 text-black text-xs font-black cursor-pointer"
                >
                  Salvar Nome
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Ficha / Bloco */}
      {routineToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl animate-fadeIn">
            <div>
              <h4 className="text-sm font-black text-white">Excluir Bloco de Treino</h4>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Tem certeza que deseja excluir permanentemente o bloco{" "}
                <strong className="text-white">"{routineToDelete.name}"</strong>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoutineToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteRoutine}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black cursor-pointer shadow-lg shadow-red-600/30"
              >
                Excluir Treino
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
