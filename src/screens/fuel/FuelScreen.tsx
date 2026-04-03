import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import PekkaButton from '../../components/PekkaButton';
import CircularProgress from '../../components/CircularProgress';
import EmptyState from '../../components/EmptyState';
import {
  getUserProfile,
  UserProfile,
  getFoodEntriesByDate,
  getDailyNutritionSummary,
  getDailyWaterIntake,
  insertWaterLog,
  deleteFoodEntry,
  FoodEntry,
  updateStreak,
} from '../../db/database';
import { getTodayString } from '../../utils/formatters';
import { grantXP } from '../../utils/xp';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const WATER_AMOUNTS = [150, 250, 500, 750];

export default function FuelScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterIntake, setWaterIntake] = useState(0);

  const today = getTodayString();

  const loadData = useCallback(async () => {
    try {
      const [prof, todayEntries, nutri, water] = await Promise.all([
        getUserProfile(),
        getFoodEntriesByDate(today),
        getDailyNutritionSummary(today),
        getDailyWaterIntake(today),
      ]);
      setProfile(prof);
      setEntries(todayEntries);
      setNutrition(nutri);
      setWaterIntake(water);
    } catch (error) {
      console.error('Error loading fuel data:', error);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const addWater = async (ml: number) => {
    try {
      await insertWaterLog(today, ml);
      const newIntake = waterIntake + ml;
      setWaterIntake(newIntake);

      // Check if water goal met
      if (newIntake >= (profile?.water_goal_ml || 2500) && waterIntake < (profile?.water_goal_ml || 2500)) {
        await grantXP('water_goal_met');
        await updateStreak('water', today);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not log water.');
    }
  };

  const handleDeleteEntry = async (id: number) => {
    try {
      await deleteFoodEntry(id);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Could not delete entry.');
    }
  };

  const getMealEntries = (mealType: string) => entries.filter(e => e.meal_type === mealType);

  const calorieGoal = profile?.calorie_goal || 2000;
  const waterGoal = profile?.water_goal_ml || 2500;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>FUEL</Text>
        <Text style={styles.screenSubtitle}>Nutrition tracking for peak performance</Text>

        {/* Daily Overview */}
        <PekkaCard style={styles.overviewCard}>
          <View style={styles.overviewContent}>
            <CircularProgress
              size={100}
              strokeWidth={9}
              color={Colors.green}
              value={nutrition.calories}
              max={calorieGoal}
              label={`${Math.round(nutrition.calories)}`}
              sublabel={`/ ${calorieGoal}`}
            />
            <View style={styles.macroSummary}>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: Colors.blue }]} />
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.protein)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: Colors.gold }]} />
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.carbs)}g</Text>
              </View>
              <View style={styles.macroItem}>
                <View style={[styles.macroDot, { backgroundColor: Colors.orange }]} />
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.fat)}g</Text>
              </View>
            </View>
          </View>
        </PekkaCard>

        {/* Water Tracker */}
        <PekkaCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.cardTitle}>💧 Hydration</Text>
              <Text style={styles.waterProgress}>{waterIntake}ml / {waterGoal}ml</Text>
            </View>
            <CircularProgress
              size={50}
              strokeWidth={5}
              color={Colors.blue}
              value={waterIntake}
              max={waterGoal}
              label={`${Math.round((waterIntake / waterGoal) * 100)}%`}
            />
          </View>
          <View style={styles.waterButtons}>
            {WATER_AMOUNTS.map(ml => (
              <TouchableOpacity key={ml} style={styles.waterBtn} onPress={() => addWater(ml)}>
                <Text style={styles.waterBtnText}>+{ml}ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </PekkaCard>

        {/* Meal Sections */}
        {MEAL_TYPES.map(meal => {
          const mealEntries = getMealEntries(meal);
          const mealCals = mealEntries.reduce((sum, e) => sum + e.calories, 0);

          return (
            <PekkaCard key={meal} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View>
                  <Text style={styles.mealTitle}>{meal}</Text>
                  {mealCals > 0 && <Text style={styles.mealCals}>{Math.round(mealCals)} kcal</Text>}
                </View>
                <TouchableOpacity
                  style={styles.addFoodBtn}
                  onPress={() => navigation.navigate('FoodSearch', { mealType: meal })}
                >
                  <Ionicons name="add" size={18} color={Colors.blue} />
                  <Text style={styles.addFoodText}>Add</Text>
                </TouchableOpacity>
              </View>

              {mealEntries.length === 0 ? (
                <Text style={styles.emptyMeal}>No items logged</Text>
              ) : (
                mealEntries.map(entry => (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryInfo}>
                      <Text style={styles.entryName}>{entry.food_name}</Text>
                      <Text style={styles.entryMeta}>{entry.quantity_g}g · {Math.round(entry.calories)} kcal</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                      <Ionicons name="close-circle-outline" size={18} color={Colors.textDim} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </PekkaCard>
          );
        })}

        {/* Add Custom Food */}
        <TouchableOpacity
          style={styles.customFoodBtn}
          onPress={() => navigation.navigate('AddCustomFood')}
        >
          <Ionicons name="create-outline" size={18} color={Colors.purple} />
          <Text style={styles.customFoodText}>Create Custom Food</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  screenTitle: { fontSize: 32, fontWeight: '900', color: Colors.white, letterSpacing: 4, marginTop: 16 },
  screenSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 24 },
  overviewCard: { marginBottom: 16 },
  overviewContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  macroSummary: { flex: 1, gap: 10 },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot: { width: 6, height: 6, borderRadius: 3 },
  macroLabel: { fontSize: 13, color: Colors.textMuted, flex: 1 },
  macroValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
  waterCard: { marginBottom: 16 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  waterProgress: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  waterButtons: { flexDirection: 'row', gap: 8 },
  waterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.blueAlpha,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  waterBtnText: { fontSize: 12, fontWeight: '700', color: Colors.blue },
  mealCard: { marginBottom: 12 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mealTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  mealCals: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  addFoodBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.blueAlpha },
  addFoodText: { fontSize: 12, fontWeight: '600', color: Colors.blue },
  emptyMeal: { fontSize: 13, color: Colors.textDim, fontStyle: 'italic' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  entryMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  customFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  customFoodText: { fontSize: 14, color: Colors.purple, fontWeight: '600' },
});
