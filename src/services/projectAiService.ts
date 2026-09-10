import { ProjectChatMessage } from "../types";

export interface SendProjectMessageParams {
  projectName: string;
  projectDescription: string;
  notesSummary?: string;
  tasksSummary?: string;
  messages: ProjectChatMessage[];
  onChunk: (accumulatedText: string) => void;
  onDone: (finalText: string) => void;
  onError: (error: string) => void;
}

export const ProjectAiService = {
  async sendMessageStream(params: SendProjectMessageParams): Promise<void> {
    const {
      projectName,
      projectDescription,
      notesSummary,
      tasksSummary,
      messages,
      onChunk,
      onDone,
      onError,
    } = params;

    try {
      const response = await fetch("/api/project/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          projectDescription,
          notesSummary,
          tasksSummary,
          messages,
        }),
      });

      if (!response.ok) {
        // Tentar fallback não-stream se a rota de stream der erro
        const fallbackRes = await fetch("/api/project/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName,
            projectDescription,
            notesSummary,
            tasksSummary,
            messages,
          }),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.error || `Erro HTTP ${response.status}`);
        }

        const data = await fallbackRes.json();
        const reply = data.reply || "Resposta recebida.";
        onChunk(reply);
        onDone(reply);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Não foi possível inicializar a leitura do stream.");
      }

      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.text) {
              accumulated += parsed.text;
              onChunk(accumulated);
            }
          } catch (e) {
            // Se não for JSON válido, continua
          }
        }
      }

      onDone(accumulated || "Tudo certo! Como mais posso ajudar com este projeto?");
    } catch (err: any) {
      console.error("ProjectAiService error:", err);
      onError(err.message || "Erro de conexão com o assistente do projeto.");
    }
  },
};
