import React, { useState } from "react";
import { Plus, Scale, TrendingDown, TrendingUp, Calendar, Trash2, Trophy, Sparkles, LineChart, ChevronRight, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { WeightLog, UserProfile } from "../types";
import { formatDateBR } from "../utils/calculations";

interface WeightTrackerProps {
  logs: WeightLog[];
  profile: UserProfile;
  onAddLog: (newLog: Omit<WeightLog, "id">) => void;
  onDeleteLog: (id: string) => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  logs,
  profile,
  onAddLog,
  onDeleteLog,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newWeight, setNewWeight] = useState<string>(String(profile.currentWeight || ""));
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState<string>("");

  // Sort logs by date ascending for chart and analysis
  const sortedLogsAsc = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedLogsDesc = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const currentWeight = profile.currentWeight;
  const startWeight = sortedLogsAsc.length > 0 ? sortedLogsAsc[0].weight : currentWeight;
  const startDate = sortedLogsAsc.length > 0 ? sortedLogsAsc[0].date : profile.createdAt;
  const targetWeight = profile.targetWeight;

  const totalDelta = Math.round((currentWeight - startWeight) * 10) / 10;
  const isLoss = totalDelta < 0;

  // Progress towards target
  let progressPercentage = 0;
  if (targetWeight && startWeight !== targetWeight) {
    const totalDistance = Math.abs(startWeight - targetWeight);
    const distanceCovered = Math.abs(startWeight - currentWeight);
    progressPercentage = Math.min(100, Math.max(0, Math.round((distanceCovered / totalDistance) * 100)));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightVal = parseFloat(newWeight);
    if (!weightVal || isNaN(weightVal)) return;

    onAddLog({
      date: new Date(date).toISOString(),
      weight: weightVal,
      note: note.trim() || undefined,
    });

    // Milestone celebration
    if (targetWeight && Math.abs(weightVal - targetWeight) <= 0.5) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#ffffff"],
        });
      } catch (err) {
        console.error(err);
      }
    }

    setNote("");
    setIsAdding(false);
  };

  // Generate SVG Path for the interactive chart
  const minWeight = Math.min(...sortedLogsAsc.map((l) => l.weight), targetWeight || currentWeight) - 1.5;
  const maxWeight = Math.max(...sortedLogsAsc.map((l) => l.weight), startWeight) + 1.5;
  const range = maxWeight - minWeight || 1;

  const chartHeight = 160;
  const chartWidth = 540;
  const paddingX = 40;
  const paddingY = 25;

  const points = sortedLogsAsc.map((log, index) => {
    const x = paddingX + (index / (Math.max(1, sortedLogsAsc.length - 1))) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((log.weight - minWeight) / range) * (chartHeight - paddingY * 2);
    return { x, y, log };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "")
    : "";

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit',sans-serif]">
            Evolução de Peso
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Histórico de pesagens e ritmo de progresso.
          </p>
        </div>

        <button
          id="open-add-weight-btn"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-bold transition-all self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Peso</span>
        </button>
      </div>

      {/* Add Weight Form Card */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-zinc-950 border border-[#007AFF]/50 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-xs uppercase tracking-wider font-black text-[#007AFF] flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4" />
              Novo Registro de Pesagem
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-zinc-400 hover:text-white font-bold"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Peso Aferido (kg)
              </label>
              <input
                type="number"
                step="0.1"
                required
                autoFocus
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-base font-bold focus:outline-none focus:border-[#007AFF]"
                placeholder="Ex: 77.8"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Data da Pesagem
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Observação (Opcional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:outline-none focus:border-[#007AFF]"
                placeholder="Ex: Pós-treino de perna"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="confirm-weight-log-btn"
              className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black uppercase tracking-wider shadow-md shadow-[#007AFF]/20"
            >
              Salvar Registro
            </button>
          </div>
        </form>
      )}

      {/* Progress Cards: Start, Current, Target - Flat Single Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Peso Inicial</p>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {startWeight} <span className="text-xs text-zinc-500 font-bold">kg</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2 font-mono">
            Início: {formatDateBR(startDate)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950 border border-[#007AFF]/40 shadow-sm">
          <p className="text-[#007AFF] text-xs uppercase font-bold tracking-wider">Peso Atual</p>
          <div className="text-3xl font-black text-white font-mono mt-1">
            {currentWeight} <span className="text-xs text-zinc-500 font-bold">kg</span>
          </div>
          <div className={`text-xs font-bold mt-2 font-mono flex items-center gap-1 ${
            isLoss ? "text-emerald-400" : "text-[#007AFF]"
          }`}>
            {isLoss ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span>{totalDelta > 0 ? `+${totalDelta}` : totalDelta} kg desde o início</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider">Meta</p>
          <div className="text-3xl font-black text-[#007AFF] font-mono mt-1">
            {targetWeight ? `${targetWeight}` : "—"} <span className="text-xs text-zinc-500 font-bold">kg</span>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            {targetWeight ? `Faltam ${Math.abs(Math.round((currentWeight - targetWeight) * 10) / 10)} kg` : "Defina no perfil"}
          </div>
        </div>
      </div>

      {/* Target Progress Bar */}
      {targetWeight && (
        <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#007AFF]" />
              Progresso rumo à meta ({targetWeight} kg)
            </span>
            <span className="text-[#007AFF] font-mono">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Visual Weight Evolution Chart (Clean Minimalist Dark SVG) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              Gráfico de Tendência de Peso
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">
            {sortedLogsAsc.length} registros cronológicos
          </span>
        </div>

        {sortedLogsAsc.length > 1 ? (
          <div className="w-full overflow-hidden">
            <div className="w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40 sm:h-44 overflow-visible">
                {/* Horizontal reference grid lines */}
                <line
                  x1={paddingX}
                  y1={paddingY}
                  x2={chartWidth - paddingX}
                  y2={paddingY}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight / 2}
                  x2={chartWidth - paddingX}
                  y2={chartHeight / 2}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <line
                  x1={paddingX}
                  y1={chartHeight - paddingY}
                  x2={chartWidth - paddingX}
                  y2={chartHeight - paddingY}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />

                {/* Target line if exists */}
                {targetWeight && (
                  <line
                    x1={paddingX}
                    y1={
                      chartHeight -
                      paddingY -
                      ((targetWeight - minWeight) / range) * (chartHeight - paddingY * 2)
                    }
                    x2={chartWidth - paddingX}
                    y2={
                      chartHeight -
                      paddingY -
                      ((targetWeight - minWeight) / range) * (chartHeight - paddingY * 2)
                    }
                    stroke="#06b6d4"
                    strokeDasharray="6 6"
                    strokeWidth="1.5"
                    opacity="0.6"
                  />
                )}

                {/* Gradient area under line */}
                <defs>
                  <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {pathD && (
                  <path
                    d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`}
                    fill="url(#chartAreaGrad)"
                  />
                )}

                {/* Main line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((p, idx) => (
                  <g key={p.log.id} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="#09090b"
                      stroke="#60a5fa"
                      strokeWidth="2.5"
                      className="transition-all hover:r-7"
                    />
                    {/* Weight Label above point */}
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill="#e4e4e7"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {p.log.weight}kg
                    </text>
                    {/* Date label at bottom */}
                    <text
                      x={p.x}
                      y={chartHeight - 6}
                      textAnchor="middle"
                      fill="#71717a"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {new Date(p.log.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-400 text-xs">
            Adicione pelo menos 2 registros de peso para visualizar o gráfico de tendência.
          </div>
        )}
      </div>

      {/* Detailed History Table / List */}
      <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Histórico Cronológico ({sortedLogsDesc.length})
          </h3>
          <span className="text-[11px] text-zinc-400">Ordenado por data recente</span>
        </div>

        <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
          {sortedLogsDesc.map((log, idx) => {
            const prevLog = sortedLogsDesc[idx + 1];
            const deltaPrev = prevLog ? Math.round((log.weight - prevLog.weight) * 10) / 10 : 0;

            return (
              <div
                key={log.id}
                className="px-5 py-3 flex items-center justify-between hover:bg-zinc-850/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-mono">
                      {log.weight} kg
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                      <span>{formatDateBR(log.date)}</span>
                      {log.note && (
                        <>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-300 italic truncate max-w-xs">{log.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {prevLog && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        deltaPrev < 0
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                          : deltaPrev > 0
                          ? "bg-blue-950/60 text-blue-400 border border-blue-800/50"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {deltaPrev > 0 ? `+${deltaPrev}` : deltaPrev} kg
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Excluir pesagem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
