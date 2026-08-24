export interface DailyInsight {
  quote: {
    text: string;
    author: string;
    eraOrSchool: string;
    reflection: string;
  };
  motivation: {
    title: string;
    message: string;
    focusWord: string;
  };
  productivityTip: {
    technique: string;
    description: string;
    actionStep: string;
    category: string;
  };
}

const PHILOSOPHER_QUOTES = [
  {
    text: "Você tem poder sobre sua mente, não sobre os acontecimentos externos. Perceba isso e você encontrará força.",
    author: "Marco Aurélio",
    eraOrSchool: "Estoicismo Romano",
    reflection: "Foque toda a sua energia apenas no que está sob o seu controle direto hoje.",
  },
  {
    text: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.",
    author: "Sêneca",
    eraOrSchool: "Estoicismo",
    reflection: "A hesitação amplia o medo. A ação imediata o dissolve.",
  },
  {
    text: "Nós somos aquilo que fazemos repetidamente. A excelência, portanto, não é um ato, mas um hábito.",
    author: "Aristóteles",
    eraOrSchool: "Filosofia Grega Antiga",
    reflection: "Grandes conquistas são construídas pelo acúmulo silencioso de pequenas rotinas.",
  },
  {
    text: "Primeiro diga a si mesmo o que você gostaria de ser; e então faça o que tem de fazer.",
    author: "Epicteto",
    eraOrSchool: "Estoicismo Grego",
    reflection: "Defina sua identidade com clareza e suas decisões diárias se tornarão óbvias.",
  },
  {
    text: "Aquele que tem um porquê para viver pode suportar quase qualquer como.",
    author: "Friedrich Nietzsche",
    eraOrSchool: "Filosofia Moderna",
    reflection: "Quando o seu propósito é inabalável, o cansaço vira apenas parte do processo.",
  },
  {
    text: "A jornada de mil milhas começa com um único passo.",
    author: "Lao Tsé",
    eraOrSchool: "Taoismo",
    reflection: "Não se sobrecarregue com o todo; apenas execute o próximo passo com perfeição.",
  },
  {
    text: "Uma vida não examinada não vale a pena ser vivida.",
    author: "Sócrates",
    eraOrSchool: "Filosofia Clássica",
    reflection: "Dedique cinco minutos do seu dia para revisar suas escolhas e aprendizados.",
  },
  {
    text: "A felicidade da sua vida depende da qualidade dos seus pensamentos.",
    author: "Marco Aurélio",
    eraOrSchool: "Meditações",
    reflection: "Monitore o seu diálogo interno como quem guarda a porta de um templo.",
  },
  {
    text: "A coragem é a primeira das qualidades humanas, porque é a qualidade que garante as outras.",
    author: "Aristóteles",
    eraOrSchool: "Ética a Nicômaco",
    reflection: "Sem a coragem de começar no desconforto, nenhum plano sai do papel.",
  },
  {
    text: "Não perca mais tempo discutindo sobre o que um bom homem deve ser. Seja um.",
    author: "Marco Aurélio",
    eraOrSchool: "Estoicismo",
    reflection: "Menos teoria, menos desculpas, mais atitude e integridade prática.",
  },
  {
    text: "A sorte é o que acontece quando a preparação encontra a oportunidade.",
    author: "Sêneca",
    eraOrSchool: "Cartas a Lucílio",
    reflection: "Treine e construa sua base hoje para estar pronto quando o momento chegar.",
  },
  {
    text: "Quem não é dono de si mesmo nunca será livre.",
    author: "Pitágoras",
    eraOrSchool: "Filosofia Pré-Socrática",
    reflection: "A verdadeira liberdade nasce da autodisciplina e do controle dos impulsos.",
  },
  {
    text: "O sábio nunca diz tudo o que pensa, mas pensa sempre tudo o que diz.",
    author: "Aristóteles",
    eraOrSchool: "Filosofia Clássica",
    reflection: "Cultive a precisão em suas palavras e a clareza em seus objetivos.",
  },
  {
    text: "Se você quer melhorar, contente-se em parecer tolo e estúpido no início.",
    author: "Epicteto",
    eraOrSchool: "Manual de Epicteto",
    reflection: "O ego odeia o aprendizado, mas a maestria exige passar pela fase de iniciante.",
  },
  {
    text: "Viver é a coisa mais rara do mundo. A maioria das pessoas apenas existe.",
    author: "Oscar Wilde",
    eraOrSchool: "Pensamento Moderno",
    reflection: "Coloque intenção e intensidade em cada bloco do seu dia.",
  },
];

