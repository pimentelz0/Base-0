import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Mic,
  Square,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Sparkles,
  Loader2,
  X,
  Volume2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { ProjectChatMessage, ProjectNote, ProjectTask } from "../../types";
import { ProjectAiService } from "../../services/projectAiService";
import { compressImage } from "../../utils/imageCompressor";

interface ProjectChatProps {
  projectName: string;
  projectDescription: string;
  notes: ProjectNote[];
  tasks?: ProjectTask[];
  messages: ProjectChatMessage[];
  onUpdateMessages: (messages: ProjectChatMessage[]) => void;
  onClearChat: () => void;
  onNewChat: () => void;
}

export const ProjectChat: React.FC<ProjectChatProps> = ({
  projectName,
  projectDescription,
  notes,
  tasks,
  messages,
  onUpdateMessages,
  onClearChat,
  onNewChat,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrlPreview, setAudioUrlPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Audio playback state for voice messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Image full preview modal
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestMessagesRef = useRef<ProjectChatMessage[]>(messages);

  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, []);

  // Summaries for AI grounding
  const notesSummary = notes
    .map((n, i) => `${i + 1}. [${n.title}]: ${n.content || ""} ${n.checklist?.map((c) => (c.done ? `[✓] ${c.text}` : `[ ] ${c.text}`)).join(", ") || ""}`)
    .join("\n");

  const tasksSummary = tasks && tasks.length > 0
    ? tasks.map((t) => (t.completed ? `[CONCLUÍDA] ${t.text}` : `[PENDENTE] ${t.text}`)).join("\n")
    : undefined;

  // Copy message text
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Audio playback handler
  const handlePlayAudio = (id: string, audioSrc: string) => {
    if (playingAudioId === id && currentAudioRef.current) {
      currentAudioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }

    const audio = new Audio(audioSrc);
    currentAudioRef.current = audio;
    setPlayingAudioId(id);

    audio.onended = () => {
      setPlayingAudioId(null);
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch((err) => {
      console.error("Audio playback error:", err);
      setPlayingAudioId(null);
    });
  };

  // Image Upload handler
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress image for fast upload and lightweight storage
      const compressed = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        mimeType: "image/jpeg",
      });
      setSelectedImage(compressed);
    } catch (err) {
      console.error("Erro ao processar imagem:", err);
      setErrorMsg("Não foi possível carregar a imagem. Tente outra foto.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Audio Recording handlers
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Seu navegador não suporta gravação de áudio no momento.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrlPreview(url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start Web Speech recognition if available for instant transcript assist
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = "pt-BR";
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              currentTranscript += event.results[i][0].transcript;
            }
            if (currentTranscript.trim()) {
              setInputValue((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
            }
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          // Ignore SpeechRecognition failure and keep audio recording
        }
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMsg("Permissão de microfone negada ou indisponível.");
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    setAudioBlob(null);
    setAudioUrlPreview(null);
    setRecordingSeconds(0);
  };

  const stopAndSaveRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
  };

  // Convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputValue).trim();
    if (!textToSend && !selectedImage && !audioBlob) return;

    setErrorMsg(null);

    let audioDataUrl: string | undefined = undefined;
    if (audioBlob) {
      try {
        audioDataUrl = await blobToBase64(audioBlob);
      } catch (e) {
        console.error("Erro ao converter áudio:", e);
      }
    }

    const userMessage: ProjectChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: textToSend || (audioDataUrl ? "🎤 [Mensagem de áudio gravada]" : "📷 [Imagem enviada]"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: selectedImage || undefined,
      audioUrl: audioDataUrl,
      audioDurationSeconds: recordingSeconds > 0 ? recordingSeconds : undefined,
    };

    const newMessages = [...messages, userMessage];
    onUpdateMessages(newMessages);

    // Clear input states
    setInputValue("");
    setSelectedImage(null);
    setAudioBlob(null);
    setAudioUrlPreview(null);
    setRecordingSeconds(0);
    setIsLoading(true);

    const modelMessageId = `msg-model-${Date.now()}`;
    const initialModelMessage: ProjectChatMessage = {
      id: modelMessageId,
      role: "model",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isStreaming: true,
    };

    const messagesWithInitialModel = [...newMessages, initialModelMessage];
    latestMessagesRef.current = messagesWithInitialModel;
    onUpdateMessages(messagesWithInitialModel);

    // Call Project AI Streaming endpoint
    await ProjectAiService.sendMessageStream({
      projectName,
      projectDescription,
      notesSummary,
      tasksSummary,
      messages: newMessages,
      onChunk: (accumulatedText) => {
        const updated = latestMessagesRef.current.map((msg) =>
          msg.id === modelMessageId ? { ...msg, content: accumulatedText, isStreaming: true } : msg
        );
        latestMessagesRef.current = updated;
        onUpdateMessages(updated);
      },
      onDone: (finalText) => {
        setIsLoading(false);
        const updated = latestMessagesRef.current.map((msg) =>
          msg.id === modelMessageId ? { ...msg, content: finalText, isStreaming: false } : msg
        );
        latestMessagesRef.current = updated;
        onUpdateMessages(updated);
      },
      onError: (err) => {
        setIsLoading(false);
        setErrorMsg(err);
        const updated = latestMessagesRef.current.map((msg) =>
          msg.id === modelMessageId
            ? {
                ...msg,
                content:
                  "Ops! Ocorreu uma oscilação na resposta do assistente do projeto. Por favor, tente enviar novamente.",
                isStreaming: false,
              }
            : msg
        );
        latestMessagesRef.current = updated;
        onUpdateMessages(updated);
      },
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-[650px] max-h-[75vh] rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden relative">
      {/* Top Header of the Chat */}
      <div className="px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#007AFF]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white truncate">
                Assistente de Projeto
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#007AFF]/10 text-[#007AFF] text-[10px] font-mono font-bold">
                IA Ativa
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              Foco: <span className="text-zinc-300 font-medium">{projectName}</span>
            </p>
          </div>
        </div>

        {/* Action icons: Novo Chat e Excluir Chat */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Novo Chat */}
          <button
            id="btn-new-project-chat"
            onClick={() => {
              if (
                messages.length === 0 ||
                confirm("Deseja abrir uma nova conversa limpa com o assistente deste projeto?")
              ) {
                onNewChat();
              }
            }}
            title="Abrir Novo Chat (Reinicia a conversa)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Chat</span>
          </button>

          {/* Excluir Chat */}
          <button
            id="btn-delete-project-chat"
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir todo o histórico de mensagens deste chat?")) {
                onClearChat();
              }
            }}
            disabled={messages.length === 0}
            title="Excluir Histórico deste Chat"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#007AFF] shadow-lg shadow-[#007AFF]/10">
              <Bot className="w-7 h-7 stroke-[1.8]" />
            </div>
            <div className="max-w-md space-y-1.5">
              <h4 className="font-bold text-base text-white">
                Copiloto do Projeto &ldquo;{projectName}&rdquo;
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Eu conheço a descrição e os objetivos deste projeto. Envie perguntas, ideias, fotos de telas/esboços ou grave mensagens de voz para planejarmos a execução.
              </p>
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md w-full pt-2">
              {[
                "Quais os primeiros passos recomendados?",
                "Crie um cronograma de 4 semanas para este projeto",
                "Quais os riscos e desafios que devo antecipar?",
                "Dê ideias para acelerar o desenvolvimento",
              ].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#007AFF]/50 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm group"
                >
                  <span className="text-[#007AFF] mr-1.5 font-bold">›</span>
                  <span>{prompt}</span>
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
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#007AFF]/20 border border-[#007AFF]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-[#007AFF]" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 ${
                    isUser
                      ? "bg-[#007AFF] text-black rounded-tr-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm"
                  }`}
                >
                  {/* Attached Image inside message */}
                  {msg.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-h-56 max-w-sm">
                      <img
                        src={msg.imageUrl}
                        alt="Anexo de projeto"
                        onClick={() => setPreviewModalImg(msg.imageUrl || null)}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}

                  {/* Audio Player inside message if voice recording */}
                  {msg.audioUrl && (
                    <div
                      className={`flex items-center gap-2.5 p-2 rounded-xl ${
                        isUser
                          ? "bg-black/15 text-black"
                          : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(msg.id, msg.audioUrl!)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isUser
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "bg-[#007AFF] text-black hover:bg-[#006fe6]"
                        }`}
                        title={playingAudioId === msg.id ? "Pausar áudio" : "Ouvir áudio"}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Mensagem de Voz</span>
                          {msg.audioDurationSeconds && (
                            <span className="font-mono text-[10px] opacity-75">
                              ({formatTimer(msg.audioDurationSeconds)})
                            </span>
                          )}
                        </div>
                        {/* Audio Wave Visual Bars */}
                        <div className="flex items-center gap-0.5 h-3 mt-1 opacity-70">
                          {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75, 35, 65, 85].map((h, idx) => (
                            <span
                              key={idx}
                              className={`w-1 rounded-full transition-all ${
                                isUser ? "bg-black" : "bg-[#007AFF]"
                              } ${playingAudioId === msg.id ? "animate-pulse" : ""}`}
                              style={{ height: `${h}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Text Content */}
                  {msg.content && (
                    <div
                      className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser ? "font-medium" : "text-zinc-200"
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}

                  {/* Footer info: time + copy button */}
                  <div
                    className={`flex items-center justify-between gap-2 pt-1 text-[10px] ${
                      isUser ? "text-black/60" : "text-zinc-500"
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className={`p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                      title="Copiar texto"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-zinc-300">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 pl-11">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#007AFF]" />
            <span>Assistente do projeto pensando...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachments Preview above input (Image or Audio preview) */}
      {(selectedImage || audioUrlPreview) && (
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-3 flex-wrap">
          {selectedImage && (
            <div className="relative group inline-block">
              <img
                src={selectedImage}
                alt="Imagem anexada"
                className="w-14 h-14 object-cover rounded-xl border border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600"
                title="Remover imagem"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {audioUrlPreview && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-zinc-200">
              <Volume2 className="w-4 h-4 text-[#007AFF]" />
              <span>Áudio pronto para envio ({formatTimer(recordingSeconds)})</span>
              <button
                type="button"
                onClick={() => {
                  setAudioBlob(null);
                  setAudioUrlPreview(null);
                  setRecordingSeconds(0);
                }}
                className="text-zinc-400 hover:text-red-400 ml-1"
                title="Descartar gravação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Recording State Bar */}
      {isRecording ? (
        <div className="p-3 bg-red-950/40 border-t border-red-800/80 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-300">Gravando áudio do projeto...</span>
            <span className="font-mono text-xs text-white font-bold bg-red-900/60 px-2 py-0.5 rounded-md">
              {formatTimer(recordingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={stopAndSaveRecording}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-600/30"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Concluir Gravação</span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Input Bar */
        <div className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-end gap-2">
          {/* File Input for Images */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Enviar foto ou imagem para o assistente"
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Voice Record Button */}
          <button
            type="button"
            onClick={startRecording}
            title="Gravar mensagem de áudio para o projeto"
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[#007AFF] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Text Input Area */}
          <textarea
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={`Conversar com a IA sobre "${projectName}"...`}
            disabled={isLoading}
            className="flex-1 max-h-32 min-h-[40px] px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#007AFF] resize-none leading-relaxed"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputValue.trim() && !selectedImage && !audioBlob)}
            title="Enviar mensagem"
            className="p-2.5 rounded-xl bg-[#007AFF] hover:bg-[#006fe6] text-black font-bold disabled:opacity-30 disabled:hover:bg-[#007AFF] transition-all cursor-pointer shrink-0 shadow-md shadow-[#007AFF]/20 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>
      )}

      {/* Modal for Full Image Preview */}
      {previewModalImg && (
        <div
          onClick={() => setPreviewModalImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={previewModalImg}
              alt="Visualização do anexo"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewModalImg(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
