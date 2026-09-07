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
  activityLevel?: string;
  tmb?: number;
  get?: number;
  imc?: number;
  imcCategory?: string;
  measurements?: any;
  todayCalories?: number;
  targetCalories?: number;
  todayProtein?: number;
  targetProtein?: number;
  todayCarbs?: number;
  targetCarbs?: number;
  todayFat?: number;
  targetFat?: number;
  todayWaterMl?: number;
  targetWaterMl?: number;
  todayMealsSummary?: string;
  recentMealsHistory?: string;
  recentWeights?: string;
  weightEvolutionSummary?: string;
  workoutRoutinesSummary?: string;
  recentWorkoutLogs?: string;
  userNotesSummary?: string;
  productivitySummary?: string;
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
    // Ignore access errors in non-standard environments
  }
  return null;
}

const CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

function buildSystemPrompt(userContext?: UserFitnessContext): string {
  return `
Você é o GULINHA, mascote, mentor e parceiro de treino do aplicativo "Base 0".
Sua identidade visual é um pássaro estilo cartoon 3D, simpático, fofo, gordinho e engraçado, que usa regata azul e fita de treino, sempre animado para puxar ferro e comer bem.

RESTRIÇÃO DE ESCOPO E ACESSO (MUITO IMPORTANTE - REGRA INVIOLÁVEL):
- O Gulinha tem acesso EXCLUSIVAMENTE às informações que dizem respeito à aba GYM:
  1. Treinos (fichas, rotinas, exercícios, séries, repetições, cargas e histórico de treinos concluídos);
  2. Nutrição & Macros (calorias, proteínas, carboidratos, gorduras consumidas no dia e refeições cadastradas);
  3. Hidratação da academia (água consumida hoje vs meta);
  4. Pesagens & Evolução de peso corporal;
  5. Medidas corporais (circunferências de braço, tórax, cintura, etc.);
  6. Metas físicas e biometria pertinentes ao treino (altura, peso atual, peso alvo, objetivo de treino, TMB, GET e IMC).
- O Gulinha NÃO tem acesso a notas pessoais, anotações de estudo, tarefas de checklist da vida, senhas, finanças ou qualquer outra área fora da aba GYM do aplicativo.
- Se o usuário perguntar sobre suas anotações pessoais, estudos, tarefas diárias ou assuntos alheios à academia/dieta, responda de forma bem-humorada, carismática e descontraída: lembre que você é o mascote do GYM ("meu negócio é anilha, comida boa e descanso!") e que não tem acesso a nada fora do mundo dos treinos e nutrição da aba GYM.

DIRETRIZES DE ESTILO E PERSONALIDADE:
1. PERSONALIDADE CARISMÁTICA, GORDINHA E ENGRAÇADA:
   - Tom descontraído, animador, companheiro leal e motivador, com tiradas engraçadas sobre treino e comida limpa.
   - Escreva em Português do Brasil de forma natural e sem afetação.
2. FORMATAÇÃO LIMPA E SEM SINAIS FEIOS:
   - NUNCA use poluição de sinais como "###", "---", "===", asteriscos duplos soltos ou blocos mal formatados.
   - Use negrito de maneira elegante para destacar números e termos (ex: **80 kg**, **160g de proteína**, **4 séries de 10 a 12 reps**).
   - Parágrafos curtos, rápidos de bater o olho e ler no celular.
3. RESPOSTAS RÁPIDAS PARA SAUDAÇÕES:
   - Se o usuário mandar apenas um "oi", "e aí gulinha", "bom dia", responda com uma saudação rápida, divertida e motivadora em 1 ou 2 frases curtas, sem textões desnecessários.

DADOS EXCLUSIVOS DA ABA GYM REGISTRADOS PELO USUÁRIO:
- Atleta: ${userContext?.name || "Atleta Base 0"}
- Altura: ${userContext?.height ? `${userContext.height} cm` : "Não informada"}
- Peso Atual: ${userContext?.weight ? `${userContext.weight} kg` : "Não informado"}
- Peso Inicial: ${userContext?.startWeight ? `${userContext.startWeight} kg` : "Não informado"}
- Meta de Peso: ${userContext?.targetWeight ? `${userContext.targetWeight} kg` : "Não definida"}
- Objetivo Físico: ${userContext?.goal || "Evolução e hipertrofia/definição"}
- Nível de Atividade: ${userContext?.activityLevel || "Moderado"}
- Sexo: ${userContext?.gender || "Não especificado"} | Idade: ${userContext?.age || "Não informada"}

MÉTRICAS METABÓLICAS DA GYM:
- TMB (Gasto basal): ${userContext?.tmb ? `${userContext.tmb} kcal/dia` : "Aguardando cálculo"}
- GET (Gasto energético total diário): ${userContext?.get ? `${userContext.get} kcal/dia` : "Aguardando cálculo"}
- IMC: ${userContext?.imc ? `${userContext.imc} (${userContext.imcCategory || ""})` : "Aguardando cálculo"}

NUTRIÇÃO, MACROS E HIDRATAÇÃO (ABA GYM):
- Calorias consumidas hoje: ${userContext?.todayCalories || 0} kcal (Meta: ${userContext?.targetCalories || 2000} kcal)
- Proteínas hoje: ${userContext?.todayProtein || 0}g (Meta: ${userContext?.targetProtein || 140}g)
- Carboidratos hoje: ${userContext?.todayCarbs || 0}g (Meta: ${userContext?.targetCarbs || 250}g)
- Gorduras hoje: ${userContext?.todayFat || 0}g (Meta: ${userContext?.targetFat || 65}g)
- Refeições registradas hoje: ${userContext?.todayMealsSummary || "Nenhuma refeição registrada hoje ainda"}
- Histórico recente de refeições: ${userContext?.recentMealsHistory || "Sem refeições antigas"}
- Água hoje: ${userContext?.todayWaterMl || 0} ml (Meta: ${userContext?.targetWaterMl || 3000} ml)

PESAGEM E MEDIDAS CORPORAIS (ABA GYM):
- Histórico de Pesagens: ${userContext?.recentWeights || "Apenas peso inicial"}
- Evolução de Peso: ${userContext?.weightEvolutionSummary || "Em acompanhamento"}
- Medidas corporais: ${userContext?.measurements ? JSON.stringify(userContext.measurements) : "Nenhuma medida opcional registrada"}

TREINOS E EXERCÍCIOS (ABA GYM):
- Rotinas e Fichas de Treino: ${userContext?.workoutRoutinesSummary || "Nenhuma rotina cadastrada ainda"}
- Sessões de Treino Recentes: ${userContext?.recentWorkoutLogs || "Nenhum treino registrado ainda"}
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
   * Send messages to Gulinha AI Chat with Real-Time Streaming & Typewriter dispatch
   */
  async chatStream(
    messages: ChatMessagePayload[],
    userContext: UserFitnessContext | undefined,
    onChunk: (chunk: string, accumulated: string) => void
  ): Promise<string> {
    // 1. Try server SSE streaming endpoint first
    try {
      const res = await fetch("/api/gulinha/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userContext }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullAccumulated = "";
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
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                fullAccumulated += parsed.text;
                onChunk(parsed.text, fullAccumulated);
              }
            } catch {
              // ignore json parse error on partial chunks
            }
          }
        }

        if (fullAccumulated.trim().length > 0) {
          return fullAccumulated;
        }
      }
    } catch (serverErr) {
      console.warn("Falha no streaming do servidor, tentando fallback:", serverErr);
    }

    // 2. Fallback: call standard chat, then typewriter stream it smoothly
    const fullReply = await this.chat(messages, userContext);
    
    // Smooth simulated typewriter for fallback so the user always experiences the typing effect!
    const words = fullReply.split(/(\s+)/);
    let simulatedAccumulated = "";
    for (const word of words) {
      simulatedAccumulated += word;
      onChunk(word, simulatedAccumulated);
      await new Promise((resolve) => setTimeout(resolve, 16));
    }

    return fullReply;
  },

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

    for (const model of CANDIDATE_MODELS) {
      const modelRequestBody: any = { ...requestBody };
      if (model.startsWith("gemini-3")) {
        modelRequestBody.generationConfig = {
          ...modelRequestBody.generationConfig,
          thinkingConfig: {
            thinkingLevel: "LOW",
          },
        };
      }

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const data = await callGeminiDirectRest(clientKey, model, modelRequestBody);
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } catch (err: any) {
          const errStr = String(err?.message || err);
          const isTemporary =
            errStr.includes("503") ||
            errStr.includes("high demand") ||
            errStr.includes("429");

          console.warn(`Fallback ${model} (tentativa ${attempt + 1}) falhou no chat:`, errStr);

          if (isTemporary && attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          break;
        }
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
Você é o nutricionista esportivo e analisador oficial do app Base 0.
Analise detalhadamente os alimentos informados pelo usuário (via texto descritivo e/ou foto do prato).
Descrição do usuário: "${payload.description || "Analise a imagem da refeição"}"
Objetivo do atleta: "${payload.userGoal || "Hipertrofia / Definição"}" (Meta diária: ${payload.targetCalories || 2000} kcal).

DIRETRIZES DE PRECISÃO NUTRICIONAL E CÁLCULO DE CALORIAS:
1. TABELAS DE COMPOSIÇÃO DE REFERÊNCIA:
   - Baseie-se estritamente nas tabelas oficiais de referência: TACO (Tabela Brasileira de Composição de Alimentos / UNICAMP) e USDA FoodData Central.
   - Respeite fielmente as porções ou gramagens informadas pelo usuário (ex: "150g", "2 fatias", "1 concha", "2 ovos"). Caso o usuário não informe a gramagem, adote porções médias brasileiras reais e padrão.
2. FÓRMULA MATEMÁTICA PADRÃO (SISTEMA ATWATER):
   - Calorias de cada alimento DEVEM seguir a fórmula científica de conversão:
     Calorias (kcal) = (Proteína em gramas × 4) + (Carboidrato em gramas × 4) + (Gordura em gramas × 9)
   - Garanta que a soma das calorias e dos macros de todos os itens do prato bata com totalCalories, totalProtein, totalCarbs e totalFat.
3. COMENTÁRIO DO GULINHA:
   - Forneça uma dica rápida, motivadora e com linguagem descontraída do mascote Gulinha analisando a qualidade do prato (ex: aporte de proteínas, energia dos carbos, timing em relação ao treino).

Retorne EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "mealName": "Nome descritivo da refeição",
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
    for (const model of CANDIDATE_MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const data = await callGeminiDirectRest(clientKey, model, requestBody);
          rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawJsonText) break;
        } catch (err: any) {
          const errStr = String(err?.message || err);
          const isTemporary =
            errStr.includes("503") ||
            errStr.includes("high demand") ||
            errStr.includes("429");

          console.warn(`Fallback ${model} (tentativa ${attempt + 1}) falhou na refeição:`, errStr);

          if (isTemporary && attempt === 0) {
            await new Promise((r) => setTimeout(r, 600));
            continue;
          }
          break;
        }
      }
      if (rawJsonText) break;
    }

    if (!rawJsonText) {
      throw new Error("Não foi possível gerar a análise da refeição.");
    }

    const cleaned = rawJsonText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AnalyzedMealResult;

    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      let sumP = 0;
      let sumC = 0;
      let sumF = 0;
      let sumKcal = 0;

      parsed.items = parsed.items.map((item: any) => {
        const p = Math.max(0, Math.round(Number(item.protein) || 0));
        const c = Math.max(0, Math.round(Number(item.carbs) || 0));
        const f = Math.max(0, Math.round(Number(item.fat) || 0));
        const atwaterKcal = Math.round(p * 4 + c * 4 + f * 9);
        const givenKcal = Number(item.calories) || 0;
        const itemKcal = givenKcal > 0 && Math.abs(givenKcal - atwaterKcal) <= Math.max(15, atwaterKcal * 0.15)
          ? Math.round(givenKcal)
          : atwaterKcal;

        sumP += p;
        sumC += c;
        sumF += f;
        sumKcal += itemKcal;

        return {
          name: String(item.name || "Alimento").trim(),
          portion: String(item.portion || "1 porção").trim(),
          calories: itemKcal,
          protein: p,
          carbs: c,
          fat: f,
        };
      });

      parsed.totalProtein = sumP;
      parsed.totalCarbs = sumC;
      parsed.totalFat = sumF;
      parsed.totalCalories = sumKcal;
    }

    return parsed;
  },
};
