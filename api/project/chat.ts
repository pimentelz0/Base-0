import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return key;
}

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

function formatProjectMessagesToContents(messages: any[]): any[] {
  const contents: any[] = [];

  for (const msg of messages) {
    const parts: any[] = [];

    // Attach Image if present
    if (msg.imageUrl && typeof msg.imageUrl === "string") {
      const match = msg.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1] || "image/jpeg",
            data: match[2],
          },
        });
      } else if (!msg.imageUrl.startsWith("http")) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: msg.imageUrl,
          },
        });
      }
    }

    // Attach Audio if present
    if (msg.audioUrl && typeof msg.audioUrl === "string") {
      const match = msg.audioUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1] || msg.audioMimeType || "audio/webm",
            data: match[2],
          },
        });
      } else if (!msg.audioUrl.startsWith("http")) {
        parts.push({
          inlineData: {
            mimeType: msg.audioMimeType || "audio/webm",
            data: msg.audioUrl,
          },
        });
      }
    }

    // Text content
    const textContent = (msg.content || "").trim();
    if (textContent) {
      parts.push({ text: textContent });
    } else if (parts.length === 0) {
      parts.push({ text: "Analise esta informação sobre o projeto." });
    }

    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts,
    });
  }

  return contents;
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const { projectName, projectDescription, notesSummary, tasksSummary, messages } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas." });
    }

    const apiKey = getApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const systemPrompt = buildProjectAssistantPrompt(
      projectName,
      projectDescription,
      notesSummary,
      tasksSummary
    );

    const contents = formatProjectMessagesToContents(messages);

    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let lastErr: any;
    let reply = "";

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });
        reply = response.text || "";
        if (reply) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Tentativa com ${model} em /api/project/chat falhou:`, err?.message || err);
      }
    }

    if (!reply && lastErr) {
      throw lastErr;
    }

    return res.status(200).json({
      reply: reply || "Não foi possível formular uma resposta agora para o projeto. Vamos tentar de novo!",
    });
  } catch (error: any) {
    console.error("Erro no chat do Assistente de Projetos (Vercel):", error);
    return res.status(500).json({
      error: "Erro ao comunicar com o Assistente de Projetos: " + (error?.message || "Tente novamente mais tarde."),
    });
  }
}
