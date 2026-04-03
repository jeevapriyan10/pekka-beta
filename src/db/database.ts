/**
 * Database initialization and CRUD operations
 * Uses expo-sqlite v14 async API exclusively
 */

import * as SQLite from 'expo-sqlite';
import { seedExercises, seedFoods } from './seed';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('pekka.db');
  await initializeTables(dbInstance);
  await seedExercises(dbInstance);
  await seedFoods(dbInstance);
  return dbInstance;
}

async function initializeTables(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY,
      name TEXT,
      username TEXT,
      email TEXT,
      dob TEXT,
      sex TEXT,
      height_cm REAL,
      weight_kg REAL,
      target_weight_kg REAL,
      body_fat_pct REAL,
      goal TEXT,
      experience_years INTEGER,
      training_days_per_week INTEGER,
      activity_level TEXT,
      training_types TEXT,
      bench_pr REAL,
      squat_pr REAL,
      deadlift_pr REAL,
      units TEXT DEFAULT 'metric',
      profile_photo TEXT,
      city TEXT,
      country TEXT,
      league TEXT DEFAULT 'Rookie',
      xp INTEGER DEFAULT 0,
      created_at TEXT,
      onboarding_complete INTEGER DEFAULT 0,
      calorie_goal REAL,
      protein_goal REAL,
      carbs_goal REAL,
      fat_goal REAL,
      water_goal_ml INTEGER DEFAULT 2500
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT,
      duration_seconds INTEGER,
      total_volume REAL,
      notes TEXT,
      rpe INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER,
      exercise_id INTEGER,
      exercise_name TEXT,
      order_index INTEGER
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_exercise_id INTEGER,
      set_number INTEGER,
      weight_kg REAL,
      reps INTEGER,
      is_warmup INTEGER DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      muscle_group TEXT,
      equipment TEXT,
      difficulty TEXT,
      instructions TEXT,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cardio_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      type TEXT,
      duration_minutes REAL,
      distance_km REAL,
      calories INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      meal_type TEXT,
      food_id INTEGER,
      food_name TEXT,
      quantity_g REAL,
      calories REAL,
      protein_g REAL,
      carbs_g REAL,
      fat_g REAL,
      logged_at TEXT
    );

    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      brand TEXT,
      calories_per_100g REAL,
      protein_per_100g REAL,
      carbs_per_100g REAL,
      fat_per_100g REAL,
      fiber_per_100g REAL,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      amount_ml INTEGER,
      logged_at TEXT
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      weight_kg REAL,
      chest_cm REAL,
      waist_cm REAL,
      hips_cm REAL,
      arms_cm REAL,
      thighs_cm REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_name TEXT,
      weight_kg REAL,
      reps INTEGER,
      one_rm REAL,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      last_logged_date TEXT
    );

    CREATE TABLE IF NOT EXISTS xp_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount INTEGER,
      reason TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      steps INTEGER DEFAULT 0
    );
  `);
}

// ==================== USER PROFILE ====================

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  dob: string;
  sex: string;
  height_cm: number;
  weight_kg: number;
  target_weight_kg: number;
  body_fat_pct: number;
  goal: string;
  experience_years: number;
  training_days_per_week: number;
  activity_level: string;
  training_types: string;
  bench_pr: number;
  squat_pr: number;
  deadlift_pr: number;
  units: string;
  profile_photo: string;
  city: string;
  country: string;
  league: string;
  xp: number;
  created_at: string;
  onboarding_complete: number;
  calorie_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  water_goal_ml: number;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<UserProfile>('SELECT * FROM user_profile WHERE id = 1');
    return result || null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function insertUserProfile(profile: Partial<UserProfile>): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO user_profile (id, name, username, email, dob, sex, height_cm, weight_kg, target_weight_kg, body_fat_pct, goal, experience_years, training_days_per_week, activity_level, training_types, bench_pr, squat_pr, deadlift_pr, units, profile_photo, city, country, league, xp, created_at, onboarding_complete, calorie_goal, protein_goal, carbs_goal, fat_goal, water_goal_ml)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.name || '', profile.username || '', profile.email || '',
        profile.dob || '', profile.sex || '', profile.height_cm || 0,
        profile.weight_kg || 0, profile.target_weight_kg || 0, profile.body_fat_pct || 0,
        profile.goal || '', profile.experience_years || 0, profile.training_days_per_week || 0,
        profile.activity_level || '', profile.training_types || '', profile.bench_pr || 0,
        profile.squat_pr || 0, profile.deadlift_pr || 0, profile.units || 'metric',
        profile.profile_photo || '', profile.city || '', profile.country || '',
        profile.league || 'Rookie', profile.xp || 0, profile.created_at || new Date().toISOString(),
        profile.onboarding_complete || 0, profile.calorie_goal || 2000,
        profile.protein_goal || 150, profile.carbs_goal || 250, profile.fat_goal || 65,
        profile.water_goal_ml || 2500,
      ]
    );
  } catch (error) {
    console.error('Error inserting user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
  try {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;
    await db.runAsync(`UPDATE user_profile SET ${fields.join(', ')} WHERE id = 1`, values);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// ==================== WORKOUTS ====================

export interface Workout {
  id: number;
  name: string;
  date: string;
  duration_seconds: number;
  total_volume: number;
  notes: string;
  rpe: number;
  created_at: string;
}

export async function insertWorkout(workout: Partial<Workout>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO workouts (name, date, duration_seconds, total_volume, notes, rpe, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [workout.name || '', workout.date || '', workout.duration_seconds || 0, workout.total_volume || 0, workout.notes || '', workout.rpe || 0, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting workout:', error);
    throw error;
  }
}

export async function getWorkouts(limit = 50): Promise<Workout[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Workout>('SELECT * FROM workouts ORDER BY date DESC LIMIT ?', [limit]);
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
}

export async function getWorkoutById(id: number): Promise<Workout | null> {
  try {
    const db = await getDatabase();
    return await db.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error getting workout:', error);
    return null;
  }
}

export async function deleteWorkout(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_sets WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)', [id]);
    await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?', [id]);
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
}

export async function getWorkoutCount(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM workouts');
    return result?.cnt || 0;
  } catch (error) {
    console.error('Error getting workout count:', error);
    return 0;
  }
}

// ==================== WORKOUT EXERCISES ====================

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  exercise_name: string;
  order_index: number;
}

export async function insertWorkoutExercise(we: Partial<WorkoutExercise>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO workout_exercises (workout_id, exercise_id, exercise_name, order_index) VALUES (?, ?, ?, ?)',
      [we.workout_id || 0, we.exercise_id || 0, we.exercise_name || '', we.order_index || 0]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting workout exercise:', error);
    throw error;
  }
}

export async function getWorkoutExercises(workoutId: number): Promise<WorkoutExercise[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<WorkoutExercise>(
      'SELECT * FROM workout_exercises WHERE workout_id = ? ORDER BY order_index', [workoutId]
    );
  } catch (error) {
    console.error('Error getting workout exercises:', error);
    return [];
  }
}

// ==================== WORKOUT SETS ====================

export interface WorkoutSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  weight_kg: number;
  reps: number;
  is_warmup: number;
  notes: string;
}

export async function insertWorkoutSet(set: Partial<WorkoutSet>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO workout_sets (workout_exercise_id, set_number, weight_kg, reps, is_warmup, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [set.workout_exercise_id || 0, set.set_number || 0, set.weight_kg || 0, set.reps || 0, set.is_warmup || 0, set.notes || '']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting workout set:', error);
    throw error;
  }
}

export async function getWorkoutSets(workoutExerciseId: number): Promise<WorkoutSet[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<WorkoutSet>(
      'SELECT * FROM workout_sets WHERE workout_exercise_id = ? ORDER BY set_number', [workoutExerciseId]
    );
  } catch (error) {
    console.error('Error getting workout sets:', error);
    return [];
  }
}

export async function updateWorkoutSet(id: number, updates: Partial<WorkoutSet>): Promise<void> {
  try {
    const db = await getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    if (fields.length === 0) return;
    values.push(id);
    await db.runAsync(`UPDATE workout_sets SET ${fields.join(', ')} WHERE id = ?`, values);
  } catch (error) {
    console.error('Error updating workout set:', error);
    throw error;
  }
}

export async function deleteWorkoutSet(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM workout_sets WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting workout set:', error);
    throw error;
  }
}

// ==================== EXERCISES ====================

export interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  instructions: string;
  is_custom: number;
}

export async function getExercises(): Promise<Exercise[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY muscle_group, name');
  } catch (error) {
    console.error('Error getting exercises:', error);
    return [];
  }
}

export async function searchExercises(query: string): Promise<Exercise[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE name LIKE ? OR muscle_group LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    );
  } catch (error) {
    console.error('Error searching exercises:', error);
    return [];
  }
}

export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Exercise>(
      'SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name', [muscleGroup]
    );
  } catch (error) {
    console.error('Error getting exercises by group:', error);
    return [];
  }
}

export async function insertExercise(exercise: Partial<Exercise>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO exercises (name, muscle_group, equipment, difficulty, instructions, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
      [exercise.name || '', exercise.muscle_group || '', exercise.equipment || '', exercise.difficulty || '', exercise.instructions || '']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting exercise:', error);
    throw error;
  }
}

// ==================== CARDIO LOGS ====================

export interface CardioLog {
  id: number;
  date: string;
  type: string;
  duration_minutes: number;
  distance_km: number;
  calories: number;
  notes: string;
}

export async function insertCardioLog(log: Partial<CardioLog>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO cardio_logs (date, type, duration_minutes, distance_km, calories, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [log.date || '', log.type || '', log.duration_minutes || 0, log.distance_km || 0, log.calories || 0, log.notes || '']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting cardio log:', error);
    throw error;
  }
}

export async function getCardioLogs(limit = 50): Promise<CardioLog[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<CardioLog>('SELECT * FROM cardio_logs ORDER BY date DESC LIMIT ?', [limit]);
  } catch (error) {
    console.error('Error getting cardio logs:', error);
    return [];
  }
}

export async function deleteCardioLog(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM cardio_logs WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting cardio log:', error);
    throw error;
  }
}

// ==================== FOOD ENTRIES ====================

export interface FoodEntry {
  id: number;
  date: string;
  meal_type: string;
  food_id: number;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

export async function insertFoodEntry(entry: Partial<FoodEntry>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO food_entries (date, meal_type, food_id, food_name, quantity_g, calories, protein_g, carbs_g, fat_g, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [entry.date || '', entry.meal_type || '', entry.food_id || 0, entry.food_name || '', entry.quantity_g || 0, entry.calories || 0, entry.protein_g || 0, entry.carbs_g || 0, entry.fat_g || 0, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting food entry:', error);
    throw error;
  }
}

export async function getFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<FoodEntry>(
      'SELECT * FROM food_entries WHERE date = ? ORDER BY logged_at', [date]
    );
  } catch (error) {
    console.error('Error getting food entries:', error);
    return [];
  }
}

export async function deleteFoodEntry(id: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error deleting food entry:', error);
    throw error;
  }
}

export async function getDailyNutritionSummary(date: string): Promise<{ calories: number; protein: number; carbs: number; fat: number }> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ cal: number; pro: number; carb: number; f: number }>(
      'SELECT COALESCE(SUM(calories),0) as cal, COALESCE(SUM(protein_g),0) as pro, COALESCE(SUM(carbs_g),0) as carb, COALESCE(SUM(fat_g),0) as f FROM food_entries WHERE date = ?',
      [date]
    );
    return {
      calories: result?.cal || 0,
      protein: result?.pro || 0,
      carbs: result?.carb || 0,
      fat: result?.f || 0,
    };
  } catch (error) {
    console.error('Error getting nutrition summary:', error);
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
}

// ==================== FOODS ====================

export interface Food {
  id: number;
  name: string;
  brand: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  is_custom: number;
}

export async function getFoods(): Promise<Food[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Food>('SELECT * FROM foods ORDER BY name');
  } catch (error) {
    console.error('Error getting foods:', error);
    return [];
  }
}

export async function searchFoods(query: string): Promise<Food[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<Food>(
      'SELECT * FROM foods WHERE name LIKE ? OR brand LIKE ? ORDER BY name',
      [`%${query}%`, `%${query}%`]
    );
  } catch (error) {
    console.error('Error searching foods:', error);
    return [];
  }
}

export async function getFoodById(id: number): Promise<Food | null> {
  try {
    const db = await getDatabase();
    return await db.getFirstAsync<Food>('SELECT * FROM foods WHERE id = ?', [id]);
  } catch (error) {
    console.error('Error getting food:', error);
    return null;
  }
}

export async function insertFood(food: Partial<Food>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO foods (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [food.name || '', food.brand || '', food.calories_per_100g || 0, food.protein_per_100g || 0, food.carbs_per_100g || 0, food.fat_per_100g || 0, food.fiber_per_100g || 0]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting food:', error);
    throw error;
  }
}

// ==================== WATER LOGS ====================

export interface WaterLog {
  id: number;
  date: string;
  amount_ml: number;
  logged_at: string;
}

export async function insertWaterLog(date: string, amountMl: number): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO water_logs (date, amount_ml, logged_at) VALUES (?, ?, ?)',
      [date, amountMl, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting water log:', error);
    throw error;
  }
}

export async function getDailyWaterIntake(date: string): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount_ml),0) as total FROM water_logs WHERE date = ?', [date]
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting water intake:', error);
    return 0;
  }
}

export async function getWaterLogs(date: string): Promise<WaterLog[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<WaterLog>(
      'SELECT * FROM water_logs WHERE date = ? ORDER BY logged_at DESC', [date]
    );
  } catch (error) {
    console.error('Error getting water logs:', error);
    return [];
  }
}

// ==================== BODY MEASUREMENTS ====================

export interface BodyMeasurement {
  id: number;
  date: string;
  weight_kg: number;
  chest_cm: number;
  waist_cm: number;
  hips_cm: number;
  arms_cm: number;
  thighs_cm: number;
  notes: string;
}

export async function insertBodyMeasurement(m: Partial<BodyMeasurement>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO body_measurements (date, weight_kg, chest_cm, waist_cm, hips_cm, arms_cm, thighs_cm, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [m.date || '', m.weight_kg || 0, m.chest_cm || 0, m.waist_cm || 0, m.hips_cm || 0, m.arms_cm || 0, m.thighs_cm || 0, m.notes || '']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting body measurement:', error);
    throw error;
  }
}

export async function getBodyMeasurements(limit = 30): Promise<BodyMeasurement[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<BodyMeasurement>(
      'SELECT * FROM body_measurements ORDER BY date DESC LIMIT ?', [limit]
    );
  } catch (error) {
    console.error('Error getting body measurements:', error);
    return [];
  }
}

// ==================== PERSONAL RECORDS ====================

export interface PersonalRecord {
  id: number;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  one_rm: number;
  date: string;
}

export async function insertPersonalRecord(pr: Partial<PersonalRecord>): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.runAsync(
      'INSERT INTO personal_records (exercise_name, weight_kg, reps, one_rm, date) VALUES (?, ?, ?, ?, ?)',
      [pr.exercise_name || '', pr.weight_kg || 0, pr.reps || 0, pr.one_rm || 0, pr.date || '']
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error inserting personal record:', error);
    throw error;
  }
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<PersonalRecord>(
      'SELECT * FROM personal_records ORDER BY date DESC'
    );
  } catch (error) {
    console.error('Error getting personal records:', error);
    return [];
  }
}

export async function getBestPR(exerciseName: string): Promise<PersonalRecord | null> {
  try {
    const db = await getDatabase();
    return await db.getFirstAsync<PersonalRecord>(
      'SELECT * FROM personal_records WHERE exercise_name = ? ORDER BY one_rm DESC LIMIT 1',
      [exerciseName]
    );
  } catch (error) {
    console.error('Error getting best PR:', error);
    return null;
  }
}

// ==================== STREAKS ====================

export interface Streak {
  id: number;
  type: string;
  current_streak: number;
  best_streak: number;
  last_logged_date: string;
}

export async function getStreak(type: string): Promise<Streak | null> {
  try {
    const db = await getDatabase();
    return await db.getFirstAsync<Streak>(
      'SELECT * FROM streaks WHERE type = ?', [type]
    );
  } catch (error) {
    console.error('Error getting streak:', error);
    return null;
  }
}

export async function updateStreak(type: string, date: string): Promise<void> {
  try {
    const db = await getDatabase();
    const existing = await getStreak(type);

    if (!existing) {
      await db.runAsync(
        'INSERT INTO streaks (type, current_streak, best_streak, last_logged_date) VALUES (?, 1, 1, ?)',
        [type, date]
      );
      return;
    }

    const lastDate = new Date(existing.last_logged_date);
    const currentDate = new Date(date);
    const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return; // Same day

    let newStreak = existing.current_streak;
    if (diffDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const bestStreak = Math.max(existing.best_streak, newStreak);

    await db.runAsync(
      'UPDATE streaks SET current_streak = ?, best_streak = ?, last_logged_date = ? WHERE id = ?',
      [newStreak, bestStreak, date, existing.id]
    );
  } catch (error) {
    console.error('Error updating streak:', error);
  }
}

export async function initializeStreaks(): Promise<void> {
  try {
    const db = await getDatabase();
    const types = ['workout', 'nutrition', 'water'];
    for (const type of types) {
      const existing = await db.getFirstAsync('SELECT * FROM streaks WHERE type = ?', [type]);
      if (!existing) {
        await db.runAsync(
          'INSERT INTO streaks (type, current_streak, best_streak, last_logged_date) VALUES (?, 0, 0, ?)',
          [type, '']
        );
      }
    }
  } catch (error) {
    console.error('Error initializing streaks:', error);
  }
}

// ==================== XP LOG ====================

export interface XPLogEntry {
  id: number;
  amount: number;
  reason: string;
  date: string;
}

export async function getXPLog(limit = 50): Promise<XPLogEntry[]> {
  try {
    const db = await getDatabase();
    return await db.getAllAsync<XPLogEntry>(
      'SELECT * FROM xp_log ORDER BY date DESC LIMIT ?', [limit]
    );
  } catch (error) {
    console.error('Error getting XP log:', error);
    return [];
  }
}

// ==================== DAILY STEPS ====================

export async function updateDailySteps(date: string, steps: number): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO daily_steps (date, steps) VALUES (?, ?)',
      [date, steps]
    );
  } catch (error) {
    console.error('Error updating daily steps:', error);
  }
}

export async function getDailySteps(date: string): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ steps: number }>(
      'SELECT steps FROM daily_steps WHERE date = ?', [date]
    );
    return result?.steps || 0;
  } catch (error) {
    console.error('Error getting daily steps:', error);
    return 0;
  }
}

// ==================== AGGREGATE QUERIES ====================

export async function getTotalVolume(): Promise<number> {
  try {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(total_volume),0) as total FROM workouts'
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error getting total volume:', error);
    return 0;
  }
}

export async function getRecentWorkouts(days = 7): Promise<Workout[]> {
  try {
    const db = await getDatabase();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return await db.getAllAsync<Workout>(
      'SELECT * FROM workouts WHERE date >= ? ORDER BY date DESC',
      [startDate.toISOString().split('T')[0]]
    );
  } catch (error) {
    console.error('Error getting recent workouts:', error);
    return [];
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await getDatabase();
    await db.execAsync(`
      DELETE FROM user_profile;
      DELETE FROM workouts;
      DELETE FROM workout_exercises;
      DELETE FROM workout_sets;
      DELETE FROM cardio_logs;
      DELETE FROM food_entries;
      DELETE FROM water_logs;
      DELETE FROM body_measurements;
      DELETE FROM personal_records;
      DELETE FROM streaks;
      DELETE FROM xp_log;
      DELETE FROM daily_steps;
    `);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
