import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
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

async function generateWithModelFallback(ai: GoogleGenAI, params: any) {
  const candidateModels = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  let lastErr: any;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return response;
    } catch (err: any) {
      lastErr = err;
      console.warn(`Tentativa com modelo ${model} falhou: ${err?.message || err}. Tentando próximo modelo...`);
    }
  }
  throw lastErr;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Base 0", version: "1.0.0" });
});

// Chat endpoint with Gulinha AI
app.post("/api/gulinha/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas." });
    }

    const ai = getGenAI();

    // Prepare system instructions with gym context
    const contextPrompt = `
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
Analise esta refeição minuciosamente para o app de fitness Base 0.
Descrição adicional fornecida pelo usuário: "${description || "Analise a imagem da refeição"}"
Objetivo do usuário: "${userGoal || "Hipertrofia / Definição"}" (Meta diária: ${targetCalories || 2000} kcal).

Identifique todos os alimentos visíveis/descritos, estime o peso em gramas com bom senso nutricional e calcule calorias, proteínas, carboidratos e gorduras.
Forneça um nome atraente para a refeição, a lista discriminada de itens e uma dica rápida e motivadora do Gulinha sobre essa refeição.
`;

    parts.push({ text: promptText });

    const mealSchemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mealName: {
            type: Type.STRING,
            description: "Nome descritivo e claro da refeição (ex: Almoço: Frango Grelhado com Arroz e Salada)",
          },
          mealType: {
            type: Type.STRING,
            description: "Tipo sugerido da refeição: 'Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Pré-Treino' ou 'Pós-Treino'",
          },
          totalCalories: {
            type: Type.NUMBER,
            description: "Total de calorias estimadas (kcal)",
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
                portion: { type: Type.STRING, description: "Porção estimada (ex: 150g, 2 unidades, 1 colher)" },
                calories: { type: Type.NUMBER, description: "Calorias do item" },
                protein: { type: Type.NUMBER, description: "Proteínas do item em gramas" },
                carbs: { type: Type.NUMBER, description: "Carboidratos do item em gramas" },
                fat: { type: Type.NUMBER, description: "Gorduras do item em gramas" },
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
