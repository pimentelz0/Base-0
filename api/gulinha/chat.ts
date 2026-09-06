import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return key;
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

export default async function handler(req: any, res: any) {
  // CORS support
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
    const { messages, userContext } = req.body || {};

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Mensagens inválidas." });
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
    return res.status(200).json({ reply });
  } catch (error: any) {
    console.error("Erro no chat do Gulinha (Vercel):", error);
    return res.status(500).json({
      error: "Erro ao comunicar com o Gulinha: " + (error?.message || "Tente novamente mais tarde."),
    });
  }
}
