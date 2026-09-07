import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialization of GoogleGenAI
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY (ou VITE_GEMINI_API_KEY) não está configurada nas variáveis de ambiente.");
  }
  return key;
}

function getGenAI() {
  const apiKey = getApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function generateWithModelFallback(ai: GoogleGenAI, params: any, customModels?: string[]) {
  // Official valid models according to @google/genai guidelines, ordered for lowest latency & fastest response
  const candidateModels = customModels && customModels.length > 0 ? customModels : [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];
  let lastErr: any;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const callParams = { ...params };
        // thinkingLevel is supported on Gemini 3 series models
        if (!model.startsWith("gemini-3") && callParams.config?.thinkingConfig) {
          const { thinkingConfig, ...restConfig } = callParams.config;
          callParams.config = restConfig;
        }

        const response = await ai.models.generateContent({
          ...callParams,
          model,
        });
        return response;
      } catch (err: any) {
        lastErr = err;
        const errStr = String(err?.message || err);
        const isTemporary =
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("429") ||
          errStr.includes("RESOURCE_EXHAUSTED");

        console.warn(
          `Tentativa com modelo ${model} (tentativa ${attempt + 1}) falhou: ${errStr}.`
        );

        if (isTemporary && attempt === 0) {
          // Breve pausa para picos de demanda antes de tentar novamente ou alternar
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr;
}

async function generateStreamWithModelFallback(ai: GoogleGenAI, params: any, customModels?: string[]) {
  const candidateModels = customModels && customModels.length > 0 ? customModels : [
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
  ];
  let lastErr: any;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const callParams = { ...params };
        if (!model.startsWith("gemini-3") && callParams.config?.thinkingConfig) {
          const { thinkingConfig, ...restConfig } = callParams.config;
          callParams.config = restConfig;
        }

        const streamResponse = await ai.models.generateContentStream({
          ...callParams,
          model,
        });
        return streamResponse;
      } catch (err: any) {
        lastErr = err;
        const errStr = String(err?.message || err);
        const isTemporary =
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("429") ||
          errStr.includes("RESOURCE_EXHAUSTED");

        console.warn(
          `Tentativa de stream com modelo ${model} (tentativa ${attempt + 1}) falhou: ${errStr}.`
        );

        if (isTemporary && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr;
}

function buildGulinhaContextPrompt(userContext: any): string {
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Base 0", version: "1.0.0" });
});

// Chat stream endpoint with Gulinha AI (Real-time typed-out response)
app.post("/api/gulinha/chat/stream", async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas." });
    }

    const ai = getGenAI();
    const contextPrompt = buildGulinhaContextPrompt(userContext);

    const contents: any[] = [];
    for (const msg of messages) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    // Set Server-Sent Events headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const streamResponse = await generateStreamWithModelFallback(ai, {
      contents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Erro no stream do Gulinha:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Erro no streaming do Gulinha: " + (error?.message || "Tente novamente mais tarde."),
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: error?.message || "Erro no streaming." })}\n\n`);
      res.end();
    }
  }
});

// Standard Chat endpoint with Gulinha AI (Fallback & Non-streaming)
app.post("/api/gulinha/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas." });
    }

    const ai = getGenAI();
    const contextPrompt = buildGulinhaContextPrompt(userContext);

    // Map conversation history
    const contents: any[] = [];
    for (const msg of messages) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    const response = await generateWithModelFallback(ai, {
      contents,
      config: {
        systemInstruction: contextPrompt,
        temperature: 0.7,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
      },
    });

    const reply = response.text || "Desculpe, não consegui processar a resposta agora. Vamos tentar de novo!";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Erro no chat do Gulinha:", error);
    return res.status(500).json({
      error: "Erro ao comunicar com o Gulinha. " + (error?.message || "Tente novamente mais tarde."),
    });
  }
});

// Meal Analysis endpoint (Text or Image)
app.post("/api/gulinha/analyze-meal", async (req, res) => {
  try {
    const { imageBase64, mimeType, description, userGoal, targetCalories } = req.body;

    if (!imageBase64 && !description) {
      return res.status(400).json({ error: "Forneça uma foto ou descrição da refeição." });
    }

    const ai = getGenAI();

    const parts: any[] = [];

    if (imageBase64) {
      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType || "image/jpeg",
        },
      });
    }

    const promptText = `
Você é o nutricionista esportivo e analisador oficial do app Base 0.
Analise detalhadamente os alimentos informados pelo usuário (via texto descritivo e/ou foto do prato).
Descrição do usuário: "${description || "Analise a imagem da refeição"}"
Objetivo do atleta: "${userGoal || "Hipertrofia / Definição"}" (Meta diária: ${targetCalories || 2000} kcal).

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
`;

    parts.push({ text: promptText });

    const mealSchemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealName: {
            type: Type.STRING,
            description: "Nome descritivo e claro da refeição (ex: Almoço: Frango Grelhado com Arroz e Feijão)",
          },
          mealType: {
            type: Type.STRING,
            description: "Tipo sugerido da refeição: 'Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Pré-Treino' ou 'Pós-Treino'",
          },
          totalCalories: {
            type: Type.NUMBER,
            description: "Total exato de calorias estimadas (kcal)",
          },
          totalProtein: {
            type: Type.NUMBER,
            description: "Total de proteínas em gramas (g)",
          },
          totalCarbs: {
            type: Type.NUMBER,
            description: "Total de carboidratos em gramas (g)",
          },
          totalFat: {
            type: Type.NUMBER,
            description: "Total de gorduras em gramas (g)",
          },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Nome do alimento" },
                portion: { type: Type.STRING, description: "Porção estimada ou informada (ex: 150g, 2 fatias, 1 concha)" },
                calories: { type: Type.NUMBER, description: "Calorias do alimento calculadas via Atwater (P*4 + C*4 + G*9)" },
                protein: { type: Type.NUMBER, description: "Proteínas do alimento em gramas" },
                carbs: { type: Type.NUMBER, description: "Carboidratos do alimento em gramas" },
                fat: { type: Type.NUMBER, description: "Gorduras do alimento em gramas" },
              },
              required: ["name", "portion", "calories", "protein", "carbs", "fat"],
            },
            description: "Lista discriminada dos alimentos",
          },
          gulinhaFeedback: {
            type: Type.STRING,
            description: "Comentário e dica motivacional/técnica do Gulinha em português sobre a refeição",
          },
        },
        required: [
          "mealName",
          "mealType",
          "totalCalories",
          "totalProtein",
          "totalCarbs",
          "totalFat",
          "items",
          "gulinhaFeedback",
        ],
      },
    };

    const response = await generateWithModelFallback(ai, {
      contents: [{ role: "user", parts }],
      config: mealSchemaConfig,
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");

    // Validação e harmonização matemática estrita (sem erros de soma ou macros divergentes)
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
        // Se as calorias informadas estiverem zeradas ou muito discrepantes da fórmula Atwater, ajusta com rigor
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

    return res.json(parsed);
  } catch (error: any) {
    console.error("Erro na análise de refeição:", error);
    return res.status(500).json({
      error: "Não foi possível analisar a refeição no momento. " + (error?.message || ""),
    });
  }
});

// Vite middleware / static files setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Base 0 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
