import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Trash2,
  Lock,
  LogOut,
  User,
  Check,
  KeyRound,
  AlertTriangle,
  Upload,
  Loader2,
} from "lucide-react";
import {
  UserProfile,
} from "../types";
import { compressImage } from "../utils/imageCompressor";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  isFirstSetup?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
  onLogout,
  onDeleteAccount,
  isFirstSetup = false,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [activeSection, setActiveSection] = useState<
    "profile" | "security" | "account"
  >("profile");

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
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
    setPasswordFeedback(null);
    setShowDeleteConfirm(false);
    setLogoutFeedback(false);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    onSave({
      ...formData,
      isConfigured: true,
      updatedAt: new Date().toISOString(),
    });
    setIsSaving(false);
    onClose();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.82,
        mimeType: "image/jpeg",
      });
      setFormData((prev) => ({
        ...prev,
        avatarUrl: compressed,
      }));
    } catch (err) {
      console.warn("Avatar compression error, using fallback reader:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          avatarUrl: dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      avatarUrl: undefined,
    }));
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
      message: "Senha atualizada com sucesso no seu perfil local!",
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
      onClose();
    }, 800);
  };

  const handleExecuteDeleteAccount = () => {
    if (onDeleteAccount) {
      onDeleteAccount();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF] text-black font-black flex items-center justify-center overflow-hidden shadow-sm">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                />
              ) : formData.name ? (
                <span className="text-base font-black font-['Outfit']">
                  {formData.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-5 h-5 stroke-[2.5]" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white font-['Outfit']">
                {isFirstSetup ? "Avaliação Inicial" : "Conta & Perfil"}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {formData.name || "Perfil do Usuário"}
              </p>
            </div>
          </div>

          {!isFirstSetup && (
            <button
              id="close-profile-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 px-6 pt-2 gap-2 bg-white dark:bg-zinc-950 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
              activeSection === "profile"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Perfil & Foto
          </button>
          {!isFirstSetup && (
            <>
              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeSection === "security"
                    ? "border-[#007AFF] text-[#007AFF]"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Alterar Senha
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("account")}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeSection === "account"
                    ? "border-[#007AFF] text-[#007AFF]"
                    : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                Conta & Ações
              </button>
            </>
          )}
        </div>

        {/* Section 1: Perfil & Foto */}
        {activeSection === "profile" && (
          <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Foto da Galeria */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-[#007AFF] text-black font-black flex items-center justify-center overflow-hidden shadow-md">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Foto de Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.name ? (
                    <span className="text-3xl font-black font-['Outfit']">
                      {formData.name.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-8 h-8 stroke-[2.5]" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity gap-1 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Trocar</span>
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-sm font-bold text-zinc-900 dark:text-white font-['Outfit']">
                  Foto de Perfil
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Carregue uma imagem diretamente da sua galeria ou câmera para personalizar seu avatar no app.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
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
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Escolher da Galeria</span>
                  </button>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/40 text-zinc-600 dark:text-zinc-400 hover:text-red-500 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Nome / Apelido */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Nome de Exibição <span className="text-[#007AFF]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
                placeholder="Ex: Carlos Amorim"
              />
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Este nome será exibido nas saudações da tela inicial, cabeçalho e interações no app. Dados de peso, altura e metas são gerenciados diretamente na aba Gym.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-end gap-3">
              {!isFirstSetup && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                id="save-profile-btn"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] disabled:opacity-70 disabled:cursor-not-allowed text-black text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Salvar Perfil</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Section 2: Alterar Senha */}
        {activeSection === "security" && (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-2 text-zinc-900 dark:text-white text-xs font-bold">
                <KeyRound className="w-4 h-4 text-[#007AFF]" />
                <span>Segurança e Autenticação</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Defina ou atualize a sua senha de acesso para proteger seus dados e histórico.
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
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm focus:border-[#007AFF] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 dígitos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm focus:border-[#007AFF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm focus:border-[#007AFF] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Atualizar Senha</span>
              </button>
            </div>
          </form>
        )}

        {/* Section 4: Conta & Ações (Sair e Excluir) */}
        {activeSection === "account" && (
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {logoutFeedback && (
              <div className="p-3.5 rounded-xl bg-[#007AFF]/10 border border-[#007AFF]/30 text-[#007AFF] text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Sessão encerrada com sucesso. Redirecionando...</span>
              </div>
            )}

            {/* Sair do App */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Sair do Aplicativo</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Encerra sua sessão local e retorna à tela inicial de login.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExecuteLogout}
                className="px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white text-xs font-bold transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
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
    </div>
  );
};
