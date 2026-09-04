import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { AuthUser } from "../types";

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
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !email.includes("@")) {
      setErrorMessage("Por favor, informe um e-mail válido.");
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    if (mode === "register" && !name.trim()) {
      setErrorMessage("Por favor, digite seu nome ou apelido.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const displayName =
        mode === "register"
          ? name.trim()
          : email.split("@")[0].charAt(0).toUpperCase() +
            email.split("@")[0].slice(1);

      const authUser: AuthUser = {
        id: `usr_${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: displayName,
        createdAt: new Date().toISOString(),
      };

      setLoading(false);
      onLogin(authUser, mode === "register" ? displayName : undefined);
    }, 450);
  };

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-[#007AFF]/15 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#00F0FF]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header Branding */}
      <header className="w-full max-w-md mx-auto flex items-center justify-center pt-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#007AFF] text-black font-black flex items-center justify-center font-['Outfit'] text-lg shadow-lg shadow-[#007AFF]/25">
            0
          </div>
          <span className="text-xl font-black tracking-tight text-white font-['Outfit']">
            BASE <span className="text-[#007AFF]">0</span>
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/90 border border-zinc-800/80 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Title */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] tracking-tight">
              {mode === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
            </h1>
            <p className="text-xs text-zinc-400">
              {mode === "login"
                ? "Acesse seus treinos, pesagens e evolução diária."
                : "Comece sua jornada de evolução física e mental hoje."}
            </p>
          </div>

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
                  <span className="text-[11px] text-[#007AFF] cursor-pointer hover:underline font-mono">
                    Esqueceu?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                <span>Lembrar neste dispositivo</span>
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
                    {mode === "login" ? "Entrar na Base 0" : "Criar Minha Conta"}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>

          {/* Simple Switcher Link Below the Button */}
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

      {/* Standard Commercial Footer */}
      <footer className="w-full max-w-md mx-auto text-center z-10 py-3 space-y-1.5">
        <p className="text-[11px] text-zinc-500">
          © {new Date().getFullYear()} Base 0. Todos os direitos reservados.
        </p>
        <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-600">
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">Termos de Uso</span>
          <span>•</span>
          <span className="hover:text-zinc-400 cursor-pointer transition-colors">Política de Privacidade</span>
        </div>
      </footer>
    </div>
  );
};
