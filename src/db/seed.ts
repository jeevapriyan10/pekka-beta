/**
 * Seed data for exercises (60) and foods (120)
 */

import type * as SQLite from 'expo-sqlite';

interface SeedExercise {
  name: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

interface SeedFood {
  name: string;
  brand: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
}

const EXERCISES: SeedExercise[] = [
  // Chest (5)
  { name: 'Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.' },
  { name: 'Incline Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Set bench to 30-45°, press barbell from upper chest to lockout.' },
  { name: 'Cable Fly', muscle_group: 'Chest', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Stand between cables set high, bring handles together in front of chest with slight bend in elbows.' },
  { name: 'Push-up', muscle_group: 'Chest', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Hands shoulder-width apart, lower body until chest nearly touches floor, push back up.' },
  { name: 'Dips', muscle_group: 'Chest', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Support body on parallel bars, lean slightly forward, lower until upper arms are parallel, press back up.' },
  { name: 'Dumbbell Bench Press', muscle_group: 'Chest', equipment: 'Dumbbell', difficulty: 'Intermediate', instructions: 'Lie on bench with dumbbells, press up from chest level to arm extension.' },
  { name: 'Incline Dumbbell Press', muscle_group: 'Chest', equipment: 'Dumbbell', difficulty: 'Intermediate', instructions: 'Set bench to 30-45°, press dumbbells from upper chest to lockout.' },
  { name: 'Chest Press Machine', muscle_group: 'Chest', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Sit in machine, grip handles at chest height, press forward to full extension.' },
  { name: 'Pec Deck Fly', muscle_group: 'Chest', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Sit in machine, bring padded arms together in front of chest.' },
  { name: 'Decline Bench Press', muscle_group: 'Chest', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Set bench to decline, press barbell from lower chest to lockout.' },

  // Back (7)
  { name: 'Deadlift', muscle_group: 'Back', equipment: 'Barbell', difficulty: 'Advanced', instructions: 'Stand over barbell, hinge at hips, grip bar, drive through heels to stand. Keep back neutral.' },
  { name: 'Pull-up', muscle_group: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Hang from bar with overhand grip, pull body up until chin clears bar.' },
  { name: 'Barbell Row', muscle_group: 'Back', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Hinge forward 45°, pull barbell to lower chest, squeeze shoulder blades.' },
  { name: 'Lat Pulldown', muscle_group: 'Back', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Sit at lat pulldown, grip bar wide, pull down to upper chest, control return.' },
  { name: 'Cable Row', muscle_group: 'Back', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Sit at cable row, pull handle to lower chest, squeeze back, return controlled.' },
  { name: 'Face Pull', muscle_group: 'Back', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Set cable at face height, pull rope towards face separating hands, squeeze rear delts.' },
  { name: 'T-Bar Row', muscle_group: 'Back', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Straddle the bar, hinge forward, row the handle to chest.' },
  { name: 'Dumbbell Row', muscle_group: 'Back', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'One hand on bench, row dumbbell to hip with opposite hand.' },
  { name: 'Chin-up', muscle_group: 'Back', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Hang from bar with underhand grip, pull up until chin clears bar.' },

  // Shoulders (6)
  { name: 'Overhead Press', muscle_group: 'Shoulders', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Stand with barbell at shoulders, press overhead to lockout, lower controlled.' },
  { name: 'Lateral Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Stand with dumbbells at sides, raise arms out to shoulder height, lower slowly.' },
  { name: 'Front Raise', muscle_group: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Stand with dumbbells at thighs, raise one or both arms forward to shoulder height.' },
  { name: 'Rear Delt Fly', muscle_group: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Bend forward at hips, raise dumbbells out to sides squeezing rear delts.' },
  { name: 'Arnold Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Intermediate', instructions: 'Start with dumbbells in front of face palms facing you, rotate and press overhead.' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'Shoulders', equipment: 'Dumbbell', difficulty: 'Intermediate', instructions: 'Sit or stand, press dumbbells from shoulder height to overhead.' },

  // Arms (7)
  { name: 'Barbell Curl', muscle_group: 'Arms', equipment: 'Barbell', difficulty: 'Beginner', instructions: 'Stand with barbell, curl weight up keeping elbows pinned, lower controlled.' },
  { name: 'Hammer Curl', muscle_group: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Hold dumbbells with neutral grip, curl up keeping thumbs pointing up.' },
  { name: 'Tricep Pushdown', muscle_group: 'Arms', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Stand at cable, push rope/bar down extending elbows fully, return controlled.' },
  { name: 'Skull Crushers', muscle_group: 'Arms', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Lie on bench, lower EZ bar to forehead by bending elbows, extend back up.' },
  { name: 'Preacher Curl', muscle_group: 'Arms', equipment: 'Barbell', difficulty: 'Beginner', instructions: 'Sit at preacher bench, curl barbell up squeezing biceps, lower controlled.' },
  { name: 'Concentration Curl', muscle_group: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Sit, brace elbow against inner thigh, curl dumbbell up squeezing bicep.' },
  { name: 'Overhead Tricep Extension', muscle_group: 'Arms', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Hold dumbbell behind head with both hands, extend arms overhead.' },

  // Legs (10)
  { name: 'Squat', muscle_group: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Bar on upper back, feet shoulder-width, squat down to parallel or below, drive up.' },
  { name: 'Leg Press', muscle_group: 'Legs', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Sit in leg press, place feet shoulder-width on platform, press to extension, lower controlled.' },
  { name: 'Romanian Deadlift', muscle_group: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Hold barbell, hinge at hips pushing hips back, lower bar along legs, feel hamstring stretch.' },
  { name: 'Leg Extension', muscle_group: 'Legs', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Sit in machine, extend legs to straighten knees, squeeze quads at top.' },
  { name: 'Leg Curl', muscle_group: 'Legs', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Lie face down or sit, curl pad towards glutes contracting hamstrings.' },
  { name: 'Calf Raise', muscle_group: 'Legs', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Stand on edge of platform, raise heels as high as possible, lower below platform level.' },
  { name: 'Bulgarian Split Squat', muscle_group: 'Legs', equipment: 'Dumbbell', difficulty: 'Intermediate', instructions: 'Rear foot elevated on bench, lunge down until front thigh is parallel, drive back up.' },
  { name: 'Hack Squat', muscle_group: 'Legs', equipment: 'Machine', difficulty: 'Intermediate', instructions: 'Stand in hack squat machine, squat down to parallel, press back up.' },
  { name: 'Walking Lunges', muscle_group: 'Legs', equipment: 'Dumbbell', difficulty: 'Beginner', instructions: 'Step forward into lunge, alternate legs while walking forward.' },
  { name: 'Hip Thrust', muscle_group: 'Legs', equipment: 'Barbell', difficulty: 'Intermediate', instructions: 'Upper back on bench, barbell on hips, drive hips up squeezing glutes.' },

  // Core (6)
  { name: 'Plank', muscle_group: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Support body on forearms and toes, keep body straight, hold position.' },
  { name: 'Crunches', muscle_group: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Lie on back, hands behind head, curl upper body toward knees.' },
  { name: 'Russian Twist', muscle_group: 'Core', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Sit with knees bent, lean back slightly, rotate torso side to side.' },
  { name: 'Hanging Leg Raise', muscle_group: 'Core', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Hang from bar, raise legs to parallel or higher, lower controlled.' },
  { name: 'Cable Crunch', muscle_group: 'Core', equipment: 'Cable', difficulty: 'Beginner', instructions: 'Kneel below cable, hold rope behind head, crunch down contracting abs.' },
  { name: 'Ab Wheel Rollout', muscle_group: 'Core', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Kneel with ab wheel, roll forward extending body, pull back to start.' },

  // Cardio (9)
  { name: 'Treadmill Run', muscle_group: 'Cardio', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Run on treadmill at comfortable pace. Adjust speed and incline as needed.' },
  { name: 'Stationary Bike', muscle_group: 'Cardio', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Pedal at steady pace, adjust resistance for intensity.' },
  { name: 'Jump Rope', muscle_group: 'Cardio', equipment: 'Bodyweight', difficulty: 'Beginner', instructions: 'Jump over rope with both feet, maintain steady rhythm.' },
  { name: 'Rowing Machine', muscle_group: 'Cardio', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Pull handle to chest while pushing with legs, return in controlled motion.' },
  { name: 'Elliptical', muscle_group: 'Cardio', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Step on pedals, move in smooth elliptical motion, use handles for upper body.' },
  { name: 'Stair Climber', muscle_group: 'Cardio', equipment: 'Machine', difficulty: 'Beginner', instructions: 'Step on revolving stairs at steady pace.' },
  { name: 'Battle Ropes', muscle_group: 'Cardio', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Grip rope ends, create waves with alternating or simultaneous arm movements.' },
  { name: 'Box Jumps', muscle_group: 'Cardio', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Stand before box, jump up landing softly on top, step down.' },
  { name: 'Burpees', muscle_group: 'Cardio', equipment: 'Bodyweight', difficulty: 'Intermediate', instructions: 'Drop to push-up, push up, jump to feet, jump with hands overhead.' },
];

const FOODS: SeedFood[] = [
  // Proteins (15)
  { name: 'Chicken Breast', brand: 'Generic', calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6, fiber_per_100g: 0 },
  { name: 'Eggs', brand: 'Generic', calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11, fiber_per_100g: 0 },
  { name: 'Tuna Canned', brand: 'Generic', calories_per_100g: 116, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 1, fiber_per_100g: 0 },
  { name: 'Paneer', brand: 'Generic', calories_per_100g: 265, protein_per_100g: 18, carbs_per_100g: 3, fat_per_100g: 20, fiber_per_100g: 0 },
  { name: 'Salmon', brand: 'Generic', calories_per_100g: 208, protein_per_100g: 20, carbs_per_100g: 0, fat_per_100g: 13, fiber_per_100g: 0 },
  { name: 'Greek Yogurt', brand: 'Generic', calories_per_100g: 100, protein_per_100g: 10, carbs_per_100g: 3.6, fat_per_100g: 0.7, fiber_per_100g: 0 },
  { name: 'Whey Protein Powder', brand: 'Generic', calories_per_100g: 400, protein_per_100g: 80, carbs_per_100g: 5, fat_per_100g: 5, fiber_per_100g: 0 },
  { name: 'Turkey Breast', brand: 'Generic', calories_per_100g: 135, protein_per_100g: 30, carbs_per_100g: 0, fat_per_100g: 1, fiber_per_100g: 0 },
  { name: 'Shrimp', brand: 'Generic', calories_per_100g: 99, protein_per_100g: 24, carbs_per_100g: 0.2, fat_per_100g: 0.3, fiber_per_100g: 0 },
  { name: 'Cottage Cheese', brand: 'Generic', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.4, fat_per_100g: 4.3, fiber_per_100g: 0 },
  { name: 'Tofu', brand: 'Generic', calories_per_100g: 76, protein_per_100g: 8, carbs_per_100g: 1.9, fat_per_100g: 4.8, fiber_per_100g: 0.3 },
  { name: 'Beef Steak (Lean)', brand: 'Generic', calories_per_100g: 271, protein_per_100g: 26, carbs_per_100g: 0, fat_per_100g: 18, fiber_per_100g: 0 },
  { name: 'Ground Chicken', brand: 'Generic', calories_per_100g: 143, protein_per_100g: 17, carbs_per_100g: 0, fat_per_100g: 8, fiber_per_100g: 0 },
  { name: 'Sardines', brand: 'Generic', calories_per_100g: 208, protein_per_100g: 25, carbs_per_100g: 0, fat_per_100g: 11, fiber_per_100g: 0 },
  { name: 'Tempeh', brand: 'Generic', calories_per_100g: 192, protein_per_100g: 20, carbs_per_100g: 8, fat_per_100g: 11, fiber_per_100g: 0 },

  // Carbs (15)
  { name: 'White Rice', brand: 'Generic', calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3, fiber_per_100g: 0.4 },
  { name: 'Brown Rice', brand: 'Generic', calories_per_100g: 123, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, fiber_per_100g: 1.8 },
  { name: 'Oats', brand: 'Generic', calories_per_100g: 389, protein_per_100g: 17, carbs_per_100g: 66, fat_per_100g: 7, fiber_per_100g: 10 },
  { name: 'Sweet Potato', brand: 'Generic', calories_per_100g: 86, protein_per_100g: 1.6, carbs_per_100g: 20, fat_per_100g: 0.1, fiber_per_100g: 3 },
  { name: 'Whole Wheat Bread', brand: 'Generic', calories_per_100g: 247, protein_per_100g: 13, carbs_per_100g: 41, fat_per_100g: 3.4, fiber_per_100g: 7 },
  { name: 'Banana', brand: 'Generic', calories_per_100g: 89, protein_per_100g: 1.1, carbs_per_100g: 23, fat_per_100g: 0.3, fiber_per_100g: 2.6 },
  { name: 'Apple', brand: 'Generic', calories_per_100g: 52, protein_per_100g: 0.3, carbs_per_100g: 14, fat_per_100g: 0.2, fiber_per_100g: 2.4 },
  { name: 'Pasta (Cooked)', brand: 'Generic', calories_per_100g: 131, protein_per_100g: 5, carbs_per_100g: 25, fat_per_100g: 1.1, fiber_per_100g: 1.8 },
  { name: 'Quinoa', brand: 'Generic', calories_per_100g: 120, protein_per_100g: 4.4, carbs_per_100g: 21, fat_per_100g: 1.9, fiber_per_100g: 2.8 },
  { name: 'White Potato', brand: 'Generic', calories_per_100g: 77, protein_per_100g: 2, carbs_per_100g: 17, fat_per_100g: 0.1, fiber_per_100g: 2.2 },
  { name: 'Corn', brand: 'Generic', calories_per_100g: 86, protein_per_100g: 3.2, carbs_per_100g: 19, fat_per_100g: 1.2, fiber_per_100g: 2.7 },
  { name: 'Bagel', brand: 'Generic', calories_per_100g: 257, protein_per_100g: 10, carbs_per_100g: 50, fat_per_100g: 1.6, fiber_per_100g: 2.3 },
  { name: 'Couscous', brand: 'Generic', calories_per_100g: 112, protein_per_100g: 3.8, carbs_per_100g: 23, fat_per_100g: 0.2, fiber_per_100g: 1.4 },
  { name: 'Rye Bread', brand: 'Generic', calories_per_100g: 259, protein_per_100g: 8.5, carbs_per_100g: 48, fat_per_100g: 3.3, fiber_per_100g: 5.8 },
  { name: 'Muesli', brand: 'Generic', calories_per_100g: 340, protein_per_100g: 10, carbs_per_100g: 62, fat_per_100g: 6, fiber_per_100g: 7.5 },

  // Fats (10)
  { name: 'Peanut Butter', brand: 'Generic', calories_per_100g: 588, protein_per_100g: 25, carbs_per_100g: 20, fat_per_100g: 50, fiber_per_100g: 6 },
  { name: 'Almonds', brand: 'Generic', calories_per_100g: 579, protein_per_100g: 21, carbs_per_100g: 22, fat_per_100g: 50, fiber_per_100g: 12.5 },
  { name: 'Avocado', brand: 'Generic', calories_per_100g: 160, protein_per_100g: 2, carbs_per_100g: 9, fat_per_100g: 15, fiber_per_100g: 7 },
  { name: 'Olive Oil', brand: 'Generic', calories_per_100g: 884, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, fiber_per_100g: 0 },
  { name: 'Walnuts', brand: 'Generic', calories_per_100g: 654, protein_per_100g: 15, carbs_per_100g: 14, fat_per_100g: 65, fiber_per_100g: 6.7 },
  { name: 'Cashews', brand: 'Generic', calories_per_100g: 553, protein_per_100g: 18, carbs_per_100g: 30, fat_per_100g: 44, fiber_per_100g: 3.3 },
  { name: 'Chia Seeds', brand: 'Generic', calories_per_100g: 486, protein_per_100g: 17, carbs_per_100g: 42, fat_per_100g: 31, fiber_per_100g: 34 },
  { name: 'Flax Seeds', brand: 'Generic', calories_per_100g: 534, protein_per_100g: 18, carbs_per_100g: 29, fat_per_100g: 42, fiber_per_100g: 27 },
  { name: 'Coconut Oil', brand: 'Generic', calories_per_100g: 862, protein_per_100g: 0, carbs_per_100g: 0, fat_per_100g: 100, fiber_per_100g: 0 },
  { name: 'Dark Chocolate (85%)', brand: 'Generic', calories_per_100g: 604, protein_per_100g: 8, carbs_per_100g: 33, fat_per_100g: 46, fiber_per_100g: 11 },

  // Indian Foods (10)
  { name: 'Dal (Cooked Lentils)', brand: 'Generic', calories_per_100g: 116, protein_per_100g: 9, carbs_per_100g: 20, fat_per_100g: 0.4, fiber_per_100g: 8 },
  { name: 'Chapati', brand: 'Generic', calories_per_100g: 297, protein_per_100g: 9, carbs_per_100g: 52, fat_per_100g: 4.6, fiber_per_100g: 4 },
  { name: 'Idli', brand: 'Generic', calories_per_100g: 58, protein_per_100g: 2, carbs_per_100g: 12, fat_per_100g: 0.4, fiber_per_100g: 0.5 },
  { name: 'Curd (Yogurt)', brand: 'Generic', calories_per_100g: 98, protein_per_100g: 11, carbs_per_100g: 3.4, fat_per_100g: 4.3, fiber_per_100g: 0 },
  { name: 'Poha', brand: 'Generic', calories_per_100g: 110, protein_per_100g: 2.6, carbs_per_100g: 23, fat_per_100g: 0.9, fiber_per_100g: 1 },
  { name: 'Sambar', brand: 'Generic', calories_per_100g: 65, protein_per_100g: 3, carbs_per_100g: 10, fat_per_100g: 1.5, fiber_per_100g: 2 },
  { name: 'Upma', brand: 'Generic', calories_per_100g: 125, protein_per_100g: 3.5, carbs_per_100g: 18, fat_per_100g: 4.5, fiber_per_100g: 1 },
  { name: 'Dosa', brand: 'Generic', calories_per_100g: 120, protein_per_100g: 3, carbs_per_100g: 18, fat_per_100g: 4, fiber_per_100g: 0.5 },
  { name: 'Paratha', brand: 'Generic', calories_per_100g: 326, protein_per_100g: 7, carbs_per_100g: 45, fat_per_100g: 13, fiber_per_100g: 2 },
  { name: 'Khichdi', brand: 'Generic', calories_per_100g: 105, protein_per_100g: 4, carbs_per_100g: 18, fat_per_100g: 2, fiber_per_100g: 1.5 },

  // Vegetables (15)
  { name: 'Broccoli', brand: 'Generic', calories_per_100g: 34, protein_per_100g: 2.8, carbs_per_100g: 7, fat_per_100g: 0.4, fiber_per_100g: 2.6 },
  { name: 'Spinach', brand: 'Generic', calories_per_100g: 23, protein_per_100g: 2.9, carbs_per_100g: 3.6, fat_per_100g: 0.4, fiber_per_100g: 2.2 },
  { name: 'Carrot', brand: 'Generic', calories_per_100g: 41, protein_per_100g: 0.9, carbs_per_100g: 10, fat_per_100g: 0.2, fiber_per_100g: 2.8 },
  { name: 'Tomato', brand: 'Generic', calories_per_100g: 18, protein_per_100g: 0.9, carbs_per_100g: 3.9, fat_per_100g: 0.2, fiber_per_100g: 1.2 },
  { name: 'Cucumber', brand: 'Generic', calories_per_100g: 16, protein_per_100g: 0.7, carbs_per_100g: 3.6, fat_per_100g: 0.1, fiber_per_100g: 0.5 },
  { name: 'Bell Pepper', brand: 'Generic', calories_per_100g: 31, protein_per_100g: 1, carbs_per_100g: 6, fat_per_100g: 0.3, fiber_per_100g: 2.1 },
  { name: 'Onion', brand: 'Generic', calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9.3, fat_per_100g: 0.1, fiber_per_100g: 1.7 },
  { name: 'Mushrooms', brand: 'Generic', calories_per_100g: 22, protein_per_100g: 3.1, carbs_per_100g: 3.3, fat_per_100g: 0.3, fiber_per_100g: 1 },
  { name: 'Green Beans', brand: 'Generic', calories_per_100g: 31, protein_per_100g: 1.8, carbs_per_100g: 7, fat_per_100g: 0.1, fiber_per_100g: 3.4 },
  { name: 'Cauliflower', brand: 'Generic', calories_per_100g: 25, protein_per_100g: 1.9, carbs_per_100g: 5, fat_per_100g: 0.3, fiber_per_100g: 2 },
  { name: 'Zucchini', brand: 'Generic', calories_per_100g: 17, protein_per_100g: 1.2, carbs_per_100g: 3.1, fat_per_100g: 0.3, fiber_per_100g: 1 },
  { name: 'Cabbage', brand: 'Generic', calories_per_100g: 25, protein_per_100g: 1.3, carbs_per_100g: 5.8, fat_per_100g: 0.1, fiber_per_100g: 2.5 },
  { name: 'Asparagus', brand: 'Generic', calories_per_100g: 20, protein_per_100g: 2.2, carbs_per_100g: 3.9, fat_per_100g: 0.1, fiber_per_100g: 2.1 },
  { name: 'Kale', brand: 'Generic', calories_per_100g: 49, protein_per_100g: 4.3, carbs_per_100g: 9, fat_per_100g: 0.9, fiber_per_100g: 3.6 },
  { name: 'Peas', brand: 'Generic', calories_per_100g: 81, protein_per_100g: 5.4, carbs_per_100g: 14, fat_per_100g: 0.4, fiber_per_100g: 5.1 },

  // Fruits (10)
  { name: 'Orange', brand: 'Generic', calories_per_100g: 47, protein_per_100g: 0.9, carbs_per_100g: 12, fat_per_100g: 0.1, fiber_per_100g: 2.4 },
  { name: 'Mango', brand: 'Generic', calories_per_100g: 60, protein_per_100g: 0.8, carbs_per_100g: 15, fat_per_100g: 0.4, fiber_per_100g: 1.6 },
  { name: 'Strawberries', brand: 'Generic', calories_per_100g: 32, protein_per_100g: 0.7, carbs_per_100g: 7.7, fat_per_100g: 0.3, fiber_per_100g: 2 },
  { name: 'Blueberries', brand: 'Generic', calories_per_100g: 57, protein_per_100g: 0.7, carbs_per_100g: 14, fat_per_100g: 0.3, fiber_per_100g: 2.4 },
  { name: 'Watermelon', brand: 'Generic', calories_per_100g: 30, protein_per_100g: 0.6, carbs_per_100g: 7.6, fat_per_100g: 0.2, fiber_per_100g: 0.4 },
  { name: 'Grapes', brand: 'Generic', calories_per_100g: 69, protein_per_100g: 0.7, carbs_per_100g: 18, fat_per_100g: 0.2, fiber_per_100g: 0.9 },
  { name: 'Pineapple', brand: 'Generic', calories_per_100g: 50, protein_per_100g: 0.5, carbs_per_100g: 13, fat_per_100g: 0.1, fiber_per_100g: 1.4 },
  { name: 'Papaya', brand: 'Generic', calories_per_100g: 43, protein_per_100g: 0.5, carbs_per_100g: 11, fat_per_100g: 0.3, fiber_per_100g: 1.7 },
  { name: 'Guava', brand: 'Generic', calories_per_100g: 68, protein_per_100g: 2.6, carbs_per_100g: 14, fat_per_100g: 1, fiber_per_100g: 5.4 },
  { name: 'Pomegranate', brand: 'Generic', calories_per_100g: 83, protein_per_100g: 1.7, carbs_per_100g: 19, fat_per_100g: 1.2, fiber_per_100g: 4 },

  // Dairy (5)
  { name: 'Whole Milk', brand: 'Generic', calories_per_100g: 61, protein_per_100g: 3.2, carbs_per_100g: 4.8, fat_per_100g: 3.3, fiber_per_100g: 0 },
  { name: 'Skim Milk', brand: 'Generic', calories_per_100g: 35, protein_per_100g: 3.4, carbs_per_100g: 5, fat_per_100g: 0.1, fiber_per_100g: 0 },
  { name: 'Cheddar Cheese', brand: 'Generic', calories_per_100g: 402, protein_per_100g: 25, carbs_per_100g: 1.3, fat_per_100g: 33, fiber_per_100g: 0 },
  { name: 'Mozzarella', brand: 'Generic', calories_per_100g: 280, protein_per_100g: 28, carbs_per_100g: 3.1, fat_per_100g: 17, fiber_per_100g: 0 },
  { name: 'Butter', brand: 'Generic', calories_per_100g: 717, protein_per_100g: 0.9, carbs_per_100g: 0.1, fat_per_100g: 81, fiber_per_100g: 0 },

  // Snacks (10)
  { name: 'Protein Bar', brand: 'Generic', calories_per_100g: 350, protein_per_100g: 30, carbs_per_100g: 35, fat_per_100g: 12, fiber_per_100g: 5 },
  { name: 'Trail Mix', brand: 'Generic', calories_per_100g: 462, protein_per_100g: 13, carbs_per_100g: 44, fat_per_100g: 29, fiber_per_100g: 4 },
  { name: 'Rice Cakes', brand: 'Generic', calories_per_100g: 387, protein_per_100g: 8, carbs_per_100g: 82, fat_per_100g: 2.8, fiber_per_100g: 1.2 },
  { name: 'Popcorn (Air-popped)', brand: 'Generic', calories_per_100g: 387, protein_per_100g: 13, carbs_per_100g: 78, fat_per_100g: 4.5, fiber_per_100g: 15 },
  { name: 'Granola Bar', brand: 'Generic', calories_per_100g: 471, protein_per_100g: 10, carbs_per_100g: 64, fat_per_100g: 20, fiber_per_100g: 4 },
  { name: 'Dried Fruit Mix', brand: 'Generic', calories_per_100g: 359, protein_per_100g: 3, carbs_per_100g: 82, fat_per_100g: 1.5, fiber_per_100g: 7 },
  { name: 'Hummus', brand: 'Generic', calories_per_100g: 166, protein_per_100g: 8, carbs_per_100g: 14, fat_per_100g: 10, fiber_per_100g: 6 },
  { name: 'Crackers', brand: 'Generic', calories_per_100g: 421, protein_per_100g: 9, carbs_per_100g: 72, fat_per_100g: 11, fiber_per_100g: 3 },
  { name: 'Mixed Nuts', brand: 'Generic', calories_per_100g: 607, protein_per_100g: 20, carbs_per_100g: 21, fat_per_100g: 54, fiber_per_100g: 7 },
  { name: 'Beef Jerky', brand: 'Generic', calories_per_100g: 410, protein_per_100g: 33, carbs_per_100g: 25, fat_per_100g: 20, fiber_per_100g: 0 },

  // Beverages (10)
  { name: 'Black Coffee', brand: 'Generic', calories_per_100g: 2, protein_per_100g: 0.3, carbs_per_100g: 0, fat_per_100g: 0, fiber_per_100g: 0 },
  { name: 'Green Tea', brand: 'Generic', calories_per_100g: 1, protein_per_100g: 0, carbs_per_100g: 0.2, fat_per_100g: 0, fiber_per_100g: 0 },
  { name: 'Orange Juice', brand: 'Generic', calories_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10, fat_per_100g: 0.2, fiber_per_100g: 0.2 },
  { name: 'Coconut Water', brand: 'Generic', calories_per_100g: 19, protein_per_100g: 0.7, carbs_per_100g: 3.7, fat_per_100g: 0.2, fiber_per_100g: 1.1 },
  { name: 'Almond Milk', brand: 'Generic', calories_per_100g: 15, protein_per_100g: 0.6, carbs_per_100g: 0.3, fat_per_100g: 1.2, fiber_per_100g: 0.2 },
  { name: 'Smoothie (Mixed Berry)', brand: 'Generic', calories_per_100g: 55, protein_per_100g: 1, carbs_per_100g: 12, fat_per_100g: 0.5, fiber_per_100g: 1.5 },
  { name: 'Protein Shake', brand: 'Generic', calories_per_100g: 80, protein_per_100g: 15, carbs_per_100g: 3, fat_per_100g: 1, fiber_per_100g: 0.5 },
  { name: 'Chai Tea', brand: 'Generic', calories_per_100g: 45, protein_per_100g: 1.5, carbs_per_100g: 7, fat_per_100g: 1.5, fiber_per_100g: 0 },
  { name: 'Lassi', brand: 'Generic', calories_per_100g: 75, protein_per_100g: 3, carbs_per_100g: 11, fat_per_100g: 2.5, fiber_per_100g: 0 },
  { name: 'Buttermilk', brand: 'Generic', calories_per_100g: 40, protein_per_100g: 3.3, carbs_per_100g: 4.8, fat_per_100g: 0.9, fiber_per_100g: 0 },

  // Fast Food / Common Meals (15)
  { name: 'Pizza Slice (Cheese)', brand: 'Generic', calories_per_100g: 266, protein_per_100g: 11, carbs_per_100g: 33, fat_per_100g: 10, fiber_per_100g: 2.3 },
  { name: 'French Fries', brand: 'Generic', calories_per_100g: 312, protein_per_100g: 3.4, carbs_per_100g: 41, fat_per_100g: 15, fiber_per_100g: 3.8 },
  { name: 'Chicken Burger', brand: 'Generic', calories_per_100g: 240, protein_per_100g: 15, carbs_per_100g: 22, fat_per_100g: 10, fiber_per_100g: 1.5 },
  { name: 'Grilled Chicken Wrap', brand: 'Generic', calories_per_100g: 170, protein_per_100g: 14, carbs_per_100g: 16, fat_per_100g: 6, fiber_per_100g: 1 },
  { name: 'Caesar Salad', brand: 'Generic', calories_per_100g: 127, protein_per_100g: 6, carbs_per_100g: 7, fat_per_100g: 9, fiber_per_100g: 1.5 },
  { name: 'Sushi Roll', brand: 'Generic', calories_per_100g: 140, protein_per_100g: 5, carbs_per_100g: 24, fat_per_100g: 2.5, fiber_per_100g: 0.5 },
  { name: 'Chicken Biryani', brand: 'Generic', calories_per_100g: 175, protein_per_100g: 10, carbs_per_100g: 22, fat_per_100g: 5, fiber_per_100g: 1 },
  { name: 'Butter Chicken', brand: 'Generic', calories_per_100g: 148, protein_per_100g: 12, carbs_per_100g: 5, fat_per_100g: 9, fiber_per_100g: 0.5 },
  { name: 'Fried Rice', brand: 'Generic', calories_per_100g: 163, protein_per_100g: 4.5, carbs_per_100g: 24, fat_per_100g: 5.5, fiber_per_100g: 1 },
  { name: 'Naan Bread', brand: 'Generic', calories_per_100g: 290, protein_per_100g: 9, carbs_per_100g: 50, fat_per_100g: 5, fiber_per_100g: 2 },
  { name: 'Chicken Shawarma', brand: 'Generic', calories_per_100g: 168, protein_per_100g: 15, carbs_per_100g: 8, fat_per_100g: 8, fiber_per_100g: 1 },
  { name: 'Pasta Carbonara', brand: 'Generic', calories_per_100g: 190, protein_per_100g: 8, carbs_per_100g: 22, fat_per_100g: 8, fiber_per_100g: 1 },
  { name: 'Beef Burger', brand: 'Generic', calories_per_100g: 295, protein_per_100g: 17, carbs_per_100g: 24, fat_per_100g: 14, fiber_per_100g: 1 },
  { name: 'Hot Dog', brand: 'Generic', calories_per_100g: 290, protein_per_100g: 10, carbs_per_100g: 22, fat_per_100g: 18, fiber_per_100g: 0.5 },
  { name: 'Tacos', brand: 'Generic', calories_per_100g: 210, protein_per_100g: 11, carbs_per_100g: 21, fat_per_100g: 10, fiber_per_100g: 2 },

  // Miscellaneous / Condiments (5)
  { name: 'Honey', brand: 'Generic', calories_per_100g: 304, protein_per_100g: 0.3, carbs_per_100g: 82, fat_per_100g: 0, fiber_per_100g: 0 },
  { name: 'Jam', brand: 'Generic', calories_per_100g: 250, protein_per_100g: 0.4, carbs_per_100g: 63, fat_per_100g: 0.1, fiber_per_100g: 1 },
  { name: 'Ketchup', brand: 'Generic', calories_per_100g: 112, protein_per_100g: 1.7, carbs_per_100g: 26, fat_per_100g: 0.1, fiber_per_100g: 0.3 },
  { name: 'Mayonnaise', brand: 'Generic', calories_per_100g: 680, protein_per_100g: 1, carbs_per_100g: 0.6, fat_per_100g: 75, fiber_per_100g: 0 },
  { name: 'Soy Sauce', brand: 'Generic', calories_per_100g: 53, protein_per_100g: 8, carbs_per_100g: 5, fat_per_100g: 0, fiber_per_100g: 0.8 },
];

export async function seedExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  // Check if already seeded
  const count = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM exercises');
  if (count && count.cnt > 0) return;

  for (const exercise of EXERCISES) {
    await db.runAsync(
      'INSERT INTO exercises (name, muscle_group, equipment, difficulty, instructions, is_custom) VALUES (?, ?, ?, ?, ?, 0)',
      [exercise.name, exercise.muscle_group, exercise.equipment, exercise.difficulty, exercise.instructions]
    );
  }
  console.log(`Seeded ${EXERCISES.length} exercises`);
}

export async function seedFoods(db: SQLite.SQLiteDatabase): Promise<void> {
  // Check if already seeded
  const count = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM foods');
  if (count && count.cnt > 0) return;

  for (const food of FOODS) {
    await db.runAsync(
      'INSERT INTO foods (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_custom) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [food.name, food.brand, food.calories_per_100g, food.protein_per_100g, food.carbs_per_100g, food.fat_per_100g, food.fiber_per_100g]
    );
  }
  console.log(`Seeded ${FOODS.length} foods`);
}
