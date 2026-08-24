import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, RotateCcw, User, Dumbbell, Zap, HelpCircle, Loader2, ArrowRight } from "lucide-react";
import { ChatMessage, UserProfile, CalculatedMetrics, MealLog } from "../types";

interface GulinhaChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat: () => void;
  profile: UserProfile;
  metrics: CalculatedMetrics;
  todayMeals: MealLog[];
  isFloating?: boolean;
}

const QUICK_PROMPTS = [
  "Analise minhas calorias e macros de hoje",
  "Como quebrar meu platô de peso?",
  "Sugestão de refeição pós-treino proteica",
  "Explique como minha TMB e GET foram calculados",
  "Dicas para não perder massa muscular em cutting",
];

export const GulinhaChat: React.FC<GulinhaChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onClearChat,
  profile,
  metrics,
  todayMeals,
  isFloating = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen && isFloating) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setInputText("");
    setIsLoading(true);

    try {
      await onSendMessage(text);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col bg-black border border-zinc-800/80 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ${
        isFloating
          ? "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[450px] h-[620px] max-h-[85vh] z-50 shadow-[#007AFF]/10 border-zinc-800"
          : "w-full h-[620px]"
      }`}
    >
      {/* Chat Header */}
      <div className="px-6 py-4 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-black font-black shadow-md shadow-[#007AFF]/20">
            <Bot className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-white tracking-tight font-['Outfit',sans-serif]">
                Gulinha IA
              </h3>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              {profile.currentWeight}kg • TMB {metrics.tmb} kcal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onClearChat}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
            title="Reiniciar conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {isFloating && (
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-xl transition-colors"
              title="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-2 overflow-x-auto text-xs whitespace-nowrap">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#007AFF]" />
          Sugestões:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-[#007AFF] hover:border-[#007AFF]/40 transition-colors text-[11px] font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-black flex flex-col">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#007AFF] text-black font-semibold p-4 rounded-2xl rounded-br-none max-w-[85%] shadow-md shadow-[#007AFF]/15"
                    : "bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl rounded-bl-none max-w-[90%] text-zinc-300"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>
              </div>
              <span
                className={`text-[9px] mt-1 font-mono px-1 ${
                  isUser ? "text-zinc-500" : "text-zinc-600"
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl rounded-bl-none max-w-[80%]">
            <Loader2 className="w-4 h-4 animate-spin text-[#007AFF]" />
            <span className="text-xs font-bold text-zinc-400 font-mono">Gulinha calculando resposta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Rounded-full Pill matching Design snippet */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-zinc-950 border-t border-zinc-900"
      >
        <div className="bg-zinc-900 rounded-full px-4 py-2.5 flex items-center justify-between border border-zinc-800 focus-within:border-[#007AFF]/60 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao Gulinha sobre treino, macros, platô..."
            className="bg-transparent text-white text-xs placeholder:text-zinc-500 focus:outline-none w-full pr-3 font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-8 h-8 rounded-full bg-[#007AFF] hover:bg-[#006ee0] disabled:opacity-40 text-black flex items-center justify-center shrink-0 transition-all font-bold"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </form>
    </div>
  );
};
