import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import CircularProgress from '../../components/CircularProgress';
import {
  getUserProfile,
  UserProfile,
  getWorkoutCount,
  getDailyNutritionSummary,
  getDailyWaterIntake,
  getStreak,
  getRecentWorkouts,
} from '../../db/database';
import { getGreeting, getTodayString, getDayOfWeek } from '../../utils/formatters';
import { getLeagueForXP } from '../../utils/xp';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterIntake, setWaterIntake] = useState(0);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [recentWorkoutCount, setRecentWorkoutCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = getTodayString();
      const [prof, wCount, nutri, water, streak, recent] = await Promise.all([
        getUserProfile(),
        getWorkoutCount(),
        getDailyNutritionSummary(today),
        getDailyWaterIntake(today),
        getStreak('workout'),
        getRecentWorkouts(7),
      ]);
      setProfile(prof);
      setWorkoutCount(wCount);
      setNutrition(nutri);
      setWaterIntake(water);
      setWorkoutStreak(streak?.current_streak || 0);
      setRecentWorkoutCount(recent.length);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const leagueInfo = getLeagueForXP(profile?.xp || 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{profile?.name || 'Athlete'}</Text>
          </View>
          <View style={styles.leaguePill}>
            <Text style={styles.leagueEmoji}>{leagueInfo.emoji}</Text>
            <Text style={[styles.leagueText, { color: leagueInfo.color }]}>{leagueInfo.name}</Text>
          </View>
        </View>

        {/* Date */}
        <Text style={styles.dateText}>{getDayOfWeek()}, {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</Text>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <PekkaCard style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{workoutCount}</Text>
            <Text style={styles.quickStatLabel}>Workouts</Text>
          </PekkaCard>
          <PekkaCard style={styles.quickStat}>
            <Text style={[styles.quickStatValue, { color: Colors.gold }]}>{profile?.xp || 0}</Text>
            <Text style={styles.quickStatLabel}>Total XP</Text>
          </PekkaCard>
          <PekkaCard style={styles.quickStat}>
            <Text style={[styles.quickStatValue, { color: Colors.orange }]}>{workoutStreak}</Text>
            <Text style={styles.quickStatLabel}>Streak 🔥</Text>
          </PekkaCard>
        </View>

        {/* Nutrition Progress */}
        <PekkaCard style={styles.nutritionCard}>
          <Text style={styles.cardTitle}>Today's Nutrition</Text>
          <View style={styles.nutritionContent}>
            <CircularProgress
              size={110}
              strokeWidth={10}
              color={Colors.green}
              value={nutrition.calories}
              max={profile?.calorie_goal || 2000}
              label={`${Math.round(nutrition.calories)}`}
              sublabel="kcal"
            />
            <View style={styles.macroColumn}>
              <View style={styles.macroRow}>
                <View style={[styles.macroDot, { backgroundColor: Colors.blue }]} />
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.protein)}g / {profile?.protein_goal || 150}g</Text>
              </View>
              <View style={styles.macroProgressBg}>
                <View style={[styles.macroProgressFill, { width: `${Math.min(100, (nutrition.protein / (profile?.protein_goal || 150)) * 100)}%`, backgroundColor: Colors.blue }]} />
              </View>

              <View style={styles.macroRow}>
                <View style={[styles.macroDot, { backgroundColor: Colors.gold }]} />
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.carbs)}g / {profile?.carbs_goal || 250}g</Text>
              </View>
              <View style={styles.macroProgressBg}>
                <View style={[styles.macroProgressFill, { width: `${Math.min(100, (nutrition.carbs / (profile?.carbs_goal || 250)) * 100)}%`, backgroundColor: Colors.gold }]} />
              </View>

              <View style={styles.macroRow}>
                <View style={[styles.macroDot, { backgroundColor: Colors.orange }]} />
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{Math.round(nutrition.fat)}g / {profile?.fat_goal || 65}g</Text>
              </View>
              <View style={styles.macroProgressBg}>
                <View style={[styles.macroProgressFill, { width: `${Math.min(100, (nutrition.fat / (profile?.fat_goal || 65)) * 100)}%`, backgroundColor: Colors.orange }]} />
              </View>
            </View>
          </View>
        </PekkaCard>

        {/* Water Progress */}
        <PekkaCard style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.cardTitle}>Hydration</Text>
              <Text style={styles.waterSubtitle}>
                {waterIntake}ml / {profile?.water_goal_ml || 2500}ml
              </Text>
            </View>
            <CircularProgress
              size={64}
              strokeWidth={6}
              color={Colors.blue}
              value={waterIntake}
              max={profile?.water_goal_ml || 2500}
              label={`${Math.round((waterIntake / (profile?.water_goal_ml || 2500)) * 100)}%`}
            />
          </View>
        </PekkaCard>

        {/* Weekly Activity */}
        <PekkaCard style={styles.activityCard}>
          <Text style={styles.cardTitle}>This Week</Text>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <Ionicons name="barbell-outline" size={24} color={Colors.blue} />
              <Text style={styles.activityValue}>{recentWorkoutCount}</Text>
              <Text style={styles.activityLabel}>Workouts</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <Ionicons name="flame-outline" size={24} color={Colors.orange} />
              <Text style={styles.activityValue}>{workoutStreak}</Text>
              <Text style={styles.activityLabel}>Day Streak</Text>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <Ionicons name="trophy-outline" size={24} color={Colors.gold} />
              <Text style={styles.activityValue}>{profile?.xp || 0}</Text>
              <Text style={styles.activityLabel}>XP</Text>
            </View>
          </View>
        </PekkaCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  greeting: { fontSize: 14, color: Colors.textMuted, fontWeight: '500' },
  name: { fontSize: 26, fontWeight: '800', color: Colors.white, marginTop: 2 },
  leaguePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  leagueEmoji: { fontSize: 16 },
  leagueText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  dateText: { fontSize: 13, color: Colors.textDim, marginBottom: 20 },
  quickStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickStat: { flex: 1, alignItems: 'center', padding: 16 },
  quickStatValue: { fontSize: 24, fontWeight: '800', color: Colors.blue },
  quickStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  nutritionCard: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  nutritionContent: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  macroColumn: { flex: 1 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  macroDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  macroLabel: { fontSize: 12, color: Colors.textMuted, flex: 1 },
  macroValue: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  macroProgressBg: { height: 4, backgroundColor: Colors.bg5, borderRadius: 2, marginBottom: 10 },
  macroProgressFill: { height: 4, borderRadius: 2 },
  waterCard: { marginBottom: 16 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  activityCard: { marginBottom: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityItem: { flex: 1, alignItems: 'center' },
  activityValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 6 },
  activityLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  activityDivider: { width: 1, height: 40, backgroundColor: Colors.border },
});
