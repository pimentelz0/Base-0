import { UserProfile, CalculatedMetrics, ActivityLevel, FitnessGoal } from "../types";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentary: { label: "Sedentário", desc: "Pouco ou nenhum exercício físico formal" },
  light: { label: "Levemente Ativo", desc: "Exercícios leves 1 a 3 dias por semana" },
  moderate: { label: "Moderadamente Ativo", desc: "Treinos moderados 3 a 5 dias por semana" },
  active: { label: "Muito Ativo", desc: "Treinos intensos 6 a 7 dias por semana" },
  very_active: { label: "Extremamente Ativo", desc: "Atleta ou treinos pesados diários 2x/dia" },
};

export const GOAL_LABELS: Record<FitnessGoal, { label: string; desc: string; calorieDelta: number }> = {
  lose_fat: { label: "Definição / Queima de Gordura", desc: "Déficit calórico controlado com preservação de massa", calorieDelta: -450 },
  maintain: { label: "Manutenção & Performance", desc: "Calorias em equilíbrio para máxima performance e saúde", calorieDelta: 0 },
  build_muscle: { label: "Hipertrofia / Ganho de Massa", desc: "Superávit calórico limpo para construção muscular", calorieDelta: 350 },
  recomposition: { label: "Recomposição Corporal", desc: "Troca de gordura por massa muscular simultaneamente", calorieDelta: -150 },
};

export function calculateMetrics(profile: Partial<UserProfile>): CalculatedMetrics {
  const weight = profile.currentWeight || 70;
  const height = profile.height || 175;
  const age = profile.age || 25;
  const gender = profile.gender || "male";
  const activityLevel = profile.activityLevel || "moderate";
  const goal = profile.goal || "lose_fat";

  // Height in meters
  const heightM = height / 100;

  // IMC = weight / (height in m)^2
  const imcRaw = weight / (heightM * heightM);
  const imc = Math.round(imcRaw * 10) / 10;

  let imcCategory = "Peso Saudável";
  let imcColor = "text-emerald-400";

  if (imc < 18.5) {
    imcCategory = "Abaixo do peso";
    imcColor = "text-amber-400";
  } else if (imc <= 24.9) {
    imcCategory = "Peso Normal / Saudável";
    imcColor = "text-emerald-400";
  } else if (imc <= 29.9) {
    imcCategory = "Sobrepeso";
    imcColor = "text-amber-400";
  } else if (imc <= 34.9) {
    imcCategory = "Obesidade Grau I";
    imcColor = "text-orange-500";
  } else if (imc <= 39.9) {
    imcCategory = "Obesidade Grau II";
    imcColor = "text-red-400";
  } else {
    imcCategory = "Obesidade Grau III";
    imcColor = "text-red-500";
  }

  // Healthy weight range
  const healthyWeightMin = Math.round(18.5 * heightM * heightM * 10) / 10;
  const healthyWeightMax = Math.round(24.9 * heightM * heightM * 10) / 10;

  // TMB (Mifflin-St Jeor)
  // Men: (10 * weight) + (6.25 * height) - (5 * age) + 5
  // Women: (10 * weight) + (6.25 * height) - (5 * age) - 161
  let tmbRaw = 10 * weight + 6.25 * height - 5 * age;
  if (gender === "male") {
    tmbRaw += 5;
  } else {
    tmbRaw -= 161;
  }
  const tmb = Math.round(tmbRaw);

  // GET (Gasto Energético Total)
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  const get = Math.round(tmb * multiplier);

  // Calorie Target based on goal
  const delta = GOAL_LABELS[goal]?.calorieDelta || 0;
  const targetCalories = Math.max(1200, get + delta);

  // Macro Targets
  // Protein: ~2.0g per kg for muscle building/cutting
  let proteinFactor = 2.0;
  if (goal === "lose_fat") proteinFactor = 2.2;
  if (goal === "build_muscle") proteinFactor = 2.0;
  if (goal === "maintain") proteinFactor = 1.8;

  const targetProtein = Math.round(weight * proteinFactor);
  
  // Fat: 0.9g per kg
  const targetFat = Math.round(weight * 0.9);

  // Carbs: Remaining calories / 4
  const caloriesFromProteinAndFat = targetProtein * 4 + targetFat * 9;
  const remainingCaloriesForCarbs = Math.max(200, targetCalories - caloriesFromProteinAndFat);
  const targetCarbs = Math.round(remainingCaloriesForCarbs / 4);

  // Water: 35ml to 40ml per kg
  const targetWater = Math.round(weight * 38);

  return {
    imc,
    imcCategory,
    imcColor,
    tmb,
    get,
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWater,
    healthyWeightMin,
    healthyWeightMax,
  };
}

export function formatDateBR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
