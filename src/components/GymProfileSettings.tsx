import React, { useState, useEffect } from "react";
import { Check, Flame, Target, Activity, Droplets, Sparkles, User, HelpCircle } from "lucide-react";
import { UserProfile, ActivityLevel, FitnessGoal, CalculatedMetrics } from "../types";
import { ACTIVITY_LABELS, GOAL_LABELS, calculateMetrics } from "../utils/calculations";

interface GymProfileSettingsProps {
  profile: UserProfile;
  metrics: CalculatedMetrics;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const GymProfileSettings: React.FC<GymProfileSettingsProps> = ({
  profile,
  metrics,
  onUpdateProfile,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  // Preview real-time calculated metrics as user adjusts values
  const previewMetrics = calculateMetrics(formData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Perfil Físico & Metas Nutricionais
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-[10px] font-mono font-bold">
              GYM
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure seus dados biométricos para o cálculo automático de TMB, TDEE, macros e hidratação.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 self-start sm:self-auto"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Salvar Perfil</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Perfil físico e metas atualizados com sucesso!</span>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Nome / Apelido
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
              placeholder="Ex: Carlos"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Sexo Biológico (Fórmula Harris-Benedict)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: "male" })}
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
                onClick={() => setFormData({ ...formData, gender: "female" })}
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
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Altura (cm)
            </label>
            <input
              type="number"
              min="100"
              max="250"
              required
              value={formData.height || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  height: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
              placeholder="175"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Idade (anos)
            </label>
            <input
              type="number"
              min="12"
              max="100"
              required
              value={formData.age || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
              placeholder="25"
            />
          </div>
        </div>

        {/* Weights Section: Peso Inicial, Peso Atual, Meta de Peso */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
          <div>
            <span className="text-xs font-black uppercase text-white font-['Outfit'] tracking-wide">
              Controle e Metas de Peso
            </span>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
              O peso inicial serve como ponto de partida oficial para o cálculo de ganho ou perda de peso.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Peso Inicial (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                required
                value={formData.startWeight || ""}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    startWeight: w,
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 114.0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#007AFF] mb-1.5">
                Peso Atual (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                required
                value={formData.currentWeight || ""}
                onChange={(e) => {
                  const w = parseFloat(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    currentWeight: w,
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-[#007AFF]/50 text-white text-sm focus:border-[#007AFF] outline-none font-mono font-bold"
                placeholder="Ex: 114.0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Meta de Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.targetWeight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              Nível de Atividade Física
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
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
          <label className="block text-xs font-bold text-zinc-300 mb-2">
            Objetivo Principal
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(GOAL_LABELS).map(([key, info]) => {
              const isSelected = formData.goal === key;
              return (
                <label
                  key={key}
                  onClick={() =>
                    setFormData({
                      ...formData,
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
                </label>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Perfil & Recalcular Metas</span>
          </button>
        </div>
      </form>
    </div>
  );
};
