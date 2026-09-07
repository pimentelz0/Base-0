import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Trash2,
  Lock,
  LogOut,
  User,
  Check,
  KeyRound,
  AlertTriangle,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { UserProfile } from "../types";
import { compressImage } from "../utils/imageCompressor";

interface ProfileTabProps {
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onEditProfile?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  onSave,
  onLogout,
  onDeleteAccount,
  onEditProfile,
}) => {
  const [activeSection, setActiveSection] = useState<"security" | "account">("security");

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logoutFeedback, setLogoutFeedback] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImage(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.82,
        mimeType: "image/jpeg",
      });
      const updated = {
        ...profile,
        avatarUrl: compressedDataUrl,
        updatedAt: new Date().toISOString(),
      };
      onSave(updated);
    } catch (err) {
      console.warn("Avatar upload error:", err);
    }
  };

  const handleRemovePhoto = () => {
    const updated = {
      ...profile,
      avatarUrl: undefined,
    };
    onSave(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: "A nova senha deve conter pelo menos 6 caracteres.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "A confirmação de senha não coincide com a nova senha.",
      });
      return;
    }

    setPasswordFeedback({
      type: "success",
      message: "Senha atualizada com sucesso no seu perfil!",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setPasswordFeedback(null);
    }, 3500);
  };

  const handleExecuteLogout = () => {
    setLogoutFeedback(true);
    setTimeout(() => {
      if (onLogout) {
        onLogout();
      }
    }, 800);
  };

  const handleExecuteDeleteAccount = () => {
    if (onDeleteAccount) {
      onDeleteAccount();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Top Banner / Avatar Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#007AFF] text-black font-black flex items-center justify-center overflow-hidden shadow-lg shadow-[#007AFF]/20">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name || "Perfil"}
                  className="w-full h-full object-cover"
                />
              ) : profile.name ? (
                <span className="text-2xl sm:text-3xl font-black font-['Outfit']">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-8 h-8 stroke-[2.5]" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity gap-1"
              title="Trocar Foto"
            >
              <Camera className="w-4 h-4" />
              <span>Trocar</span>
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                {profile.name || "Minha Conta"}
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-[10px] font-mono font-bold">
                CONTA
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Gerencie sua foto, credenciais de acesso e segurança da conta.
            </p>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>Editar Perfil</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Foto</span>
          </button>

          {profile.avatarUrl && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-red-900/50 text-zinc-400 hover:text-red-400 text-xs font-bold transition-colors cursor-pointer"
              title="Remover foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-zinc-900 gap-2">
        <button
          type="button"
          onClick={() => setActiveSection("security")}
          className={`pb-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeSection === "security"
              ? "border-[#007AFF] text-[#007AFF]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Alterar Senha
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("account")}
          className={`pb-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
            activeSection === "account"
              ? "border-[#007AFF] text-[#007AFF]"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Conta & Ações
        </button>
      </div>

      {/* SECTION 1: ALTERAR SENHA */}
      {activeSection === "security" && (
        <form onSubmit={handlePasswordChange} className="space-y-5">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
            <div className="flex items-center gap-2 text-white text-xs font-bold">
              <KeyRound className="w-4 h-4 text-[#007AFF]" />
              <span>Segurança e Senha de Acesso</span>
            </div>
            <p className="text-xs text-zinc-400">
              Defina ou atualize a sua senha de acesso para proteger sua conta e registros.
            </p>
          </div>

          {passwordFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-bold ${
                passwordFeedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-500/40 dark:text-rose-300"
              }`}
            >
              {passwordFeedback.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span>{passwordFeedback.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 dígitos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-black transition-all shadow-md shadow-[#007AFF]/20 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Atualizar Senha</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: CONTA & AÇÕES */}
      {activeSection === "account" && (
        <div className="space-y-6">
          {logoutFeedback && (
            <div className="p-3.5 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>Sessão encerrada com sucesso. Redirecionando...</span>
            </div>
          )}

          {/* Sair do App */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-zinc-400" />
                <span>Sair do Aplicativo</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Encerra sua sessão local com segurança e retorna à tela inicial de login.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExecuteLogout}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-colors self-start sm:self-auto shrink-0 border border-zinc-800"
            >
              Sair do App
            </button>
          </div>

          {/* Excluir Conta */}
          <div className="p-5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
            <div>
              <div className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Zona de Perigo • Excluir Conta</span>
              </div>
              <p className="text-xs text-rose-950/80 dark:text-rose-200/70 mt-1 leading-relaxed font-medium">
                Esta ação é irreversível. Todos os seus registros de pesagem, histórico de refeições, conversas com o Gulinha IA e notas serão permanentemente apagados.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-800 hover:text-white border border-rose-300 hover:border-rose-600 dark:bg-rose-600/20 dark:hover:bg-rose-600 dark:border-rose-500/30 dark:hover:border-rose-500 dark:text-rose-300 dark:hover:text-white text-xs font-bold transition-all shadow-xs"
              >
                Excluir Minha Conta
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-white dark:bg-black/60 border border-rose-200 dark:border-rose-500/50 space-y-3 animate-fadeIn shadow-sm">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Confirmar exclusão definitiva da conta e de todos os dados?
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExecuteDeleteAccount}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors shadow-sm"
                  >
                    Sim, Excluir Definitivamente
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors border border-zinc-200 dark:border-transparent"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
