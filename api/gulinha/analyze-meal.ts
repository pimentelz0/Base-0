import { GoogleGenAI, Type } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return key;
}

async function generateWithModelFallback(ai: GoogleGenAI, params: any) {
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
  ];
  let lastErr: any;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
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
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break;
      }
    }
  }
  throw lastErr;
}

export default async function handler(req: any, res: any) {
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
    const { imageBase64, mimeType, description, userGoal, targetCalories } = req.body || {};

    if (!imageBase64 && !description) {
      return res.status(400).json({ error: "Forneça uma foto ou descrição da refeição." });
    }

    const apiKey = getApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const parts: any[] = [];

    if (imageBase64) {
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
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Erro na análise de refeição (Vercel):", error);
    return res.status(500).json({
      error: "Não foi possível analisar a refeição no momento: " + (error?.message || ""),
    });
  }
}
