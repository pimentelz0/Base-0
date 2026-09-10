import React from "react";
import { Home, Dumbbell, FolderKanban, StickyNote } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-2xl py-2 px-3 select-none"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around gap-1.5">
        {/* Tab 1: HOME / INÍCIO */}
        <button
          id="bottom-tab-home-btn"
          onClick={() => setActiveTab("home")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 group relative ${
            activeTab === "home"
              ? "text-white bg-zinc-800/80 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <div className="relative">
            <Home
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === "home" ? "text-white stroke-[2.5]" : "text-zinc-400"
              }`}
            />
            {activeTab === "home" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white/50" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase mt-1 font-['Outfit'] ${
              activeTab === "home" ? "text-white" : "text-zinc-400"
            }`}
          >
            INÍCIO
          </span>
        </button>

        {/* Tab 2: GYM */}
        <button
          id="bottom-tab-gym-btn"
          onClick={() => setActiveTab("gym")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 group relative ${
            activeTab === "gym"
              ? "text-[#007AFF] bg-[#007AFF]/10 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <div className="relative">
            <Dumbbell
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === "gym" ? "text-[#007AFF] stroke-[2.5]" : "text-zinc-400"
              }`}
            />
            {activeTab === "gym" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#007AFF] shadow-sm shadow-[#007AFF]" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase mt-1 font-['Outfit'] ${
              activeTab === "gym" ? "text-[#007AFF]" : "text-zinc-400"
            }`}
          >
            GYM
          </span>
        </button>

        {/* Tab 3: PROJETOS */}
        <button
          id="bottom-tab-projects-btn"
          onClick={() => setActiveTab("projects")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 group relative ${
            activeTab === "projects"
              ? "text-sky-400 bg-sky-500/10 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <div className="relative">
            <FolderKanban
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === "projects" ? "text-sky-400 stroke-[2.5]" : "text-zinc-400"
              }`}
            />
            {activeTab === "projects" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase mt-1 font-['Outfit'] ${
              activeTab === "projects" ? "text-sky-400" : "text-zinc-400"
            }`}
          >
            PROJETOS
          </span>
        </button>

        {/* Tab 4: NOTAS (Post-its) */}
        <button
          id="bottom-tab-notes-btn"
          onClick={() => setActiveTab("notes")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-200 group relative ${
            activeTab === "notes"
              ? "text-amber-400 bg-amber-500/10 shadow-sm"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <div className="relative">
            <StickyNote
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                activeTab === "notes"
                  ? "text-amber-400 stroke-[2.5]"
                  : "text-zinc-400"
              }`}
            />
            {activeTab === "notes" && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
            )}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase mt-1 font-['Outfit'] ${
              activeTab === "notes" ? "text-amber-400" : "text-zinc-400"
            }`}
          >
            NOTAS
          </span>
        </button>
      </div>
    </nav>
  );
};
