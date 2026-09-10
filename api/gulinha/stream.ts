import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return key;
}

function buildGulinhaPrompt(userContext: any): string {
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

export default async function handler(req: any, res: any) {
  // CORS support
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
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

  // SSE Stream headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (res.flushHeaders) res.flushHeaders();

  try {
    const { messages, userContext } = req.body || {};
    if (!messages || !Array.isArray(messages)) {
      res.write(`data: ${JSON.stringify({ error: "Mensagens inválidas." })}\n\n`);
      res.end();
      return;
    }

    const apiKey = getApiKey();
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const contextPrompt = buildGulinhaPrompt(userContext);
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Prioritize ultra low latency models first
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let streamResponse: any = null;
    for (const model of candidateModels) {
      try {
        streamResponse = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: contextPrompt,
            temperature: 0.7,
          },
        });
        if (streamResponse) break;
      } catch (err: any) {
        console.warn(`Tentativa com ${model} em stream falhou:`, err?.message || err);
      }
    }

    if (!streamResponse) {
      throw new Error("Não foi possível iniciar o streaming com nenhum modelo.");
    }

    for await (const chunk of streamResponse) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        if (typeof res.flush === "function") {
          res.flush();
        }
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Erro no streaming do Vercel:", error);
    res.write(`data: ${JSON.stringify({ error: error?.message || "Erro no streaming." })}\n\n`);
    res.end();
  }
}
