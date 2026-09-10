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

function getClientApiKey(): string | null {
  try {
    const metaEnv = (import.meta as any).env || {};
    const key =
      metaEnv.VITE_GEMINI_API_KEY ||
      metaEnv.GEMINI_API_KEY ||
      (typeof process !== "undefined" && (process.env?.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY)) ||
      (window as any)?.__ENV?.VITE_GEMINI_API_KEY ||
      (window as any)?.__GEMINI_API_KEY__ ||
      localStorage.getItem("base0_gemini_api_key");

    if (key && typeof key === "string" && key.trim().length > 10) {
      return key.trim();
    }
  } catch {
    // Ignore
  }
  return null;
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

function buildProjectAssistantPrompt(
  projectName: string,
  projectDescription: string,
  notesSummary?: string,
  tasksSummary?: string
): string {
  return `
Você é o ASSISTENTE ESPECIALISTA DE PROJETOS do aplicativo Base 0.
Você é o consultor estratégico, copiloto e parceiro de execução dedicado EXCLUSIVAMENTE ao seguinte projeto:

📋 FICHA DO PROJETO:
- NOME DO PROJETO: "${projectName || "Projeto Sem Título"}"
- DESCRIÇÃO E ESCOPO:
"${projectDescription || "Sem descrição fornecida ainda."}"
${notesSummary ? `\n📝 ANOTAÇÕES E NOTAS DO PROJETO:\n${notesSummary}\n` : ""}
${tasksSummary ? `\n✅ TAREFAS / METAS CADASTRADAS NO PROJETO:\n${tasksSummary}\n` : ""}

DIRETRIZES DO ASSISTENTE DE PROJETO:
1. FOCO NO PROJETO:
   - Todo o seu diálogo deve considerar o contexto, objetivos, desafios e escopo descritos acima.
   - Ajude o usuário a debater ideias, montar planos de ação, criar cronogramas, escrever textos, debugar problemas, organizar tarefas e tomar decisões assertivas.
2. MULTIMODALIDADE (ÁUDIO E IMAGEM):
   - Se o usuário enviou uma gravação de áudio ou imagem (mockups, rascunhos, telas, documentos), analise minuciosamente o conteúdo visual ou falado e conecte-o diretamente aos objetivos do projeto.
3. ESTILO DE COMUNICAÇÃO:
   - Português brasileiro claro, dinâmico, profissional e motivador.
   - Use formatação limpa: **negrito** para termos-chave, parágrafos concisos e listas com marcadores para passos práticos.
   - Evite enrolação; seja prático, inteligente e proponha soluções de alto impacto.
`;
}

function formatMessagesForClientRest(messages: ProjectChatMessage[]): any[] {
  return messages.map((m) => {
    const parts: any[] = [];

    if (m.imageUrl) {
      const match = m.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1] || "image/jpeg",
            data: match[2],
          },
        });
      }
    }

    if (m.audioUrl) {
      const match = m.audioUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1] || m.audioMimeType || "audio/webm",
            data: match[2],
          },
        });
      }
    }

    const text = (m.content || "").trim();
    if (text) {
      parts.push({ text });
    } else if (parts.length === 0) {
      parts.push({ text: "Analise as informações enviadas." });
    }

    return {
      role: m.role === "user" ? "user" : "model",
      parts,
    };
  });
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

    // 1. Tentar primeiro o endpoint SSE de streaming do servidor
    try {
      const streamEndpoints = ["/api/project/chat/stream", "/api/project/stream"];
      let response: Response | null = null;

      for (const endpoint of streamEndpoints) {
        try {
          const res = await fetch(endpoint, {
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
          if (res.ok && res.body) {
            response = res;
            break;
          }
        } catch {
          // tentar próximo endpoint
        }
      }

      if (response && response.ok && response.body) {
        const reader = response.body.getReader();
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
            } catch {
              // Se não for JSON válido no pedaço, continua
            }
          }
        }

        if (accumulated.trim().length > 0) {
          onDone(accumulated);
          return;
        }
      }
    } catch (streamErr) {
      console.warn("Falha no stream do projeto, tentando rota padrão /api/project/chat:", streamErr);
    }

    // 2. Tentar fallback com rota POST /api/project/chat (não-stream)
    try {
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

      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const reply = data.reply || "";
        if (reply) {
          // Simula efeito de digitação suave
          const words = reply.split(/(\s+)/);
          let simulated = "";
          for (let i = 0; i < words.length; i += 2) {
            const chunk = words.slice(i, i + 2).join("");
            simulated += chunk;
            onChunk(simulated);
            await new Promise((r) => setTimeout(r, 8));
          }
          onDone(reply);
          return;
        }
      }
    } catch (chatErr) {
      console.warn("Falha na rota /api/project/chat, tentando fallback direto com Gemini:", chatErr);
    }

    // 3. Fallback client-side direto com Gemini se houver chave (Vercel static hosting ou preview)
    const clientKey = getClientApiKey();
    if (clientKey) {
      try {
        const systemInstruction = buildProjectAssistantPrompt(
          projectName,
          projectDescription,
          notesSummary,
          tasksSummary
        );
        const contents = formatMessagesForClientRest(messages);

        const requestBody = {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        };

        for (const model of CANDIDATE_MODELS) {
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${clientKey}`;
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            });

            if (res.ok) {
              const data = await res.json();
              const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (reply) {
                // Digitação suave
                const words = reply.split(/(\s+)/);
                let simulated = "";
                for (let i = 0; i < words.length; i += 2) {
                  const chunk = words.slice(i, i + 2).join("");
                  simulated += chunk;
                  onChunk(simulated);
                  await new Promise((r) => setTimeout(r, 8));
                }
                onDone(reply);
                return;
              }
            }
          } catch (modelErr) {
            console.warn(`Tentativa client-side direta com ${model} falhou:`, modelErr);
          }
        }
      } catch (clientErr: any) {
        console.error("Falha no fallback client-side:", clientErr);
      }
    }

    onError("Não foi possível conectar ao Assistente de Projetos. Verifique se o servidor está ativo ou se a chave GEMINI_API_KEY está configurada.");
  },
};
