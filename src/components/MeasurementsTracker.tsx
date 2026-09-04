import React, { useState, useEffect, useMemo } from "react";
import { Check, Save, Sparkles, User, Ruler, Activity, Percent, Info } from "lucide-react";
import { UserProfile, UserMeasurements, Gender } from "../types";
import { Body2DSilhouette, BodyPartKey } from "./Body2DSilhouette";

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
  const [gender, setGender] = useState<Gender>(profile.gender || "male");
  const [activePart, setActivePart] = useState<BodyPartKey | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile.measurements) {
      setMeasurements(profile.measurements);
    }
    if (profile.gender) {
      setGender(profile.gender);
    }
  }, [profile.measurements, profile.gender]);

  const handleFieldChange = (field: keyof UserMeasurements, value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    setMeasurements((prev) => ({
      ...prev,
      [field]: isNaN(num as number) ? undefined : num,
    }));
    setIsDirty(true);
  };

  const handleStep = (field: keyof UserMeasurements, delta: number) => {
    setMeasurements((prev) => {
      const current = prev[field] ?? 0;
      const updated = Math.max(0, parseFloat((current + delta).toFixed(1)));
      return {
        ...prev,
        [field]: updated,
      };
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdateProfile({
      ...profile,
      gender,
      measurements,
      updatedAt: new Date().toISOString(),
    });
    setIsDirty(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleSelectPart = (part: BodyPartKey) => {
    setActivePart(part);
    const targetMap: Record<BodyPartKey, string> = {
      neck: "input-neck",
      shoulders: "input-shoulders",
      chest: "input-chest",
      arms: "input-rightArm",
      waist: "input-waist",
      hips: "input-hips",
      thighs: "input-rightThigh",
      calves: "input-calves",
    };
    const element = document.getElementById(targetMap[part]);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  const handleSelectGender = (newGender: Gender) => {
    setGender(newGender);
    onUpdateProfile({
      ...profile,
      gender: newGender,
      measurements,
      updatedAt: new Date().toISOString(),
    });
  };

  // Health Metrics Calculations
  const waistToHipRatio = useMemo(() => {
    if (measurements.waist && measurements.hips && measurements.hips > 0) {
      return (measurements.waist / measurements.hips).toFixed(2);
    }
    return null;
  }, [measurements.waist, measurements.hips]);

  const chestToWaistRatio = useMemo(() => {
    if (measurements.chest && measurements.waist && measurements.waist > 0) {
      return (measurements.chest / measurements.waist).toFixed(2);
    }
    return null;
  }, [measurements.chest, measurements.waist]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit'] flex items-center gap-2.5">
            <Ruler className="w-6 h-6 text-[#007AFF]" />
            <span>Medidas Corporais</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Preencha suas circunferências corporais para acompanhar a evolução física e calcular proporções.
          </p>
        </div>

        {/* Gender Toggle & Save Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Gender Selector */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => handleSelectGender("male")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gender === "male"
                  ? "bg-[#007AFF] text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Homem
            </button>
            <button
              type="button"
              onClick={() => handleSelectGender("female")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gender === "female"
                  ? "bg-[#007AFF] text-white shadow-sm font-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mulher
            </button>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg ${
              isDirty
                ? "bg-[#007AFF] hover:bg-blue-600 text-white shadow-blue-500/25 animate-pulse"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Salvar Medidas</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Suas medidas foram salvas com sucesso!</span>
        </div>
      )}

      {/* Main Grid: 2D Silhouette on Left, Clean Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 2D Anatomical Static Silhouette */}
        <div className="lg:col-span-5 rounded-3xl bg-zinc-950 border border-zinc-900 p-5 shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-900 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#007AFF]" />
              Silhueta Anatômica 2D
            </span>
            <span className="text-[11px] font-bold text-zinc-500">
              {gender === "male" ? "Físico Masculino" : "Físico Feminino"}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 text-center mb-1">
            Clique nas etiquetas ou no boneco para selecionar e destacar o grupo muscular.
          </p>

          <Body2DSilhouette
            gender={gender}
            measurements={measurements}
            activePart={activePart}
            onSelectPart={handleSelectPart}
          />

          {/* Quick Metrics Under 2D Figure */}
          <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-zinc-900">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Razão Cintura/Quadril
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-white font-['Outfit']">
                  {waistToHipRatio || "—"}
                </span>
                {waistToHipRatio && (
                  <span className="text-[10px] text-emerald-400 font-bold">
                    {parseFloat(waistToHipRatio) < (gender === "male" ? 0.9 : 0.8) ? "Excelente" : "Atenção"}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Proporção V-Taper (Peito/Cintura)
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-black text-white font-['Outfit']">
                  {chestToWaistRatio ? `${chestToWaistRatio}x` : "—"}
                </span>
                {chestToWaistRatio && (
                  <span className="text-[10px] text-blue-400 font-bold">
                    {parseFloat(chestToWaistRatio) > 1.25 ? "Atlético" : "Equilibrado"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Measurements Input Form */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section: Tronco & Ombros */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#007AFF]" />
                Tronco Superior
              </h3>
              <span className="text-[11px] text-zinc-500 font-semibold">Tórax, Ombros & Pescoço</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Ombros */}
              <div
                onFocus={() => setActivePart("shoulders")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "shoulders"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Ombros
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-shoulders"
                    type="number"
                    step="0.5"
                    min="40"
                    max="200"
                    placeholder="—"
                    value={measurements.shoulders ?? ""}
                    onChange={(e) => handleFieldChange("shoulders", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("shoulders", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("shoulders", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Peitoral / Tórax */}
              <div
                onFocus={() => setActivePart("chest")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "chest"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Peitoral / Tórax
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-chest"
                    type="number"
                    step="0.5"
                    min="40"
                    max="200"
                    placeholder="—"
                    value={measurements.chest ?? ""}
                    onChange={(e) => handleFieldChange("chest", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("chest", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("chest", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Pescoço */}
              <div
                onFocus={() => setActivePart("neck")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "neck"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Pescoço
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-neck"
                    type="number"
                    step="0.5"
                    min="20"
                    max="80"
                    placeholder="—"
                    value={measurements.neck ?? ""}
                    onChange={(e) => handleFieldChange("neck", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("neck", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("neck", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Cintura & Quadril */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007AFF]" />
                Cintura & Quadril
              </h3>
              <span className="text-[11px] text-zinc-500 font-semibold">Linha central e glúteos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cintura */}
              <div
                onFocus={() => setActivePart("waist")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "waist"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-400">
                    Cintura (na altura do umbigo)
                  </label>
                  {measurements.waist && (
                    <span className="text-[10px] font-bold text-zinc-500">
                      {measurements.waist < 80 ? "Muito fina" : measurements.waist < 90 ? "Saudável" : "Atenção"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-waist"
                    type="number"
                    step="0.5"
                    min="40"
                    max="180"
                    placeholder="—"
                    value={measurements.waist ?? ""}
                    onChange={(e) => handleFieldChange("waist", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("waist", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("waist", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Quadril */}
              <div
                onFocus={() => setActivePart("hips")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "hips"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-zinc-400">
                    Quadril (maior circunferência)
                  </label>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-hips"
                    type="number"
                    step="0.5"
                    min="40"
                    max="180"
                    placeholder="—"
                    value={measurements.hips ?? ""}
                    onChange={(e) => handleFieldChange("hips", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("hips", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("hips", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Braços & Pernas */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#007AFF]" />
                Braços & Pernas
              </h3>
              <span className="text-[11px] text-zinc-500 font-semibold">Membros simétricos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Braço Direito */}
              <div
                onFocus={() => setActivePart("arms")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "arms"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Braço Direito (contraído)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-rightArm"
                    type="number"
                    step="0.5"
                    min="15"
                    max="70"
                    placeholder="—"
                    value={measurements.rightArm ?? ""}
                    onChange={(e) => handleFieldChange("rightArm", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("rightArm", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("rightArm", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Braço Esquerdo */}
              <div
                onFocus={() => setActivePart("arms")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "arms"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Braço Esquerdo (contraído)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-leftArm"
                    type="number"
                    step="0.5"
                    min="15"
                    max="70"
                    placeholder="—"
                    value={measurements.leftArm ?? ""}
                    onChange={(e) => handleFieldChange("leftArm", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("leftArm", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("leftArm", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Coxa Direita */}
              <div
                onFocus={() => setActivePart("thighs")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "thighs"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Coxa Direita
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-rightThigh"
                    type="number"
                    step="0.5"
                    min="25"
                    max="100"
                    placeholder="—"
                    value={measurements.rightThigh ?? ""}
                    onChange={(e) => handleFieldChange("rightThigh", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("rightThigh", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("rightThigh", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Coxa Esquerda */}
              <div
                onFocus={() => setActivePart("thighs")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "thighs"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Coxa Esquerda
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-leftThigh"
                    type="number"
                    step="0.5"
                    min="25"
                    max="100"
                    placeholder="—"
                    value={measurements.leftThigh ?? ""}
                    onChange={(e) => handleFieldChange("leftThigh", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("leftThigh", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("leftThigh", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* Panturrilhas */}
              <div
                onFocus={() => setActivePart("calves")}
                className={`p-3 rounded-2xl border transition-all ${
                  activePart === "calves"
                    ? "bg-[#007AFF]/10 border-[#007AFF]"
                    : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700"
                }`}
              >
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Panturrilhas
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="input-calves"
                    type="number"
                    step="0.5"
                    min="15"
                    max="70"
                    placeholder="—"
                    value={measurements.calves ?? ""}
                    onChange={(e) => handleFieldChange("calves", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">cm</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("calves", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("calves", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5
                  </button>
                </div>
              </div>

              {/* % Gordura Corporal (BF) */}
              <div className="p-3 rounded-2xl border transition-all bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700">
                <label className="text-[11px] font-bold text-zinc-400 block mb-1 flex items-center justify-between">
                  <span>Gordura Corporal (BF)</span>
                  <Percent className="w-3 h-3 text-[#007AFF]" />
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="3"
                    max="60"
                    placeholder="Ex: 14.5"
                    value={measurements.bodyFatPercentage ?? ""}
                    onChange={(e) => handleFieldChange("bodyFatPercentage", e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-[#007AFF]"
                  />
                  <span className="text-xs font-bold text-zinc-400">%</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-800/50">
                  <button
                    type="button"
                    onClick={() => handleStep("bodyFatPercentage", -0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    -0.5%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("bodyFatPercentage", 0.5)}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 cursor-pointer"
                  >
                    +0.5%
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex items-start gap-3 text-zinc-400">
            <Info className="w-4 h-4 text-[#007AFF] mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-zinc-300 block">Dica para medição precisa:</span>
              <p className="leading-relaxed">
                Meça sempre em jejum pela manhã, utilizando uma fita métrica sem apertar a pele. Meça os braços no pico da contração e a cintura 2 cm acima da cicatriz umbilical.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


