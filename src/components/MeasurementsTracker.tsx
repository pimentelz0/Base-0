import React, { useState } from "react";
import { Ruler, Check, Info, Sparkles } from "lucide-react";
import { UserProfile, UserMeasurements } from "../types";

interface MeasurementsTrackerProps {
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const MeasurementsTracker: React.FC<MeasurementsTrackerProps> = ({
  profile,
  onUpdateProfile,
}) => {
  const [measurements, setMeasurements] = useState<UserMeasurements>(
    profile.measurements || {}
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateMeasurement = (key: keyof UserMeasurements, value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    setMeasurements((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      measurements,
      updatedAt: new Date().toISOString(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white font-['Outfit']">
              Medidas Corporais & Antropometria
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-[10px] font-mono font-bold">
              GYM
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Acompanhe a evolução de circunferências e percentual de gordura.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 self-start sm:self-auto"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Salvar Medidas</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Medidas corporais salvas com sucesso no seu perfil!</span>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#007AFF] mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-300 leading-relaxed">
          Preencha as medidas que você costuma monitorar. O preenchimento é flexível e opcional. Recomenda-se medir sempre no mesmo horário (ex: pela manhã em jejum).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Superior Body */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold font-mono">
            Tronco & Membros Superiores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Peitoral (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.chest || ""}
                onChange={(e) => updateMeasurement("chest", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 102.5"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Braço Direito (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.rightArm || ""}
                onChange={(e) => updateMeasurement("rightArm", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 38.0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Braço Esquerdo (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.leftArm || ""}
                onChange={(e) => updateMeasurement("leftArm", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 38.0"
              />
            </div>
          </div>
        </div>

        {/* Abdominal & Hip */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold font-mono">
            Linha de Cintura & Quadril
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Cintura / Abdômen (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.waist || ""}
                onChange={(e) => updateMeasurement("waist", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 82.0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Quadril (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.hips || ""}
                onChange={(e) => updateMeasurement("hips", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 98.0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Gordura Corporal (% BF)
              </label>
              <input
                type="number"
                step="0.1"
                value={measurements.bodyFatPercentage || ""}
                onChange={(e) =>
                  updateMeasurement("bodyFatPercentage", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 14.5"
              />
            </div>
          </div>
        </div>

        {/* Lower Body */}
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold font-mono">
            Membros Inferiores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Coxa Direita (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.rightThigh || ""}
                onChange={(e) =>
                  updateMeasurement("rightThigh", e.target.value)
                }
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 58.0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Coxa Esquerda (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.leftThigh || ""}
                onChange={(e) => updateMeasurement("leftThigh", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 58.0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
              <label className="block text-xs font-bold text-zinc-300">
                Panturrilhas (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={measurements.calves || ""}
                onChange={(e) => updateMeasurement("calves", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                placeholder="Ex: 37.5"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Medidas</span>
          </button>
        </div>
      </form>
    </div>
  );
};
