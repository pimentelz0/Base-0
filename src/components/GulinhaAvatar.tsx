import React, { useState } from "react";
import { Dumbbell } from "lucide-react";

export interface GulinhaAvatarProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  isThinking?: boolean;
  isTyping?: boolean;
}

const AVATAR_SRC = "/gulinha-avatar.jpg";

export const GulinhaAvatar: React.FC<GulinhaAvatarProps> = ({
  size = "md",
  className = "",
  showStatus = false,
  isOnline = true,
  isThinking = false,
  isTyping = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: "w-5 h-5 min-w-[20px] rounded-lg",
    sm: "w-8 h-8 min-w-[32px] rounded-xl",
    md: "w-10 h-10 min-w-[40px] rounded-xl",
    lg: "w-14 h-14 min-w-[56px] rounded-2xl",
    xl: "w-20 h-20 min-w-[80px] rounded-3xl",
  }[size];

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
  }[size];

  const statusSizes = {
    xs: "w-1.5 h-1.5 -bottom-0.5 -right-0.5",
    sm: "w-2.5 h-2.5 -bottom-0.5 -right-0.5 ring-2 ring-zinc-950",
    md: "w-3 h-3 -bottom-0.5 -right-0.5 ring-2 ring-zinc-950",
    lg: "w-3.5 h-3.5 bottom-0 right-0 ring-2 ring-zinc-950",
    xl: "w-4 h-4 bottom-1 right-1 ring-4 ring-zinc-950",
  }[size];

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`${sizeClasses} overflow-hidden border border-[#007AFF]/40 bg-zinc-900 flex items-center justify-center shadow-md shadow-[#007AFF]/15 transition-transform duration-200 ${
          isThinking || isTyping ? "ring-2 ring-[#007AFF] ring-offset-1 ring-offset-black animate-pulse" : ""
        }`}
        title="Gulinha Coach IA"
      >
        {!imageError ? (
          <img
            src={AVATAR_SRC}
            alt="Gulinha Coach"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center select-none"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#007AFF] to-sky-400 flex items-center justify-center text-black font-black">
            <Dumbbell className={`${iconSizes} stroke-[2.5]`} />
          </div>
        )}
      </div>

      {/* Online / Active badge */}
      {showStatus && (
        <span
          className={`absolute rounded-full ${statusSizes} ${
            isThinking || isTyping
              ? "bg-[#007AFF] animate-ping"
              : isOnline
              ? "bg-emerald-500 animate-pulse"
              : "bg-zinc-500"
          }`}
        />
      )}
    </div>
  );
};
