import React, { useState } from "react";
import { X, Download, Copy, Check, Sparkles, Layers, FileJson, Share2 } from "lucide-react";
import { Base0Icon } from "./Base0Icon";
import { UserProfile, WeightLog, MealLog } from "../types";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  profile,
  weightLogs,
  mealLogs,
}) => {
  const [copiedSvg, setCopiedSvg] = useState(false);

  if (!isOpen) return null;

  const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="b0g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="b"/>
      <feComposite in="SourceGraphic" in2="b" operator="over"/>
    </filter>
  </defs>
  <rect width="512" height="512" rx="128" fill="#030712"/>
  <rect x="16" y="16" width="480" height="480" rx="112" fill="none" stroke="#1E293B" stroke-width="8"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="url(#b0g)" stroke-width="36" filter="url(#glow)"/>
  <circle cx="256" cy="106" r="22" fill="#38BDF8"/>
  <text x="256" y="295" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="120" fill="#FFFFFF" text-anchor="middle">0</text>
</svg>`;

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgCode], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "base0-icon-vercel.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDataJson = () => {
    const backup = {
      app: "Base 0",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      profile,
      weightLogs,
      mealLogs,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base0-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Base0Icon size={28} />
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Ícone Base 0 & Recursos para Vercel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Icon Preview Box */}
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-3xl bg-black border border-blue-500/30 shadow-2xl shadow-blue-500/20">
            <Base0Icon size={96} />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white font-['Outfit']">
              Base 0 — Apex Geometric Icon
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Pronto para Favicon, PWA e Vercel Deployment Badge
            </div>
          </div>

          <div className="flex items-center gap-2 w-full pt-2">
            <button
              onClick={handleDownloadSvg}
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Baixar SVG (512x512)</span>
            </button>
            <button
              onClick={handleCopySvg}
              className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copiedSvg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSvg ? "Copiado!" : "Copiar Código"}</span>
            </button>
          </div>
        </div>

        {/* Data Backup Option */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-800 text-blue-400">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Backup dos Dados Base 0</div>
              <div className="text-[11px] text-zinc-400">
                {weightLogs.length} pesagens, {mealLogs.length} refeições
              </div>
            </div>
          </div>
          <button
            onClick={handleExportDataJson}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
          >
            Exportar JSON
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
