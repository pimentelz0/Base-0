import React, { useState, useEffect, useRef } from "react";
import { Check, Flame, Target, Activity, Droplets, Sparkles, User, Scale, ArrowLeft, Loader2 } from "lucide-react";
import { UserProfile, ActivityLevel, FitnessGoal, CalculatedMetrics } from "../types";
import { ACTIVITY_LABELS, GOAL_LABELS, calculateMetrics } from "../utils/calculations";
import { StorageService } from "../utils/storage";

interface GymProfileSettingsProps {
  profile: UserProfile;
  metrics: CalculatedMetrics;
  onUpdateProfile: (updated: UserProfile) => void;
  onNavigateSection?: (section: "overview" | "weight" | "meals" | "profile" | "measurements" | "gulinha") => void;
}

export const GymProfileSettings: React.FC<GymProfileSettingsProps> = ({
  profile,
  onUpdateProfile,
  onNavigateSection,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Keep latest form data in ref for unmount auto-save
  const latestRef = useRef({ formData, profile, isDirty });
  useEffect(() => {
    latestRef.current = { formData, profile, isDirty };
  }, [formData, profile, isDirty]);

  const cleanProfile = (data: UserProfile): UserProfile => ({
    ...data,
    name: data.name.trim() || profile.name || "",
    height: Number(data.height) || 0,
    age: Number(data.age) || 0,
    startWeight: Number(data.startWeight) || Number(data.currentWeight) || 0,
    currentWeight: Number(data.currentWeight) || 0,
    targetWeight: data.targetWeight ? Number(data.targetWeight) : undefined,
    isConfigured: Boolean(data.name.trim() || Number(data.currentWeight) > 0),
    updatedAt: new Date().toISOString(),
  });

  // Auto-save on unmount if user modified form fields
  useEffect(() => {
    return () => {
      if (latestRef.current.isDirty) {
        const cleaned = cleanProfile(latestRef.current.formData);
        onUpdateProfile(cleaned);
        StorageService.saveProfile(cleaned);
      }
    };
  }, []);

  // Preview real-time calculated metrics as user adjusts values
  const previewMetrics = calculateMetrics(formData);

  const handleFieldChange = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const updateField = (changes: Partial<UserProfile>) => {
    setFormData((prev) => ({ ...prev, ...changes }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const cleanedProfile = cleanProfile(formData);

    // Small delay to ensure clear visual loading feedback
    await new Promise((resolve) => setTimeout(resolve, 400));

    onUpdateProfile(cleanedProfile);
    StorageService.saveProfile(cleanedProfile);

    setIsSaving(false);
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleBack = () => {
    if (isDirty) {
      const cleaned = cleanProfile(formData);
      onUpdateProfile(cleaned);
      StorageService.saveProfile(cleaned);
      setIsDirty(false);
    }
    if (onNavigateSection) {
      onNavigateSection("overview");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">
            Perfil Físico & Metas Nutricionais
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure seus dados biométricos para o cálculo automático de TMB, TDEE, macros e hidratação.
          </p>
        </div>

        {onNavigateSection && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border border-zinc-800 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 animate-fadeIn shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <p className="font-black text-emerald-200">Perfil e metas atualizados com sucesso!</p>
              <p className="text-[11px] text-emerald-400/80 font-normal">Todas as métricas, gasto calórico e comparativo de peso foram recalculados.</p>
            </div>
          </div>
          {onNavigateSection && (
            <button
              type="button"
              onClick={() => onNavigateSection("overview")}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-black hover:bg-emerald-400 transition-colors"
            >
              Ver Visão Geral
            </button>
          )}
        </div>
      )}

      {/* Real-time Calculated Preview Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-1">
            Meta Calórica
          </span>
          <div className="text-lg sm:text-xl font-black text-[#007AFF] font-mono">
            {previewMetrics.targetCalories}{" "}
            <span className="text-xs text-zinc-400 font-normal">kcal</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-1">
            Proteína Diária
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-mono">
            {previewMetrics.targetProtein}{" "}
            <span className="text-xs text-zinc-400 font-normal">g</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-1">
            Gasto Total (GET)
          </span>
          <div className="text-lg sm:text-xl font-black text-white font-mono">
            {previewMetrics.get}{" "}
            <span className="text-xs text-zinc-400 font-normal">kcal</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block mb-1">
            Água Mínima
          </span>
          <div className="text-lg sm:text-xl font-black text-sky-400 font-mono">
            {previewMetrics.targetWater}{" "}
            <span className="text-xs text-zinc-400 font-normal">ml</span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
              Nome / Apelido
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                updateField({ name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
              placeholder="Ex: Carlos"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
              Sexo Biológico (Harris-Benedict)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateField({ gender: "male" })}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  formData.gender === "male"
                    ? "bg-[#007AFF]/20 border-[#007AFF] text-[#007AFF]"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                Masculino
              </button>
              <button
                type="button"
                onClick={() => updateField({ gender: "female" })}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  formData.gender === "female"
                    ? "bg-[#007AFF]/20 border-[#007AFF] text-[#007AFF]"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                Feminino
              </button>
            </div>
          </div>
        </div>

        {/* Biometrics row: Height & Age */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
              Altura (cm)
            </label>
            <input
              type="number"
              min="100"
              max="250"
              value={formData.height || ""}
              onChange={(e) =>
                updateField({
                  height: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
              placeholder="175"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
              Idade (anos)
            </label>
            <input
              type="number"
              min="12"
              max="100"
              value={formData.age || ""}
              onChange={(e) =>
                updateField({
                  age: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
              placeholder="25"
            />
          </div>
        </div>

        {/* Weights Section: Peso Inicial, Peso Atual, Meta de Peso */}
        <div className="p-5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-white font-['Outfit'] tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#007AFF]" />
                Controle e Metas de Peso
              </span>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                O peso inicial serve como ponto de partida oficial para o cálculo de ganho ou perda de peso.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
                Peso Inicial (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.startWeight || ""}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  updateField({
                    startWeight: w,
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 114.0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#007AFF] mb-1.5 font-['Outfit'] uppercase tracking-wider">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.currentWeight || ""}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  updateField({
                    currentWeight: w,
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-[#007AFF]/60 text-white text-sm focus:border-[#007AFF] outline-none font-mono font-bold"
                placeholder="Ex: 114.0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
                Meta de Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.targetWeight || ""}
                onChange={(e) =>
                  updateField({
                    targetWeight: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 80.0"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
              Nível de Atividade Física
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) =>
                updateField({
                  activityLevel: e.target.value as ActivityLevel,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
            >
              {Object.entries(ACTIVITY_LABELS).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label} ({info.desc})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2 font-['Outfit'] uppercase tracking-wider">
            Objetivo Principal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(GOAL_LABELS).map(([key, info]) => {
              const isSelected = formData.goal === key;
              return (
                <div
                  key={key}
                  onClick={() =>
                    updateField({
                      goal: key as FitnessGoal,
                    })
                  }
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#007AFF]/10 border-[#007AFF] text-white"
                      : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-[#007AFF] bg-[#007AFF] text-black"
                        : "border-zinc-600 bg-zinc-800"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      {info.label}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {info.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-zinc-900">
          {onNavigateSection && (
            <button
              type="button"
              onClick={() => onNavigateSection("weight")}
              className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border border-zinc-800 flex items-center justify-center gap-2"
            >
              <Scale className="w-4 h-4 text-[#007AFF]" />
              <span>Ir para Pesagem & Evolução</span>
            </button>
          )}

          <button
            type="button"
            id="save-gym-profile-bottom-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-7 py-3 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-70 disabled:cursor-not-allowed text-black text-xs font-black transition-all shadow-lg shadow-[#007AFF]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                <span>Salvando alterações...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
