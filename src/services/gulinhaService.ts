/**
 * Gulinha AI Service
 * Supports:
 * 1. Primary: Server-side API endpoint (/api/gulinha/chat and /api/gulinha/analyze-meal)
 * 2. Secondary fallback: Direct Google Gemini API call if deployed on static Vercel host
 *    using VITE_GEMINI_API_KEY.
 */

export interface ChatMessagePayload {
  role: "user" | "model";
  content: string;
}

export interface UserFitnessContext {
  name?: string;
  height?: number;
  weight?: number;
  startWeight?: number;
  targetWeight?: number;
  goal?: string;
  gender?: string;
  age?: number;
  tmb?: number;
  get?: number;
  imc?: number;
  imcCategory?: string;
  measurements?: any;
  todayCalories?: number;
  targetCalories?: number;
  todayProtein?: number;
  targetProtein?: number;
  todayMealsSummary?: string;
  recentWeights?: string;
}

export interface AnalyzedMealResult {
  mealName: string;
  mealType: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  items: {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  gulinhaFeedback: string;
}

function getClientApiKey(): string | null {
  try {
    const key = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any)?.__ENV?.VITE_GEMINI_API_KEY;
    if (key && typeof key === "string" && key.trim().length > 10) {
      return key.trim();
    }
  } catch {
    // Ignore access errors in non-standard environments
  }
  return null;
}

function buildSystemPrompt(userContext?: UserFitnessContext): string {
  return `
Você é o GULINHA, a inteligência artificial pessoal do aplicativo "Base 0".
Você opera exclusivamente na aba GYM de desenvolvimento pessoal do usuário.
Seu perfil:
- Você é um coach fitness e nutricionista digital de alto nível: direto, motivador, empático, científico e prático.
- Seu objetivo é ajudar o usuário a alcançar a melhor versão física dele (perder gordura, ganhar massa magra, recomposição corporal, consistência nos treinos).
- Você SEMPRE responde em Português do Brasil com formatação markdown limpa (tópicos, negrito quando relevante, sem enrolação desnecessária).
- Se o usuário perguntar sobre treinos, periodização, substituição de alimentos, dúvidas sobre cálculo de TMB/IMC ou macros, responda com maestria e precisão científica.
- Mantenha o tom de um parceiro de treino experiente e sábio.

Contexto atual do Usuário:
- Nome/Perfil: ${userContext?.name || "Atleta Base 0"}
- Altura: ${userContext?.height ? `${userContext.height} cm` : "Não informada"}
- Peso Atual: ${userContext?.weight ? `${userContext.weight} kg` : "Não informado"}
- Peso Inicial: ${userContext?.startWeight ? `${userContext.startWeight} kg` : "Não informado"}
- Meta de Peso: ${userContext?.targetWeight ? `${userContext.targetWeight} kg` : "Não definida"}
- Objetivo: ${userContext?.goal || "Evolução e hipertrofia/definição"}
- Sexo: ${userContext?.gender || "Não especificado"} | Idade: ${userContext?.age || "Não informada"}
- TMB Calculada: ${userContext?.tmb ? `${userContext.tmb} kcal/dia` : "Aguardando dados"}
- GET (Gasto Diário): ${userContext?.get ? `${userContext.get} kcal/dia` : "Aguardando dados"}
- IMC: ${userContext?.imc ? `${userContext.imc} (${userContext.imcCategory || ""})` : "Aguardando dados"}
- Medidas corporais: ${userContext?.measurements ? JSON.stringify(userContext.measurements) : "Nenhuma medida opcional registrada"}
- Calorias consumidas hoje: ${userContext?.todayCalories || 0} kcal (Meta: ${userContext?.targetCalories || 2000} kcal)
- Proteínas hoje: ${userContext?.todayProtein || 0}g (Meta: ${userContext?.targetProtein || 140}g)
- Refeições registradas hoje: ${userContext?.todayMealsSummary || "Nenhuma ainda"}
- Histórico recente de peso: ${userContext?.recentWeights || "Apenas peso inicial"}
`;
}

/**
 * Fallback to direct Gemini REST API if backend endpoint is unreachable (e.g. Vercel SPA static hosting).
 */
async function callGeminiDirectRest(
  apiKey: string,
  model: string,
  body: any
): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `Erro na API Gemini (${res.status})`);
  }

  return await res.json();
}

