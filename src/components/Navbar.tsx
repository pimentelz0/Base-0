import React from "react";
import { User, ArrowLeft } from "lucide-react";
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  profile,
  canGoBack = false,
  onGoBack,
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

        {/* Right side: Pure Minimalist Blue Profile Avatar Button */}
        <div className="flex items-center">
          <button
            id="open-profile-btn"
            onClick={onOpenProfile}
            className={`w-10 h-10 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-black flex items-center justify-center transition-all shadow-md shadow-[#007AFF]/20 hover:scale-105 overflow-hidden ${
              activeTab === "profile" ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""
            }`}
            title="Conta, Perfil & Segurança"
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


