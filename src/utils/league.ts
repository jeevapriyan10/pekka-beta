/**
 * League Placement Logic
 * Rule-based scoring to place user in a league tier
 */

export interface LeagueResult {
  league: string;
  emoji: string;
  color: string;
  xp: number;
  score: number;
  reasons: string[];
}

export interface LeagueInput {
  experienceYears: string;
  trainingFrequency: string;
  goal: string;
  activityLevel: string;
  weightKg: number;
  benchPR?: number;
  squatPR?: number;
  deadliftPR?: number;
}

const EXPERIENCE_SCORES: Record<string, number> = {
  '< 1 year': 0,
  '1 year': 200,
  '2 years': 400,
  '3–4 years': 700,
  '5+ years': 1000,
  '10+ years': 1500,
};

const FREQUENCY_SCORES: Record<string, number> = {
  '1–2×/week': 0,
  '3×/week': 100,
  '4×/week': 200,
  '5×/week': 300,
  '6–7×/week': 400,
};

const GOAL_SCORES: Record<string, number> = {
  'Get Stronger': 200,
  'Athletic Performance': 200,
  'Build Muscle': 150,
  'Improve Endurance': 100,
  'Lose Fat': 50,
  'Stay Healthy': 50,
};

const ACTIVITY_SCORES: Record<string, number> = {
  'Sedentary': 0,
  'Lightly Active': 50,
  'Moderately Active': 100,
  'Very Active': 200,
  'Extra Active': 300,
};

interface LeagueTier {
  name: string;
  emoji: string;
  color: string;
  minScore: number;
}

const LEAGUE_TIERS: LeagueTier[] = [
  { name: 'Legend', emoji: '🥇', color: '#FFD700', minScore: 22000 },
  { name: 'Champion', emoji: '🛡️', color: '#a29bfe', minScore: 13000 },
  { name: 'Athlete', emoji: '🏃', color: '#00d4ff', minScore: 7000 },
  { name: 'Fighter', emoji: '🥊', color: '#b0c4d8', minScore: 3000 },
  { name: 'Warrior', emoji: '⚒️', color: '#cd7f32', minScore: 1000 },
  { name: 'Rookie', emoji: '🪨', color: '#8899bb', minScore: 0 },
];

export function computeLeague(input: LeagueInput): LeagueResult {
  let score = 0;
  const reasons: string[] = [];

  // Experience scoring
  const expScore = EXPERIENCE_SCORES[input.experienceYears] || 0;
  score += expScore;
  if (expScore > 0) {
    reasons.push(`${input.experienceYears} of training experience (+${expScore} XP)`);
  }

  // Frequency scoring
  const freqScore = FREQUENCY_SCORES[input.trainingFrequency] || 0;
  score += freqScore;
  if (freqScore > 0) {
    reasons.push(`Training ${input.trainingFrequency} shows dedication (+${freqScore} XP)`);
  }

  // Goal bonus
  const goalScore = GOAL_SCORES[input.goal] || 50;
  score += goalScore;

  // Activity level
  const activityScore = ACTIVITY_SCORES[input.activityLevel] || 0;
  score += activityScore;
  if (activityScore >= 100) {
    reasons.push(`${input.activityLevel} lifestyle indicates high fitness base (+${activityScore} XP)`);
  }

  // PR scoring
  if (input.benchPR && input.weightKg > 0) {
    const benchRatio = input.benchPR / input.weightKg;
    if (benchRatio >= 1.5) {
      score += 400;
      reasons.push(`Bench press at ${benchRatio.toFixed(1)}× bodyweight — elite strength (+400 XP)`);
    } else if (benchRatio >= 1.0) {
      score += 200;
      reasons.push(`Bench press at ${benchRatio.toFixed(1)}× bodyweight — strong (+200 XP)`);
    } else if (benchRatio >= 0.75) {
      score += 100;
      reasons.push(`Bench press at ${benchRatio.toFixed(1)}× bodyweight — solid foundation (+100 XP)`);
    }
  }

  if (input.squatPR && input.weightKg > 0) {
    const squatRatio = input.squatPR / input.weightKg;
    if (squatRatio >= 2.0) {
      score += 400;
    } else if (squatRatio >= 1.5) {
      score += 200;
    } else if (squatRatio >= 1.0) {
      score += 100;
    }
  }

  if (input.deadliftPR && input.weightKg > 0) {
    const dlRatio = input.deadliftPR / input.weightKg;
    if (dlRatio >= 2.5) {
      score += 400;
    } else if (dlRatio >= 2.0) {
      score += 200;
    } else if (dlRatio >= 1.5) {
      score += 100;
    }
  }

  // Slight generous multiplier
  score = Math.round(score * 1.1);

  // Determine league
  let league = LEAGUE_TIERS[LEAGUE_TIERS.length - 1]; // Default: Rookie
  for (const tier of LEAGUE_TIERS) {
    if (score >= tier.minScore) {
      league = tier;
      break;
    }
  }

  // Ensure at least 3 reasons
  if (reasons.length < 3) {
    if (input.goal) {
      reasons.push(`Goal: "${input.goal}" aligns with ${league.name} tier ambitions`);
    }
    if (reasons.length < 3) {
      reasons.push(`Starting as ${league.name} with room to climb the ranks!`);
    }
    if (reasons.length < 3) {
      reasons.push(`Every champion started somewhere — your journey begins now`);
    }
  }

  return {
    league: league.name,
    emoji: league.emoji,
    color: league.color,
    xp: score,
    score,
    reasons: reasons.slice(0, 3),
  };
}
