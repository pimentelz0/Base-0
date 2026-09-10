import React, { useState, useRef, useEffect, useMemo } from "react";
import Markdown from "react-markdown";
import {
  Bot,
  Send,
  Sparkles,
  X,
  RotateCcw,
  User,
  Dumbbell,
  Zap,
  HelpCircle,
  Loader2,
  ArrowRight,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  History,
  CheckCircle2,
  ChevronRight,
  Flame,
  Scale,
} from "lucide-react";
import { ChatMessage, ChatSession, UserProfile, CalculatedMetrics, MealLog } from "../types";
import { GulinhaAvatar } from "./GulinhaAvatar";

interface GulinhaChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearChat?: () => void;
  profile: UserProfile;
  metrics: CalculatedMetrics;
  todayMeals?: MealLog[];
  isFloating?: boolean;
  // Multi-session management (like ChatGPT)
  sessions?: ChatSession[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onClearAllSessions?: () => void;
}

const QUICK_PROMPTS = [
  "Analise minhas calorias e macros de hoje",
  "O que você acha do meu treino e cargas?",
  "Como progredir carga nos meus exercícios?",
  "Sugestão de refeição pós-treino proteica",
  "Como acelerar meus resultados no físico?",
  "Explique minha TMB e meta de calorias",
];

/**
 * Cleans any raw markdown artifacts that might look visually ugly
 */
