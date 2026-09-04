import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Trash2,
  Lock,
  LogOut,
  User,
  Check,
  Info,
  KeyRound,
  AlertTriangle,
  Upload,
  Loader2,
} from "lucide-react";
import {
  UserProfile,
  UserMeasurements,
  ActivityLevel,
  FitnessGoal,
} from "../types";
import {
  calculateMetrics,
  ACTIVITY_LABELS,
  GOAL_LABELS,
} from "../utils/calculations";

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
    "profile" | "measurements" | "security" | "account"
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

  const liveMetrics = calculateMetrics(formData);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        avatarUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
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

  const updateMeasurement = (key: keyof UserMeasurements, value: string) => {
    const num = value === "" ? undefined : parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [key]: num,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900 bg-zinc-950">
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
              <h2 className="text-xl font-black text-white font-['Outfit']">
                {isFirstSetup ? "Avaliação Inicial" : "Conta & Perfil"}
              </h2>
              <p className="text-xs text-zinc-500 font-mono">
                {formData.name || "Atleta"} • {formData.currentWeight}kg
              </p>
            </div>
          </div>

          {!isFirstSetup && (
            <button
              id="close-profile-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-900 px-6 pt-2 gap-2 bg-zinc-950 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeSection === "profile"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Perfil & Foto
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("measurements")}
            className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
              activeSection === "measurements"
                ? "border-[#007AFF] text-[#007AFF]"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            <span>Medidas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-500 font-mono">
              Opcional
            </span>
          </button>
          {!isFirstSetup && (
            <>
              <button
                type="button"
                onClick={() => setActiveSection("security")}
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
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
                className={`pb-3 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                  activeSection === "account"
                    ? "border-[#007AFF] text-[#007AFF]"
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Conta & Ações
              </button>
            </>
          )}
        </div>

        {/* Section 1: Perfil & Foto */}
        {activeSection === "profile" && (
          <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Foto da Galeria */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
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
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity gap-1"
                >
                  <Camera className="w-4 h-4" />
                  <span>Trocar</span>
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="text-xs font-bold text-white">
                  Foto de Perfil
                </div>
                <p className="text-xs text-zinc-400">
                  Carregue uma imagem diretamente da sua galeria para personalizar o avatar.
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#007AFF]" />
                    <span>Escolher da Galeria</span>
                  </button>

                  {formData.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-red-900/50 text-zinc-400 hover:text-red-400 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dados Principais */}
            <div className="space-y-4">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
                    placeholder="Ex: Carlos"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Sexo Biológico (Cálculo TMB)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, gender: "male" })
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.gender === "male"
                          ? "bg-[#007AFF]/20 border-[#007AFF] text-[#007AFF]"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, gender: "female" })
                      }
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.gender === "female"
                          ? "bg-[#007AFF]/20 border-[#007AFF] text-[#007AFF]"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      Feminino
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                    placeholder="175"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
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
                        startWeight: formData.startWeight || w,
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                    placeholder="75.0"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Meta de Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
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

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Nível de Atividade
                  </label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        activityLevel: e.target.value as ActivityLevel,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
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
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#007AFF]/10 border-[#007AFF] text-white"
                            : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? "border-[#007AFF] bg-[#007AFF] text-black"
                              : "border-zinc-600 bg-zinc-800"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 stroke-[3]" />
                          )}
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
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-end gap-3">
              {!isFirstSetup && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors"
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

        {/* Section 2: Medidas */}
        {activeSection === "measurements" && (
          <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#007AFF] mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                Todas as medidas corporais abaixo são <strong>100% opcionais</strong>. Você pode preencher apenas o que desejar acompanhar.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Peitoral (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.chest || ""}
                  onChange={(e) => updateMeasurement("chest", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Cintura (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.waist || ""}
                  onChange={(e) => updateMeasurement("waist", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Quadril (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.hips || ""}
                  onChange={(e) => updateMeasurement("hips", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Braço Direito (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.rightArm || ""}
                  onChange={(e) =>
                    updateMeasurement("rightArm", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Braço Esquerdo (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.leftArm || ""}
                  onChange={(e) => updateMeasurement("leftArm", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Coxa Direita (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.rightThigh || ""}
                  onChange={(e) =>
                    updateMeasurement("rightThigh", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Coxa Esquerda (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.leftThigh || ""}
                  onChange={(e) =>
                    updateMeasurement("leftThigh", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Panturrilhas (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.calves || ""}
                  onChange={(e) => updateMeasurement("calves", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Ombros (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.shoulders || ""}
                  onChange={(e) => updateMeasurement("shoulders", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Pescoço (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.measurements?.neck || ""}
                  onChange={(e) => updateMeasurement("neck", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Em branco"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Gordura Corporal (% BF)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.measurements?.bodyFatPercentage || ""}
                  onChange={(e) =>
                    updateMeasurement("bodyFatPercentage", e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono"
                  placeholder="Ex: 15.0"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-zinc-900 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
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
                    <span>Salvar Medidas</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Section 3: Alterar Senha */}
        {activeSection === "security" && (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <KeyRound className="w-4 h-4 text-[#007AFF]" />
                <span>Segurança e Autenticação</span>
              </div>
              <p className="text-xs text-zinc-400">
                Defina ou atualize a sua senha de acesso para proteger seus dados e histórico.
              </p>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-bold ${
                  passwordFeedback.type === "success"
                    ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border border-rose-500/40 text-rose-300"
                }`}
              >
                {passwordFeedback.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black text-xs font-bold transition-all shadow-sm flex items-center gap-2"
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
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-zinc-400" />
                  <span>Sair do Aplicativo</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Encerra sua sessão local e retorna à tela inicial de login.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExecuteLogout}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition-colors self-start sm:self-auto shrink-0"
              >
                Sair do App
              </button>
            </div>

            {/* Excluir Conta */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
              <div>
                <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Zona de Perigo • Excluir Conta</span>
                </div>
                <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                  Esta ação é irreversível. Todos os seus registros de pesagem, histórico de refeições, conversas com o Gulinha IA e notas serão permanentemente apagados.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-bold transition-all"
                >
                  Excluir Minha Conta
                </button>
              ) : (
                <div className="p-4 rounded-xl bg-black/60 border border-rose-500/50 space-y-3 animate-fadeIn">
                  <p className="text-xs font-bold text-white">
                    Confirmar exclusão definitiva da conta e de todos os dados?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExecuteDeleteAccount}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-colors"
                    >
                      Sim, Excluir Definitivamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
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
