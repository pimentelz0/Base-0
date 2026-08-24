import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Cloud,
  Server,
  Code2,
} from "lucide-react";
import {
  SupabaseService,
  SupabaseSyncStatus,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SCHEMA_SQL,
} from "../lib/supabase";
import { UserProfile, WeightLog, MealLog, ChatMessage } from "../types";

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  weightLogs: WeightLog[];
  mealLogs: MealLog[];
  chatMessages: ChatMessage[];
  waterIntake: number;
  onDataPulled?: (data: {
    profile?: UserProfile;
    weightLogs?: WeightLog[];
    mealLogs?: MealLog[];
    chatMessages?: ChatMessage[];
    waterIntake?: number;
  }) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  profile,
  weightLogs,
  mealLogs,
  chatMessages,
  waterIntake,
  onDataPulled,
}) => {
  const [syncStatus, setSyncStatus] = useState<SupabaseSyncStatus | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "schema" | "credentials">("status");

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const status = await SupabaseService.checkConnection();
      setSyncStatus(status);
    } catch (e) {
      console.error(e);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handlePushAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const result = await SupabaseService.pushAllToSupabase(
        profile,
        weightLogs,
        mealLogs,
        chatMessages,
        waterIntake,
        todayStr
      );

      if (result.success) {
        setSyncResult({
          type: "success",
          message: "Todos os dados locais foram sincronizados com sucesso no Supabase!",
        });
      } else {
        setSyncResult({
          type: "info",
          message: `Sincronização parcial realizada. Se algumas tabelas não existirem, execute o script SQL na aba 'Script SQL' do modal.`,
        });
      }
      await checkStatus();
    } catch (err: any) {
      setSyncResult({
        type: "error",
        message: "Falha ao sincronizar com o Supabase: " + (err?.message || "Erro desconhecido"),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullAll = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const remote = await SupabaseService.fetchAllData();
      const todayStr = new Date().toISOString().split("T")[0];

      let pulledCount = 0;
      const payload: any = {};

      if (remote.profile) {
        payload.profile = remote.profile;
        pulledCount++;
      }
      if (remote.weightLogs && remote.weightLogs.length > 0) {
        payload.weightLogs = remote.weightLogs;
        pulledCount++;
      }
      if (remote.mealLogs && remote.mealLogs.length > 0) {
        payload.mealLogs = remote.mealLogs;
        pulledCount++;
      }
      if (remote.chatMessages && remote.chatMessages.length > 0) {
        payload.chatMessages = remote.chatMessages;
        pulledCount++;
      }
      if (remote.waterIntake && remote.waterIntake[todayStr] !== undefined) {
        payload.waterIntake = remote.waterIntake[todayStr];
        pulledCount++;
      }

      if (pulledCount > 0 && onDataPulled) {
        onDataPulled(payload);
        setSyncResult({
          type: "success",
          message: `Dados do Supabase baixados com sucesso para a aplicação!`,
        });
      } else {
        setSyncResult({
          type: "info",
          message: "Nenhum dado remoto novo encontrado. Execute o 'Enviar Dados Locais' para popular seu banco.",
        });
      }
    } catch (e: any) {
      setSyncResult({
        type: "error",
        message: "Erro ao buscar dados remotos: " + (e?.message || ""),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyToClipboard = (text: string, isSql = true) => {
    navigator.clipboard.writeText(text);
    if (isSql) {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/25">
              <Database className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono font-black tracking-widest text-[#007AFF]">
                Cloud Database • Integration
              </p>
              <h2 className="text-xl font-black text-white font-['Outfit',sans-serif] mt-0.5">
                Integração Supabase
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation */}
        <div className="flex border-b border-zinc-800 px-6 pt-3 gap-3 bg-zinc-950">
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "status"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Status & Sincronização</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("schema")}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "schema"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Script SQL (Tabelas)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "credentials"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Credenciais</span>
          </button>
        </div>

        {/* Tab 1: Status & Sync */}
        {activeTab === "status" && (
          <div className="p-6 space-y-5">
            {/* Live Connection Banner */}
            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      syncStatus?.isConnected
                        ? "bg-emerald-400 shadow-md shadow-emerald-500/30 animate-pulse"
                        : "bg-amber-400"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-black text-white font-['Outfit']">
                      {syncStatus?.isConnected
                        ? "Conectado ao Supabase"
                        : isChecking
                        ? "Verificando Conexão..."
                        : "Conectado via Chave Anon"}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      {SUPABASE_URL.replace("https://", "")}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={isChecking}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
                  <span>Testar Conexão</span>
                </button>
              </div>

              {/* Table detection checklist */}
              <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  {syncStatus?.tableStatus?.profiles ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-zinc-300">base0_profiles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {syncStatus?.tableStatus?.weightLogs ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-zinc-300">base0_weight_logs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {syncStatus?.tableStatus?.mealLogs ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-zinc-300">base0_meal_logs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {syncStatus?.tableStatus?.waterLogs ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-zinc-300">base0_water_logs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {syncStatus?.tableStatus?.chatMessages ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="text-zinc-300">base0_chat_messages</span>
                </div>
              </div>
            </div>

            {/* Sync Feedback Message */}
            {syncResult && (
              <div
                className={`p-4 rounded-xl text-xs flex items-start gap-3 ${
                  syncResult.type === "success"
                    ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-300"
                    : syncResult.type === "info"
                    ? "bg-[#007AFF]/10 border border-[#007AFF]/30 text-white"
                    : "bg-red-950/40 border border-red-500/30 text-red-300"
                }`}
              >
                {syncResult.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#007AFF] mt-0.5" />
                )}
                <div>{syncResult.message}</div>
              </div>
            )}

            {/* Sync Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Push Local -> Supabase */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#007AFF]" />
                    <span>Enviar Dados para Supabase</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Envia perfil ({profile.name}), {weightLogs.length} pesagens, {mealLogs.length} refeições e histórico para a nuvem.
                  </p>
                </div>

                <button
                  type="button"
                  id="push-supabase-btn"
                  onClick={handlePushAll}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider shadow-md shadow-[#007AFF]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sincronizar (Upload)</span>
                </button>
              </div>

              {/* Pull Supabase -> Local */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-black text-white font-['Outfit'] flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Baixar do Supabase</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Restaura e carrega os registros existentes salvos no seu projeto do Supabase no app.
                  </p>
                </div>

                <button
                  type="button"
                  id="pull-supabase-btn"
                  onClick={handlePullAll}
                  disabled={isSyncing}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                >
                  <Database className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Restaurar (Download)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Schema Script */}
        {activeTab === "schema" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white font-['Outfit']">
                  Script de Criação de Tabelas (SQL)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Copie e cole este script no <strong>SQL Editor</strong> do seu Supabase Dashboard para criar todas as tabelas e políticas RLS.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(SUPABASE_SCHEMA_SQL, true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#007AFF] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{copiedSql ? "Copiado!" : "Copiar SQL"}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-72 leading-relaxed">
                {SUPABASE_SCHEMA_SQL}
              </pre>
            </div>

            <div className="text-xs text-zinc-500 flex items-center justify-between pt-2">
              <span>Link direto para o seu dashboard do Supabase:</span>
              <a
                href="https://supabase.com/dashboard/project/gknroyivfcfyrlkhjxst/sql"
                target="_blank"
                rel="noreferrer"
                className="text-[#007AFF] hover:underline flex items-center gap-1 font-bold font-mono"
              >
                <span>Abrir SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 3: Credentials */}
        {activeTab === "credentials" && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-400 mb-1.5">
                Supabase URL
              </label>
              <input
                type="text"
                readOnly
                value={SUPABASE_URL}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                  Supabase Anon Key
                </label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(SUPABASE_ANON_KEY, false)}
                  className="text-xs text-[#007AFF] hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={SUPABASE_ANON_KEY}
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-white"
              />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-1">
              <strong className="text-white block font-['Outfit']">Persistência Automática:</strong>
              <p>
                O app sincroniza automaticamente suas ações no Supabase em segundo plano sempre que um novo registro de peso, refeição, água ou perfil é alterado.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            Projeto: <span className="text-zinc-300">gknroyivfcfyrlkhjxst</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
