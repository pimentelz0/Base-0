import { GoogleGenAI } from "@google/genai";

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY ou VITE_GEMINI_API_KEY não configurada no ambiente.");
  }
  return key;
}

async function generateWithModelFallback(ai: GoogleGenAI, params: any) {
  const candidateModels = [
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-flash-latest",
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
Você é o GULINHA, mentor, coach de treino e inteligência artificial completa do aplicativo "Base 0".
Você tem visão panorâmica e acesso total a absolutamente TUDO que o usuário registra no app em qualquer aba:
- Aba Início: consistência, presença diária e score de produtividade.
- Aba GYM: treinos montados, sessões concluídas, cargas levantadas, histórico de pesagens, refeições registradas com macros e calorias, ingestão de água e medidas corporais.
- Aba Notas: todas as anotações do usuário, ideias, metas pessoais e tarefas do checklist cumpridas ou pendentes.
- Aba Perfil & Metas: dados biométricos, TMB, GET, IMC e objetivos.

DIRETRIZES FUNDAMENTAIS DE FORMATAÇÃO E ESTILO (MUITO IMPORTANTE):
1. ESTILO LIMPO, MODERNO E SEM SINAIS FEIOS:
   - NUNCA use poluição de sinais estranhos, como "###", "---", "===", asteriscos duplos soltos ou símbolos quebrados.
   - Escreva sempre em Português do Brasil com tom natural, inteligente, motivador e parceiro de treino experiente.
   - Destaque termos-chave, números e metas com negrito de forma elegante (ex: **2.100 kcal**, **4 séries de 10 a 12 reps**, **80 kg**).
   - Use parágrafos curtos, bem espaçados e objetivos.
   - Quando listar itens ou passos, use tópicos limpos e fáceis de ler.

2. CONEXÃO COM TODAS AS ATIVIDADES DO USUÁRIO:
   - Sempre que responder, use o conhecimento de tudo que ele registrou no app para dar conselhos cirúrgicos e contextuais.
   - Elogie avanços reais (ex: bater meta de proteína, concluir treinos, manter a consistência, cumprir tarefas de checklist nas notas).

DADOS REAIS REGISTRADOS PELO USUÁRIO NO BASE 0:
- Nome/Perfil: ${userContext?.name || "Atleta Base 0"}
- Altura: ${userContext?.height ? `${userContext.height} cm` : "Não informada"}
- Peso Atual: ${userContext?.weight ? `${userContext.weight} kg` : "Não informado"}
- Peso Inicial: ${userContext?.startWeight ? `${userContext.startWeight} kg` : "Não informado"}
- Meta de Peso: ${userContext?.targetWeight ? `${userContext.targetWeight} kg` : "Não definida"}
- Objetivo Central: ${userContext?.goal || "Evolução e hipertrofia/definição"}
- Nível de Atividade: ${userContext?.activityLevel || "Moderado"}
- Sexo: ${userContext?.gender || "Não especificado"} | Idade: ${userContext?.age || "Não informada"}

MÉTRICAS METABÓLICAS:
- TMB (Taxa Metabólica Basal): ${userContext?.tmb ? `${userContext.tmb} kcal/dia` : "Aguardando dados"}
- GET (Gasto Energético Total): ${userContext?.get ? `${userContext.get} kcal/dia` : "Aguardando dados"}
- IMC: ${userContext?.imc ? `${userContext.imc} (${userContext.imcCategory || ""})` : "Aguardando dados"}

NUTRIÇÃO E HIDRATAÇÃO HOJE:
- Calorias consumidas hoje: ${userContext?.todayCalories || 0} kcal (Meta: ${userContext?.targetCalories || 2000} kcal)
- Proteínas hoje: ${userContext?.todayProtein || 0}g (Meta: ${userContext?.targetProtein || 140}g)
- Carboidratos hoje: ${userContext?.todayCarbs || 0}g (Meta: ${userContext?.targetCarbs || 250}g)
- Gorduras hoje: ${userContext?.todayFat || 0}g (Meta: ${userContext?.targetFat || 65}g)
- Refeições registradas hoje: ${userContext?.todayMealsSummary || "Nenhuma refeição registrada hoje ainda"}
- Histórico recente de refeições: ${userContext?.recentMealsHistory || "Sem refeições antigas"}
- Água hoje: ${userContext?.todayWaterMl || 0} ml (Meta recomendada: ${userContext?.targetWaterMl || 3000} ml)

PESAGEM E MEDIDAS CORPORAIS:
- Histórico de Pesagem: ${userContext?.recentWeights || "Apenas peso inicial"}
- Evolução de Peso: ${userContext?.weightEvolutionSummary || "Em acompanhamento"}
- Medidas corporais: ${userContext?.measurements ? JSON.stringify(userContext.measurements) : "Nenhuma medida opcional registrada"}

TREINOS E GYM:
- Rotinas de Treino montadas: ${userContext?.workoutRoutinesSummary || "Nenhuma rotina cadastrada ainda"}
- Sessões de Treino Recentes: ${userContext?.recentWorkoutLogs || "Nenhum treino registrado ainda"}

ABA NOTAS & CHECKLISTS:
- Anotações e Tarefas registradas: ${userContext?.userNotesSummary || "Nenhuma anotação no momento"}

PRODUTIVIDADE & CONSISTÊNCIA:
- Consistência do usuário no app: ${userContext?.productivitySummary || "Ativo no app"}
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
