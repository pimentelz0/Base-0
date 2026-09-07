import React from "react";
import { User, ArrowLeft, Sun, Moon } from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenChat: () => void;
  onOpenExport?: () => void;
  onOpenSupabase?: () => void;
  profile: UserProfile;
  isChatOpen: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  profile,
  canGoBack = false,
  onGoBack,
  theme = "dark",
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: Brand + Back Arrow */}
        <div className="flex items-center gap-3">
          {canGoBack && onGoBack && (
            <button
              id="navbar-back-btn"
              type="button"
              onClick={onGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}

          {/* Brand: BASE 0 */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab("home")}
          >
            <div className="w-10 h-10 bg-[#007AFF] rounded-full flex items-center justify-center font-black text-black text-xl shadow-lg shadow-[#007AFF]/25 transition-transform hover:scale-105">
              0
            </div>
            <span className="font-black text-2xl tracking-tighter text-white font-['Outfit',sans-serif]">
              BASE <span className="text-[#007AFF]">0</span>
            </span>
          </div>
        </div>

        {/* Right side: Theme Toggle + Pure Minimalist Blue Profile Avatar Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onToggleTheme && (
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={onToggleTheme}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer group ${
                theme === "dark"
                  ? "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white"
                  : "bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-black hover:text-zinc-900 shadow-sm"
              }`}
              title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
              aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {theme === "dark" ? (
                <Sun className="w-4.5 h-4.5 text-zinc-300 group-hover:text-white transition-colors stroke-[2]" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-black group-hover:text-zinc-900 transition-colors stroke-[2]" />
              )}
            </button>
          )}

          <button
            id="open-profile-btn"
            onClick={onOpenProfile}
            className={`w-10 h-10 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black flex items-center justify-center transition-all shadow-md shadow-[#007AFF]/20 hover:scale-105 overflow-hidden ${
              activeTab === "profile" ? "ring-2 ring-[#007AFF] ring-offset-2" : ""
            }`}
            title="Editar Perfil & Conta"
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name || "Perfil"}
                className="w-full h-full object-cover"
              />
            ) : profile.name ? (
              <span className="text-sm font-black font-['Outfit']">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};