const DAILY_MOTIVATIONS = [
  {
    title: "Consistência Acima da Intensidade",
    message: "Não busque a perfeição em um único dia. Busque a disciplina inegociável de aparecer todos os dias, mesmo nos dias em que a motivação faltar.",
    focusWord: "Disciplina",
  },
  {
    title: "O Poder da Concentração Única",
    message: "Quando você divide seu foco, multiplica seu cansaço. Escolha uma única prioridade crítica para a próxima hora e execute sem distrações.",
    focusWord: "Foco Puro",
  },
  {
    title: "Construindo a Sua Própria Sorte",
    message: "A confiança não surge do nada; ela é o resultado direto de cumprir as pequenas promessas que você faz a si mesmo no início de cada manhã.",
    focusWord: "Autoconfiança",
  },
  {
    title: "Domine o Desconforto Inicial",
    message: "A fricção para começar é sempre maior do que o esforço para continuar. Dê o primeiro passo de 5 minutos e o impulso cuidará do resto.",
    focusWord: "Inércia Positiva",
  },
  {
    title: "Elimine o Ruído",
    message: "Produtividade não é fazer tudo o tempo todo, é ter a clareza implacável de dizer 'não' ao que não aproxima você das suas metas essenciais.",
    focusWord: "Clareza",
  },
  {
    title: "Resiliência Diária",
    message: "Dias difíceis constroem pessoas inabaláveis. Encare cada obstáculo de hoje como um treino mental para fortalecer sua mentalidade.",
    focusWord: "Resiliência",
  },
  {
    title: "A Vitória Silenciosa",
    message: "O trabalho feito nos bastidores, quando ninguém está olhando, é exatamente o que define os seus resultados no futuro.",
    focusWord: "Execução",
  },
];

const PRODUCTIVITY_TIPS = [
  {
    technique: "Regra dos 2 Minutos",
    description: "Se uma tarefa levar menos de 2 minutos para ser concluída (responder uma mensagem rápida, guardar um objeto, registrar uma meta), faça-a imediatamente.",
    actionStep: "Identifique 3 pequenas pendências acumuladas e elimine-as em sequência agora.",
    category: "Gestão Rápida",
  },
  {
    technique: "Blocos de Trabalho Profundo (Deep Work)",
    description: "Reserve janelas de 50 a 90 minutos totalmente isoladas de notificações e redes sociais para tarefas que exigem alto esforço cognitivo.",
    actionStep: "Coloque o celular em outro cômodo durante o seu próximo bloco de foco.",
    category: "Foco Intenso",
  },
  {
    technique: "Engula o Sapo Primeiro (Eat The Frog)",
    description: "Faça a tarefa mais difícil, desconfortável ou importante na primeira hora do seu dia antes de qualquer atividade reativa.",
    actionStep: "Qual é a tarefa que você está procrastinando? Comece o dia por ela.",
    category: "Priorização",
  },
  {
    technique: "Princípio de Pareto (80/20)",
    description: "80% dos seus resultados derivam de apenas 20% dos seus esforços. Identifique quais são as ações que realmente movem o ponteiro.",
    actionStep: "Elimine ou delegue as tarefas periféricas que roubam seu tempo e entregam pouco valor.",
    category: "Eficiência",
  },
  {
    technique: "Timeboxing com Buffers",
    description: "Em vez de uma lista aberta de afazeres, agende horários fixos no calendário para cada bloco, com 10 minutos de intervalo entre eles.",
    actionStep: "Aloque horários de início e término para seus 3 objetivos principais de hoje.",
    category: "Planejamento",
  },
  {
    technique: "Fechamento Diário de 5 Minutos",
    description: "Ao final do dia, tire 5 minutos para registrar as vitórias do dia e listar as 3 prioridades absolutas para o dia seguinte.",
    actionStep: "Deixe as tarefas de amanhã prontas antes de encerrar sua noite.",
    category: "Organização",
  },
  {
    technique: "Regra dos 5 Segundos",
    description: "No momento em que sentir um impulso de agir em direção a uma meta, conte '5-4-3-2-1' e mova seu corpo fisicamente antes que o cérebro crie desculpas.",
    actionStep: "Use a contagem regressiva para sair da cama ou iniciar um treino sem hesitar.",
    category: "Ação Imediata",
  },
];

/**
 * Returns deterministic daily insights based on date (day of year + year)
 * so every single day gets a fresh unique combination that changes automatically.
 */
export function getDailyInsights(date: Date = new Date()): DailyInsight {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const yearOffset = date.getFullYear() * 365;
  const seed = dayOfYear + yearOffset;

  const quoteIndex = (seed * 7 + 3) % PHILOSOPHER_QUOTES.length;
  const motivationIndex = (seed * 11 + 5) % DAILY_MOTIVATIONS.length;
  const tipIndex = (seed * 13 + 7) % PRODUCTIVITY_TIPS.length;

  return {
    quote: PHILOSOPHER_QUOTES[quoteIndex],
    motivation: DAILY_MOTIVATIONS[motivationIndex],
    productivityTip: PRODUCTIVITY_TIPS[tipIndex],
  };
}
