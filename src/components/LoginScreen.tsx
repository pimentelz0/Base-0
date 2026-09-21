import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
} from "lucide-react";
import { AuthUser } from "../types";
import { SupabaseService } from "../lib/supabase";
import { StorageService } from "../utils/storage";

interface LoginScreenProps {
  onLogin: (user: AuthUser, initialName?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick 1-tap entry authenticated with Supabase
  const handleQuickDirectEntry = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const existingProf = StorageService.getProfile();
      const displayName =
        existingProf?.name && existingProf.name.trim() && existingProf.name !== "Atleta Base 0"
          ? existingProf.name
          : "Atleta";
      const userEmail =
        existingProf?.email && existingProf.email.trim() ? existingProf.email : "atleta@base0.app";

      // Try signing in with default athlete credentials on Supabase
      const { user: loggedInUser, error: signInErr } = await SupabaseService.signIn(
        userEmail,
        "Base0Athlete123!"
      );

      if (loggedInUser) {
        setLoading(false);
        onLogin(loggedInUser, displayName);
        return;
      }

      // If user doesn't exist yet on Supabase, register it
      if (signInErr && (signInErr.includes("Invalid login") || signInErr.includes("not found"))) {
        const { user: registeredUser } = await SupabaseService.signUp(
          userEmail,
          "Base0Athlete123!",
          displayName
        );
        if (registeredUser) {
          setLoading(false);
          onLogin(registeredUser, displayName);
          return;
        }
      }

      // Fallback to local session
      const fallbackUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: userEmail,
        name: displayName,
        createdAt: new Date().toISOString(),
      };
      setLoading(false);
      onLogin(fallbackUser, displayName);
    } catch (e: any) {
      console.warn("Direct entry error:", e);
      const fallbackUser: AuthUser = {
        id: "usr_athlete_main",
        email: "atleta@base0.app",
        name: "Atleta",
        createdAt: new Date().toISOString(),
      };
      setLoading(false);
      onLogin(fallbackUser);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Por favor, informe um e-mail válido.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres para segurança no Supabase.");
      return;
    }

    if (mode === "register" && !name.trim()) {
      setErrorMessage("Por favor, digite seu nome ou apelido.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { user, error } = await SupabaseService.signIn(cleanEmail, password);

        if (error) {
          if (error.includes("Invalid login") || error.includes("credentials")) {
            setErrorMessage(
              "E-mail ou senha incorretos no Supabase. Se ainda não criou sua conta com esta senha, selecione 'Cadastre-se aqui' logo abaixo."
            );
          } else {
            setErrorMessage(error);
          }
          setLoading(false);
          return;
        }

        if (user) {
          setSuccessMessage("Autenticado no Supabase com sucesso! Carregando seus dados...");
          setTimeout(() => {
            setLoading(false);
            onLogin(user);
          }, 400);
          return;
        }
      } else {
        // Register mode
        const cleanName = name.trim();
        const { user, error } = await SupabaseService.signUp(cleanEmail, password, cleanName);

        if (error) {
          if (error.includes("already registered") || error.includes("User already")) {
            setErrorMessage(
              "Este e-mail já está cadastrado no Supabase. Mude para 'Entre aqui' para fazer login com sua senha."
            );
          } else {
            setErrorMessage(error);
          }
          setLoading(false);
          return;
        }

        if (user) {
          setSuccessMessage("Conta criada e vinculada no Supabase!");
          setTimeout(() => {
            setLoading(false);
            onLogin(user, cleanName);
          }, 400);
          return;
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao conectar ao Supabase.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-[#007AFF]/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#00F0FF]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header Branding */}
      <header className="w-full max-w-md mx-auto flex items-center justify-between pt-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#007AFF] text-black font-black flex items-center justify-center font-['Outfit'] text-lg shadow-lg shadow-[#007AFF]/25">
            0
          </div>
          <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
            BASE <span className="text-[#007AFF]">0</span>
          </span>
        </div>

        {/* Supabase Cloud Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300">
          <Cloud className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Supabase Cloud</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {mode === "login" ? "Entrar na sua Conta" : "Criar sua conta"}
            </h1>
            <p className="text-xs text-zinc-400">
              {mode === "login"
                ? "Sua conta é sincronizada na nuvem via Supabase entre todos os seus dispositivos."
                : "Crie sua conta para manter seus dados, treinos e projetos sempre salvos na nuvem."}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-medium animate-fadeIn">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
                  Seu Nome
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 font-['Outfit'] uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-300 font-['Outfit'] uppercase tracking-wider">
                  Senha
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMessage("Digite seu e-mail e uma nova senha para criar sua conta no Supabase.");
                    }}
                    className="text-[11px] text-[#007AFF] hover:underline font-mono"
                  >
                    Criar nova senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#007AFF] outline-none font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-[#007AFF] focus:ring-0 cursor-pointer"
                />
                <span>Manter sessão salva (não deslogar)</span>
              </label>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              id="auth-submit-btn"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#007AFF]/25 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === "login" ? "Entrar na Minha Conta" : "Criar Minha Conta no Supabase"}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

            {/* Quick 1-Tap Entry for Instant Access */}
            <button
              type="button"
              id="quick-direct-entry-btn"
              disabled={loading}
              onClick={handleQuickDirectEntry}
              className="w-full py-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Cloud className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Entrar Direto (Perfil Atleta Nuvem)</span>
            </button>
          </form>

          {/* Switcher Link */}
          <div className="text-center pt-2">
            {mode === "login" ? (
              <p className="text-xs text-zinc-400">
                Não tem uma conta?{" "}
                <button
                  type="button"
                  id="switch-to-register-btn"
                  onClick={() => {
                    setMode("register");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-[#007AFF] hover:underline font-bold transition-colors cursor-pointer"
                >
                  Cadastre-se aqui
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-400">
                Já possui uma conta?{" "}
                <button
                  type="button"
                  id="switch-to-login-btn"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="text-[#007AFF] hover:underline font-bold transition-colors cursor-pointer"
                >
                  Entre aqui
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-md mx-auto text-center z-10 py-3 space-y-1.5">
        <p className="text-[11px] text-zinc-500">
          © {new Date().getFullYear()} Base 0 • Sincronização em Nuvem Supabase
        </p>
      </footer>
    </div>
  );
};
