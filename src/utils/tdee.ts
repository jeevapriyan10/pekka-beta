/**
 * TDEE & Macro Calculations using Mifflin-St Jeor formula
 */

export interface TDEEInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  activityLevel: string;
  goal: string;
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  'Sedentary': 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
  'Extra Active': 1.9,
};

const GOAL_MODIFIERS: Record<string, number> = {
  'Lose Fat': -500,
  'Build Muscle': 300,
  'Get Stronger': 200,
  'Improve Endurance': 100,
  'Athletic Performance': 200,
  'Stay Healthy': 0,
};

const MACRO_SPLITS: Record<string, { protein: number; carbs: number; fat: number }> = {
  'Build Muscle': { protein: 0.30, carbs: 0.45, fat: 0.25 },
  'Lose Fat': { protein: 0.40, carbs: 0.35, fat: 0.25 },
  'Get Stronger': { protein: 0.35, carbs: 0.40, fat: 0.25 },
  'Athletic Performance': { protein: 0.35, carbs: 0.40, fat: 0.25 },
  'Improve Endurance': { protein: 0.25, carbs: 0.55, fat: 0.20 },
  'Stay Healthy': { protein: 0.25, carbs: 0.50, fat: 0.25 },
};

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: string): number {
  // Mifflin-St Jeor: Men: (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
  // Women: same − 161
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (sex === 'Female') {
    return base - 161;
  }
  return base + 5; // Male and Other use male formula
}

export function calculateTDEE(input: TDEEInput): number {
  const bmr = calculateBMR(input.weightKg, input.heightCm, input.age, input.sex);
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] || 1.55;
  const tdee = bmr * multiplier;
  return Math.round(tdee);
}

export function calculateCalorieTarget(input: TDEEInput): number {
  const tdee = calculateTDEE(input);
  const modifier = GOAL_MODIFIERS[input.goal] || 0;
  return Math.round(tdee + modifier);
}

export function calculateMacros(calories: number, goal: string): MacroTargets {
  const split = MACRO_SPLITS[goal] || MACRO_SPLITS['Stay Healthy'];

  const proteinCals = calories * split.protein;
  const carbsCals = calories * split.carbs;
  const fatCals = calories * split.fat;

  return {
    calories: Math.round(calories),
    proteinG: Math.round(proteinCals / 4), // 4 cal per gram protein
    carbsG: Math.round(carbsCals / 4),     // 4 cal per gram carbs
    fatG: Math.round(fatCals / 9),         // 9 cal per gram fat
    proteinPct: Math.round(split.protein * 100),
    carbsPct: Math.round(split.carbs * 100),
    fatPct: Math.round(split.fat * 100),
  };
}

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
