import React, { useState, useRef } from "react";
import { X, Download, Copy, Check, Sparkles, Layers, FileJson, Share2, Smartphone, CheckCircle2, Upload, ShieldCheck, RefreshCw } from "lucide-react";
import { Base0Icon } from "./Base0Icon";
import { UserProfile, WeightLog, MealLog } from "../types";
import { StorageService } from "../utils/storage";
import { IdbService } from "../utils/idbStorage";

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
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isRestoringVault, setIsRestoringVault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const fullBackupJson = StorageService.exportFullBackup();
    const blob = new Blob([fullBackupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `base0-backup-completo-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const result = StorageService.importFullBackup(text);
        if (result.success) {
          setImportStatus("Backup restaurado com sucesso! Recarregando...");
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          setImportStatus(`Erro: ${result.error || "Arquivo inválido"}`);
        }
      } catch (err: any) {
        setImportStatus("Erro ao ler o arquivo de backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFromVault = async () => {
    setIsRestoringVault(true);
    try {
      await StorageService.initPersistence();
      setImportStatus("Dados sincronizados do cofre permanente! Recarregando...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      setImportStatus("Não foi possível restaurar do cofre.");
    } finally {
      setIsRestoringVault(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Base0Icon size={28} />
            <h2 className="text-base font-bold text-white font-['Outfit']">
              Segurança & Backup Permanente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Storage Vault Active Badge */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-emerald-400 font-['Outfit'] flex items-center gap-1.5">
              <span>Cofre Duplo Permanente Ativo</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Seus dados (Perfil, Treinos, Refeições, Notas, Projetos e Água) estão salvos em armazenamento duplo (<strong>IndexedDB + LocalStorage</strong>). Mesmo se o navegador tentar limpar dados temporários, a recuperação é automática.
            </p>
          </div>
        </div>

        {/* Complete Data Backup & Restore */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-xs font-bold font-['Outfit']">
              <FileJson className="w-4 h-4 text-blue-400" />
              <span>Backup Completo (100% dos Dados)</span>
            </div>
            <span className="text-[10px] text-zinc-400">
              {weightLogs.length} pesagens · {mealLogs.length} refeições
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Baixe uma cópia física em arquivo JSON de tudo o que cadastrou para guardar no seu computador ou celular, ou restaurar quando quiser.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleExportDataJson}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Backup (.JSON)</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Restaurar de Arquivo</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="pt-1">
            <button
              onClick={handleRestoreFromVault}
              disabled={isRestoringVault}
              className="w-full py-1.5 px-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRestoringVault ? "animate-spin" : ""}`} />
              <span>Forçar Sincronização do Cofre Offline</span>
            </button>
          </div>

          {importStatus && (
            <div className="text-[11px] text-center font-medium p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-blue-400">
              {importStatus}
            </div>
          )}
        </div>

        {/* PWA Mobile Installation Guide */}
        <div className="p-4 rounded-xl bg-blue-500/5 dark:bg-zinc-900/60 border border-blue-500/25 space-y-3">
          <div className="flex items-center gap-2 text-[#007AFF] text-xs font-bold font-['Outfit'] uppercase tracking-wider">
            <Smartphone className="w-4 h-4" />
            <span>Como Abrir como App Real na Tela Inicial</span>
          </div>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Ao adicionar à tela inicial pelo link da Vercel, o app abre como aplicativo nativo em tela cheia e o armazenamento fica blindado contra limpezas do Safari:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
            <div className="p-2.5 rounded-lg bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> iPhone / iPad (Safari)
              </span>
              <p>Toque em <strong>Compartilhar</strong> (ícone do quadrado com seta) e selecione <strong>Adicionar à Tela de Início</strong>.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Android (Chrome)
              </span>
              <p>Toque nos <strong>3 pontinhos</strong> no topo e escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