export const GulinhaService = {
  /**
   * Send messages to Gulinha AI Chat
   */
  async chat(messages: ChatMessagePayload[], userContext?: UserFitnessContext): Promise<string> {
    // 1. Attempt server-side API first
    try {
      const res = await fetch("/api/gulinha/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userContext }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data.reply === "string") {
          return data.reply;
        }
      }
    } catch (serverErr) {
      console.warn("Falha ao comunicar com backend /api/gulinha/chat, tentando fallback:", serverErr);
    }

    // 2. Client-side fallback if VITE_GEMINI_API_KEY is available (e.g. Vercel static build)
    const clientKey = getClientApiKey();
    if (!clientKey) {
      throw new Error(
        "Não foi possível conectar ao Gulinha. Certifique-se de configurar a variável GEMINI_API_KEY ou VITE_GEMINI_API_KEY nas variáveis de ambiente da Vercel."
      );
    }

    const systemInstruction = buildSystemPrompt(userContext);
    const contents = messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const requestBody = {
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      generationConfig: {
        temperature: 0.7,
      },
    };

    const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];
    for (const model of candidateModels) {
      try {
        const data = await callGeminiDirectRest(clientKey, model, requestBody);
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err: any) {
        console.warn(`Fallback ${model} falhou no chat:`, err?.message);
      }
    }

    throw new Error("Gulinha não conseguiu formular uma resposta no momento.");
  },

  /**
   * Analyze meal photo or description
   */
  async analyzeMeal(payload: {
    imageBase64?: string;
    mimeType?: string;
    description?: string;
    userGoal?: string;
    targetCalories?: number;
  }): Promise<AnalyzedMealResult> {
    // 1. Attempt server-side API first
    try {
      const res = await fetch("/api/gulinha/analyze-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.items) {
          return data as AnalyzedMealResult;
        }
      }
    } catch (serverErr) {
      console.warn("Falha ao comunicar com backend /api/gulinha/analyze-meal, tentando fallback:", serverErr);
    }

    // 2. Client-side fallback with VITE_GEMINI_API_KEY
    const clientKey = getClientApiKey();
    if (!clientKey) {
      throw new Error(
        "Não foi possível analisar a refeição. Certifique-se de configurar a variável GEMINI_API_KEY ou VITE_GEMINI_API_KEY na Vercel."
      );
    }

    const parts: any[] = [];
    if (payload.imageBase64) {
      const cleanBase64 = payload.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: payload.mimeType || "image/jpeg",
        },
      });
    }

    const promptText = `
Analise esta refeição minuciosamente para o app de fitness Base 0.
Descrição adicional fornecida pelo usuário: "${payload.description || "Analise a imagem da refeição"}"
Objetivo do usuário: "${payload.userGoal || "Hipertrofia / Definição"}" (Meta diária: ${payload.targetCalories || 2000} kcal).

Identifique todos os alimentos visíveis/descritos, estime o peso em gramas com bom senso nutricional e calcule calorias, proteínas, carboidratos e gorduras.
Forneça um nome atraente para a refeição, a lista discriminada de itens e uma dica rápida e motivadora do Gulinha sobre essa refeição.
Retorne EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "mealName": "Nome da refeição",
  "mealType": "Café da Manhã | Almoço | Lanche | Jantar | Pré-Treino | Pós-Treino",
  "totalCalories": 500,
  "totalProtein": 40,
  "totalCarbs": 45,
  "totalFat": 12,
  "items": [
    { "name": "Frango grelhado", "portion": "150g", "calories": 240, "protein": 45, "carbs": 0, "fat": 5 }
  ],
  "gulinhaFeedback": "Comentário do coach Gulinha"
}
`;
    parts.push({ text: promptText });

    const requestBody = {
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
      },
    };

    let rawJsonText = "";
    const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];
    for (const model of candidateModels) {
      try {
        const data = await callGeminiDirectRest(clientKey, model, requestBody);
        rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawJsonText) break;
      } catch (err: any) {
        console.warn(`Fallback ${model} falhou na refeição:`, err?.message);
      }
    }

    if (!rawJsonText) {
      throw new Error("Não foi possível gerar a análise da refeição.");
    }

    const cleaned = rawJsonText.replace(/```json/gi, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned) as AnalyzedMealResult;
  },
};