function cleanBotContent(content: string): string {
  if (!content) return "";
  return content
    // Remove isolated markdown headers with triple hashes into clean headings
    .replace(/^###\s+/gm, "### ")
    .replace(/^##\s+/gm, "## ")
    // Remove excessive separator lines
    .replace(/^-{3,}$/gm, "")
    .replace(/^_{3,}$/gm, "")
    // Clean weird orphaned asterisks
    .replace(/\s\*\s\*/g, " ")
    .trim();
}

export const GulinhaChat: React.FC<GulinhaChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onClearChat,
  profile,
  metrics,
  todayMeals = [],
  isFloating = false,
  sessions = [],
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllSessions,
}) => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [sessionToDeleteId, setSessionToDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      id="gulinha-chat-container"
      className={`flex flex-col bg-zinc-950 border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 relative ${
        isFloating
          ? "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[460px] h-[640px] max-h-[88vh] z-50 shadow-black/80 border-zinc-800"
          : "w-full h-[640px] border-zinc-800/80"
      }`}
    >
      {/* Top Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <GulinhaAvatar
            size="md"
            showStatus
            isThinking={isLoading}
            isTyping={messages.some((m) => m.isStreaming)}
          />

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white tracking-tight font-['Outfit',sans-serif]">
                Gulinha IA
              </h3>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#007AFF]/15 text-[#007AFF] border border-[#007AFF]/30">
                Base 0
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
              <span>{profile.currentWeight}kg</span>
              <span>•</span>
              <span>TMB {metrics.tmb} kcal</span>
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* New Chat Button */}
          {onNewChat && (
            <button
              id="gulinha-btn-new-chat"
              onClick={() => {
                onNewChat();
                setShowHistoryDrawer(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-[#007AFF]/15 hover:bg-[#007AFF] hover:text-black border border-[#007AFF]/30 rounded-xl transition-all active:scale-95"
              title="Criar nova conversa"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Novo Chat</span>
            </button>
          )}

          {/* History Drawer Toggle Button */}
          {sessions.length > 0 && (
            <button
              id="gulinha-btn-history-toggle"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className={`p-2 rounded-xl transition-all border ${
                showHistoryDrawer
                  ? "bg-[#007AFF] text-black border-[#007AFF]"
                  : "text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border-zinc-800"
              }`}
              title="Histórico de conversas salvas"
            >
              <History className="w-4 h-4" />
            </button>
          )}

          {/* Restart Single Chat Fallback */}
          {onClearChat && !onNewChat && (
            <button
              onClick={onClearChat}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
              title="Reiniciar esta conversa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Close Floating Chat */}
          {isFloating && (
            <button
              id="gulinha-btn-close-floating"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
              title="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Drawer / Slide-Over (ChatGPT-like conversation list) */}
      {showHistoryDrawer && (
        <div
          id="gulinha-history-drawer"
          className="absolute inset-0 z-30 bg-zinc-950/95 backdrop-blur-md flex flex-col p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#007AFF]" />
              <h4 className="text-sm font-black text-white font-['Outfit']">
                Histórico de Conversas
              </h4>
            </div>
            <button
              onClick={() => setShowHistoryDrawer(false)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat action inside drawer */}
          <div className="pt-3 pb-2">
            <button
              onClick={() => {
                onNewChat?.();
                setShowHistoryDrawer(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#007AFF] text-black font-black text-xs rounded-xl shadow-lg shadow-[#007AFF]/20 hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Iniciar Nova Conversa
            </button>
          </div>

          {/* List of Sessions */}
          <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const msgCount = session.messages.length;
              const lastMsg = session.messages[session.messages.length - 1];
              const dateDisplay = new Date(session.updatedAt || session.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#007AFF]/15 border-[#007AFF]/40 text-white"
                      : "bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700"
                  }`}
                  onClick={() => {
                    onSelectSession?.(session.id);
                    setShowHistoryDrawer(false);
                  }}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isActive ? "text-[#007AFF]" : "text-zinc-500 group-hover:text-zinc-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-white">
                        {session.title || "Conversa Sem Título"}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {lastMsg ? lastMsg.content.slice(0, 45) : "Nenhuma mensagem enviada"}
                      </p>
                      <p className="text-[9px] text-zinc-600 font-mono mt-1">
                        {dateDisplay} • {msgCount} {msgCount === 1 ? "mensagem" : "mensagens"}
                      </p>
                    </div>
                  </div>

                  {/* Delete Single Chat Button */}
                  {onDeleteSession && (
                    <div
                      className="shrink-0 ml-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {sessionToDeleteId === session.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-150">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(session.id);
                              setSessionToDeleteId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                            title="Confirmar exclusão"
                          >
                            Excluir
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionToDeleteId(null);
                            }}
                            className="px-1.5 py-1 text-zinc-400 hover:text-white text-[10px] rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDeleteId(session.id);
                          }}
                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir este chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Drawer Footer with Clear All */}
          {onClearAllSessions && sessions.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80 flex justify-between items-center text-xs">
              <span className="text-[11px] text-zinc-500 font-mono">
                {sessions.length} {sessions.length === 1 ? "chat salvo" : "chats salvos"}
              </span>
              {confirmClearAll ? (
                <div className="flex items-center gap-1 animate-in fade-in duration-150">
                  <span className="text-[10px] text-zinc-400">Apagar tudo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllSessions();
                      setConfirmClearAll(false);
                      setShowHistoryDrawer(false);
                    }}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded transition-colors"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="text-[10px] text-zinc-400 hover:text-white px-1"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="text-[11px] font-semibold text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpar tudo
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Suggestions Carousel */}
      <div className="px-3 py-2 bg-zinc-900/40 border-b border-zinc-900 flex items-center gap-1.5 overflow-x-auto text-xs whitespace-nowrap scrollbar-none shrink-0">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 flex items-center gap-1 pl-1">
          <Zap className="w-3 h-3 text-[#007AFF]" />
          Sugestões:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-[#007AFF]/50 hover:bg-[#007AFF]/10 transition-all text-[11px] font-medium shrink-0 active:scale-95 disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto bg-zinc-950 flex flex-col">
        {messages.length === 0 ? (
          <div className="my-auto text-center py-8 px-4 flex flex-col items-center justify-center">
            <GulinhaAvatar size="xl" className="mb-3" />
            <h4 className="text-base font-black text-white font-['Outfit'] mb-1">
              Olá, {profile.name || "Atleta"}!
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed mb-4">
              Eu sou o <strong className="text-white">Gulinha</strong>! Seu mascote e parceiro dedicado exclusivamente à aba <strong className="text-[#007AFF]">GYM</strong> (treinos, fichas, cargas, dieta, macros e pesagem). O que vamos ajustar no seu plano hoje?
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {QUICK_PROMPTS.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="text-[11px] text-zinc-300 bg-zinc-900/90 border border-zinc-800 hover:border-[#007AFF]/40 hover:text-[#007AFF] px-3 py-1.5 rounded-xl transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 text-sm animate-in fade-in-50 duration-200 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <GulinhaAvatar
                    size="sm"
                    isTyping={msg.isStreaming}
                    isThinking={isLoading && msg.isStreaming && !msg.content}
                  />
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#007AFF] text-black font-medium rounded-tr-xs shadow-md shadow-[#007AFF]/10"
                      : "bg-zinc-900 border border-zinc-800/90 text-zinc-100 rounded-tl-xs shadow-md shadow-black/40"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  ) : !msg.content && msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-300 py-1 font-medium animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#007AFF]" />
                      <span>Digitando...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-[13px] leading-relaxed break-words font-normal">
                      <Markdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0 leading-relaxed text-zinc-200">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-white drop-shadow-xs">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-zinc-300">{children}</em>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-sm font-black text-white font-['Outfit'] mt-3 mb-1.5 flex items-center gap-1.5 border-b border-zinc-800 pb-1">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xs font-black uppercase tracking-wider text-[#007AFF] mt-2.5 mb-1 font-['Outfit']">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-bold text-zinc-200 mt-2 mb-1">
                              {children}
                            </h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="my-2 space-y-1.5 pl-4 list-disc marker:text-[#007AFF] text-zinc-200">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="my-2 space-y-1.5 pl-4 list-decimal marker:text-[#007AFF] font-medium text-zinc-200">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="pl-1 leading-relaxed">{children}</li>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-[#007AFF] pl-3 py-1 my-2 bg-zinc-950/70 rounded-r-lg text-zinc-300 italic text-xs">
                              {children}
                            </blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 rounded bg-zinc-950 text-[#007AFF] font-mono text-xs border border-zinc-800">
                              {children}
                            </code>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2.5 rounded-lg border border-zinc-800">
                              <table className="min-w-full divide-y divide-zinc-800 text-xs text-left">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="px-2.5 py-1.5 bg-zinc-950 font-bold text-white text-[11px]">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-2.5 py-1.5 border-t border-zinc-800/80 text-zinc-300">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {cleanBotContent(msg.content)}
                      </Markdown>
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-3.5 ml-1 bg-[#007AFF] animate-pulse rounded-xs align-middle" />
                      )}
                    </div>
                  )}

                  {msg.isStreaming && msg.content ? (
                    <div className="flex items-center gap-1 text-[#007AFF] font-mono text-[10px] font-bold animate-pulse mt-1.5 justify-end">
                      <Sparkles className="w-3 h-3" />
                      <span>Digitando...</span>
                    </div>
                  ) : !msg.isStreaming ? (
                    <div
                      className={`text-[9px] font-mono mt-1.5 flex items-center justify-end ${
                        isUser ? "text-black/60" : "text-zinc-500"
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  ) : null}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator (Shown only when stream hasn't added message yet) */}
        {isLoading && !messages.some((m) => m.isStreaming) && (
          <div className="flex gap-3 text-sm animate-in fade-in-50 duration-200">
            <GulinhaAvatar size="sm" isThinking />
            <div className="bg-zinc-900 border border-zinc-800/90 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2 text-zinc-400 text-xs shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-[#007AFF]" />
              <span>Digitando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800/80 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="gulinha-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Gulinha sobre seus treinos, macros, notas..."
              disabled={isLoading}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all pr-10 disabled:opacity-50"
            />
            {inputText.trim() && (
              <button
                type="button"
                onClick={() => setInputText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            id="gulinha-chat-send-btn"
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#007AFF] hover:brightness-110 active:scale-95 text-black font-black flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:scale-100 shadow-md shadow-[#007AFF]/20 shrink-0"
            title="Enviar mensagem"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-zinc-500 text-center mt-2 font-mono">
          O Gulinha analisa suas refeições, treinos, água e notas em tempo real.
        </p>
      </div>
    </div>
  );
};
