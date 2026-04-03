/**
 * XP granting and league update logic
 */

import { getDatabase } from '../db/database';
import { getTodayString } from './formatters';

const XP_REWARDS: Record<string, number> = {
  'workout_completed': 100,
  'cardio_logged': 50,
  'meal_logged': 25,
  'water_goal_met': 30,
  'streak_bonus': 50,
  'pr_set': 200,
  'body_measurement_logged': 40,
  'custom_food_added': 15,
  'daily_login': 10,
};

interface LeagueTier {
  name: string;
  emoji: string;
  color: string;
  minXP: number;
}

const LEAGUE_TIERS: LeagueTier[] = [
  { name: 'Legend', emoji: '🥇', color: '#FFD700', minXP: 22000 },
  { name: 'Champion', emoji: '🛡️', color: '#a29bfe', minXP: 13000 },
  { name: 'Athlete', emoji: '🏃', color: '#00d4ff', minXP: 7000 },
  { name: 'Fighter', emoji: '🥊', color: '#b0c4d8', minXP: 3000 },
  { name: 'Warrior', emoji: '⚒️', color: '#cd7f32', minXP: 1000 },
  { name: 'Rookie', emoji: '🪨', color: '#8899bb', minXP: 0 },
];

export function getXPReward(action: string): number {
  return XP_REWARDS[action] || 10;
}

export function getLeagueForXP(xp: number): LeagueTier {
  for (const tier of LEAGUE_TIERS) {
    if (xp >= tier.minXP) {
      return tier;
    }
  }
  return LEAGUE_TIERS[LEAGUE_TIERS.length - 1];
}

export function getNextLeague(currentXP: number): { tier: LeagueTier; xpNeeded: number } | null {
  const sortedTiers = [...LEAGUE_TIERS].sort((a, b) => a.minXP - b.minXP);
  for (const tier of sortedTiers) {
    if (tier.minXP > currentXP) {
      return { tier, xpNeeded: tier.minXP - currentXP };
    }
  }
  return null; // Already at max
}

export async function grantXP(action: string, customAmount?: number): Promise<{ newTotal: number; newLeague: string }> {
  try {
    const db = await getDatabase();
    const amount = customAmount || getXPReward(action);
    const today = getTodayString();

    // Log XP
    await db.runAsync(
      'INSERT INTO xp_log (amount, reason, date) VALUES (?, ?, ?)',
      [amount, action, today]
    );

    // Update user XP
    await db.runAsync(
      'UPDATE user_profile SET xp = xp + ? WHERE id = 1',
      [amount]
    );

    // Get new total
    const user = await db.getFirstAsync<{ xp: number; league: string }>(
      'SELECT xp, league FROM user_profile WHERE id = 1'
    );

    const newXP = user?.xp || 0;
    const newLeagueInfo = getLeagueForXP(newXP);

    // Update league if changed
    if (user?.league !== newLeagueInfo.name) {
      await db.runAsync(
        'UPDATE user_profile SET league = ? WHERE id = 1',
        [newLeagueInfo.name]
      );
    }

    return { newTotal: newXP, newLeague: newLeagueInfo.name };
  } catch (error) {
    console.error('Error granting XP:', error);
    return { newTotal: 0, newLeague: 'Rookie' };
  }
}

export async function getTotalXP(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ xp: number }>(
      'SELECT xp FROM user_profile WHERE id = 1'
    );
    return result?.xp || 0;
  } catch (error) {
    console.error('Error getting XP:', error);
    return 0;
  }
}
