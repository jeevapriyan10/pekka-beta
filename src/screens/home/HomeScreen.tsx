import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import CircularProgress from '../../components/CircularProgress';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import {
  getUserProfile,
  UserProfile,
  getDailyNutritionSummary,
  getDailyWaterIntake,
  getStreak,
  getRecentWorkouts,
  Workout,
  FoodEntry,
  getFoodEntriesByDate,
  insertWaterLog,
  insertBodyMeasurement,
  getDailySteps,
  Streak,
} from '../../db/database';
import { getGreeting, getTodayString, getDayOfWeek, isWithinDays, formatDate } from '../../utils/formatters';
import { getLeagueForXP } from '../../utils/xp';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FormattedStreak {
  workout: Streak | null;
  nutrition: Streak | null;
  water: Streak | null;
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nutrition, setNutrition] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterIntake, setWaterIntake] = useState(0);
  const [steps, setSteps] = useState(0);
  const [streaks, setStreaks] = useState<FormattedStreak>({ workout: null, nutrition: null, water: null });
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [last7DaysCalories, setLast7DaysCalories] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [insight, setInsight] = useState('');

  // FAB / Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeModalType, setActiveModalType] = useState<null | 'menu' | 'water' | 'weight'>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;

  const [weightInput, setWeightInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      const today = getTodayString();
      const [
        prof,
        nutri,
        water,
        dailySteps,
        workoutS,
        nutritionS,
        waterS,
        recentW,
      ] = await Promise.all([
        getUserProfile(),
        getDailyNutritionSummary(today),
        getDailyWaterIntake(today),
        getDailySteps(today),
        getStreak('workout'),
        getStreak('nutrition'),
        getStreak('water'),
        getRecentWorkouts(10), // fetch a bit more for insights
      ]);

      setProfile(prof);
      setNutrition(nutri);
      setWaterIntake(water);
      setSteps(dailySteps);
      setStreaks({ workout: workoutS, nutrition: nutritionS, water: waterS });
      setRecentWorkouts(recentW);

      // Load last 7 days calories
      const last7Cals = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayNutri = await getDailyNutritionSummary(dateStr);
        last7Cals.push(dayNutri.calories);
      }
      setLast7DaysCalories(last7Cals);

      // Generate Insight
      if (prof) {
        setInsight(generateInsight(prof, nutri.calories, nutri.protein, water, recentW, [workoutS, nutritionS, waterS]));
      }
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

  const generateInsight = (
    prof: UserProfile,
    todayCals: number,
    todayPro: number,
    todayWater: number,
    recentW: Workout[],
    strks: (Streak | null)[]
  ) => {
    const insights = [];
    const workoutStreak = strks[0];

    if (todayPro < prof.protein_goal * 0.5 && new Date().getHours() > 14) {
      insights.push(`You're at ${Math.round(todayPro)}g protein — aim for ${Math.round(prof.protein_goal - todayPro)}g more before end of day.`);
    }

    if (todayWater < prof.water_goal_ml * 0.4 && new Date().getHours() > 12) {
      insights.push(`Only ${(todayWater / 1000).toFixed(1)}L water logged. Hydration affects strength by up to 15% — drink up!`);
    }

    if (workoutStreak && workoutStreak.current_streak >= 3) {
      insights.push(`🔥 ${workoutStreak.current_streak}-day workout streak! Consistency is the #1 predictor of progress. Don't break it.`);
    }

    const last3DaysWorkouts = recentW.filter(w => isWithinDays(w.date, 3));
    if (last3DaysWorkouts.length >= 3) {
      insights.push(`3 workouts in 3 days — excellent! Consider a light recovery day tomorrow. Muscles grow during rest.`);
    }

    if (prof.goal === 'Build Muscle' && todayCals < prof.calorie_goal * 0.8 && new Date().getHours() > 20) {
      insights.push(`You're ${Math.round(prof.calorie_goal - todayCals)} kcal under your muscle target. Don't undereat — you need fuel to grow.`);
    }

    if (insights.length === 0) {
      const motivations = [
        "Every rep, every meal, every logged drop of water builds the version of you that you're working toward.",
        "Progress isn't always visible in the mirror — but it's always visible in your logs. Keep showing up.",
        `${getLeagueForXP(prof.xp).name} level athlete in the making. Stay consistent.`,
        "The best workout is the one you actually do. Log it, own it, grow."
      ];
      insights.push(motivations[new Date().getDay() % motivations.length]);
    }

    return insights[0];
  };

  const openModal = (type: 'menu' | 'water' | 'weight') => {
    setActiveModalType(type);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setActiveModalType(null);
    });
  };

  const logWater = async (amount: number) => {
    await insertWaterLog(getTodayString(), amount);
    closeModal();
    onRefresh();
  };

  const logWeight = async () => {
    const w = parseFloat(weightInput);
    if (!isNaN(w) && w > 0) {
      await insertBodyMeasurement({
        date: getTodayString(),
        weight_kg: w
      });
      closeModal();
      setWeightInput('');
      onRefresh();
    }
  };

  const leagueInfo = getLeagueForXP(profile?.xp || 0);
  const workoutToday = recentWorkouts.find(w => w.date === getTodayString());
  const lastWorkout = recentWorkouts.find(w => w.date !== getTodayString());

  const maxWeeklyCals = Math.max(...last7DaysCalories, profile?.calorie_goal || 2000) * 1.1;

  // Today's Macro Math
  const proPct = profile?.protein_goal ? Math.min(100, (nutrition.protein / profile.protein_goal) * 100) : 0;
  const carbPct = profile?.carbs_goal ? Math.min(100, (nutrition.carbs / profile.carbs_goal) * 100) : 0;
  const fatPct = profile?.fat_goal ? Math.min(100, (nutrition.fat / profile.fat_goal) * 100) : 0;
  const noMeals = nutrition.calories === 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.blue} />}
      >
        {/* SECTION 1 - Greeting Header */}
        <LinearGradient
          colors={[Colors.bg, Colors.bg]}
          style={styles.headerGradient}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>
                {getGreeting()}, {profile?.name || 'Athlete'} 💪
              </Text>
              <Text style={styles.dateText}>
                {getDayOfWeek().toUpperCase()}, {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
              </Text>
              <View style={styles.leagueBadge}>
                <Text style={styles.leagueBadgeEmoji}>{leagueInfo.emoji}</Text>
                <Text style={[styles.leagueBadgeText, { color: leagueInfo.color }]}>{leagueInfo.name.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.bellIcon}>
                <Ionicons name="notifications-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={20} color={Colors.bg} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* SECTION 2 - Four Progress Rings */}
        <PekkaCard style={styles.ringsCard}>
          <View style={styles.ringsGrid}>
            <View style={styles.ringWrapper}>
              <CircularProgress
                size={80}
                strokeWidth={7}
                color={nutrition.calories > (profile?.calorie_goal || 2000) * 1.1 ? Colors.red : Colors.gold}
                value={nutrition.calories}
                max={profile?.calorie_goal || 2000}
                label={`${Math.round(nutrition.calories)}`}
                sublabel={`/ ${Math.round(profile?.calorie_goal || 2000)} kcal`}
              />
              <Text style={styles.ringPctText}>
                {Math.round((nutrition.calories / (profile?.calorie_goal || 2000)) * 100)}%
              </Text>
            </View>

            <View style={styles.ringWrapper}>
              <CircularProgress
                size={80}
                strokeWidth={7}
                color={Colors.blue}
                value={nutrition.protein}
                max={profile?.protein_goal || 150}
                label={`${Math.round(nutrition.protein)}g`}
                sublabel={`/ ${Math.round(profile?.protein_goal || 150)}g`}
              />
              <Text style={styles.ringPctText}>
                {Math.round((nutrition.protein / (profile?.protein_goal || 150)) * 100)}%
              </Text>
            </View>

            <View style={styles.ringWrapper}>
              <CircularProgress
                size={80}
                strokeWidth={7}
                color={Colors.purple}
                value={waterIntake}
                max={profile?.water_goal_ml || 2500}
                label={`${(waterIntake / 1000).toFixed(1)}L`}
                sublabel={`/ ${(profile?.water_goal_ml || 2500) / 1000}L`}
              />
              <Text style={styles.ringPctText}>
                {Math.round((waterIntake / (profile?.water_goal_ml || 2500)) * 100)}%
              </Text>
            </View>

            <View style={styles.ringWrapper}>
              <CircularProgress
                size={80}
                strokeWidth={7}
                color={Colors.green}
                value={steps}
                max={10000} // Default hardcode or add to profile later
                label={`${steps.toLocaleString()}`}
                sublabel="/ 10,000 steps"
              />
              <Text style={styles.ringPctText}>
                {Math.round((steps / 10000) * 100)}%
              </Text>
            </View>
          </View>
        </PekkaCard>

        {/* SECTION 3 - Today's Macro Breakdown Bar */}
        <PekkaCard style={styles.macrosCard}>
          <View style={styles.sectionHeaderLine}>
            <Text style={styles.sectionTitle}>Today's Macros</Text>
            <Text style={styles.sectionDate}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
          </View>

          {noMeals ? (
            <View style={styles.noMealsContainer}>
              <Text style={styles.noMealsText}>No meals logged yet</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Fuel')}>
                <Text style={styles.logMealLink}>Log Meal →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.macroBarsContainer}>
              {/* Protein */}
              <View style={styles.macroBarRow}>
                <View style={styles.macroLabelBox}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.blue }]} />
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroTrack}>
                  <Animated.View style={[styles.macroFill, { backgroundColor: Colors.blue, width: `${proPct}%` }]} />
                </View>
                <Text style={styles.macroValues}>{Math.round(nutrition.protein)}g / {Math.round(profile?.protein_goal || 150)}g</Text>
              </View>
              {/* Carbs */}
              <View style={styles.macroBarRow}>
                <View style={styles.macroLabelBox}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.gold }]} />
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroTrack}>
                  <Animated.View style={[styles.macroFill, { backgroundColor: Colors.gold, width: `${carbPct}%` }]} />
                </View>
                <Text style={styles.macroValues}>{Math.round(nutrition.carbs)}g / {Math.round(profile?.carbs_goal || 250)}g</Text>
              </View>
              {/* Fat */}
              <View style={styles.macroBarRow}>
                <View style={styles.macroLabelBox}>
                  <View style={[styles.macroDot, { backgroundColor: Colors.orange }]} />
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
                <View style={styles.macroTrack}>
                  <Animated.View style={[styles.macroFill, { backgroundColor: Colors.orange, width: `${fatPct}%` }]} />
                </View>
                <Text style={styles.macroValues}>{Math.round(nutrition.fat)}g / {Math.round(profile?.fat_goal || 65)}g</Text>
              </View>
            </View>
          )}
        </PekkaCard>
        {/* 
        {/* SECTION 4 - Weekly Calorie Chart 
        <PekkaCard style={styles.chartCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.chartContainer}>
            {last7DaysCalories.length === 7 && (
              <Svg width="100%" height="110">
                {/* Goal Line 
                <Line
                  x1="0"
                  y1={100 - ((profile?.calorie_goal || 2000) / maxWeeklyCals) * 80}
                  x2="100%"
                  y2={100 - ((profile?.calorie_goal || 2000) / maxWeeklyCals) * 80}
                  stroke={Colors.gold}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                
                {last7DaysCalories.map((cals, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (6 - i));
                  const isToday = i === 6;
                  const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  const barHeight = maxWeeklyCals > 0 ? (Math.min(cals, maxWeeklyCals) / maxWeeklyCals) * 80 : 0;
                  const barY = 100 - barHeight;
                  const spacing = ((SCREEN_WIDTH - 80) / 7);
                  const xPos = spacing * i + (spacing / 2) - 8; // center bar

                  let fillCol = Colors.purple; // default
                  if (isToday) fillCol = Colors.blue;
                  else if (cals > (profile?.calorie_goal || 2000)) fillCol = Colors.red;
                  else if (cals === 0) fillCol = Colors.bg5;

                  return (
                    <React.Fragment key={i}>
                      {/* Bar bg 
                      <Rect x={xPos} y={20} width={16} height={80} fill={Colors.bg5} rx={4} />
                      {/* Bar fill 
                      {cals > 0 && <Rect x={xPos} y={barY} width={16} height={barHeight} fill={fillCol} rx={4} />}
                      {/* Label 
                      <SvgText
                        x={xPos + 8}
                        y={115}
                        fontSize={9}
                        fill={isToday ? Colors.blue : Colors.textMuted}
                        textAnchor="middle"
                      >
                        {dayStr}
                      </SvgText>
                      {/* Cal num 
                      {cals > 0 && (
                        <SvgText
                          x={xPos + 8}
                          y={barY - 4}
                          fontSize={8}
                          fill={Colors.textMuted}
                          textAnchor="middle"
                        >
                          {Math.round(cals)}
                        </SvgText>
                      )}
                    </React.Fragment>
                  );
                })}
              </Svg>
            )}
          </View>
        </PekkaCard>
*/}
        {/* SECTION 5 - Today's Workout Card */}
        <View style={styles.workoutSection}>
          <Text style={styles.sectionTitle}>TODAY'S WORKOUT</Text>
          {workoutToday ? (
            <View style={styles.loggedWorkoutCard}>
              <View style={styles.loggedWorkoutHeader}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.green} />
                <Text style={styles.loggedWorkoutTitle}>Logged</Text>
                <View style={styles.xpBadge}>
                  <Text style={styles.xpBadgeText}>+30 XP</Text>
                </View>
              </View>
              <Text style={styles.workoutName}>{workoutToday.name}</Text>
              <View style={styles.workoutMetaRow}>
                <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.workoutMetaText}>{Math.round(workoutToday.duration_seconds / 60)} min</Text>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="barbell-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.workoutMetaText}>{workoutToday.total_volume.toLocaleString()} kg</Text>
              </View>
            </View>
          ) : (
            <PekkaCard style={styles.noworkoutCard}>
              <Ionicons name="barbell" size={32} color={Colors.textDim} style={{ marginBottom: 8 }} />
              <Text style={styles.noWorkoutText}>No workout logged today</Text>
              <TouchableOpacity style={styles.startWorkoutBtn} onPress={() => { navigation.navigate('Train'); }}>
                <Text style={styles.startWorkoutText}>Start Workout →</Text>
              </TouchableOpacity>
            </PekkaCard>
          )}

          {lastWorkout && !workoutToday && (
            <View style={styles.recentWorkoutMiniCard}>
              <Text style={styles.recentWorkoutMiniText}>
                Last: {lastWorkout.name} • {formatDate(lastWorkout.date)}
              </Text>
            </View>
          )}
        </View>

        {/* SECTION 6 - AI Insight Card */}
        {insight ? (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>💡 Today's Insight</Text>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            </View>
            <Text style={styles.insightText}>"{insight}"</Text>
          </View>
        ) : null}

        {/* SECTION 7 - Streak Badges */}
        <View style={styles.streaksSection}>
          <Text style={styles.sectionTitle}>STREAKS</Text>
          <View style={styles.streaksRow}>
            {/* Workout */}
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🏋️</Text>
              {streaks.workout?.current_streak && streaks.workout.current_streak > 0 ? (
                <>
                  <Text style={styles.streakNumber}>{streaks.workout.current_streak}</Text>
                  <Text style={styles.streakLabel}>days</Text>
                </>
              ) : (
                <Text style={styles.streakStart}>Start today</Text>
              )}
            </View>
            {/* Nutrition */}
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🥗</Text>
              {streaks.nutrition?.current_streak && streaks.nutrition.current_streak > 0 ? (
                <>
                  <Text style={styles.streakNumber}>{streaks.nutrition.current_streak}</Text>
                  <Text style={styles.streakLabel}>days</Text>
                </>
              ) : (
                <Text style={styles.streakStart}>Start today</Text>
              )}
            </View>
            {/* Water */}
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>💧</Text>
              {streaks.water?.current_streak && streaks.water.current_streak > 0 ? (
                <>
                  <Text style={styles.streakNumber}>{streaks.water.current_streak}</Text>
                  <Text style={styles.streakLabel}>days</Text>
                </>
              ) : (
                <Text style={styles.streakStart}>Start today</Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* SECTION 8 - Quick Log FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal('menu')} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color={Colors.bg} />
      </TouchableOpacity>

      {/* MODAL SHEET */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.modalHandle} />

                {activeModalType === 'menu' && (
                  <View style={styles.menuGrid}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { closeModal(); setTimeout(() => navigation.navigate('Fuel'), 300); }}>
                      <View style={[styles.menuIconBox, { backgroundColor: Colors.greenAlpha }]}>
                        <Ionicons name="restaurant" size={24} color={Colors.green} />
                      </View>
                      <Text style={styles.menuItemText}>Log Food</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => openModal('water')}>
                      <View style={[styles.menuIconBox, { backgroundColor: Colors.purpleAlpha }]}>
                        <Ionicons name="water" size={24} color={Colors.purple} />
                      </View>
                      <Text style={styles.menuItemText}>Log Water</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => { closeModal(); setTimeout(() => navigation.navigate('Train'), 300); }}>
                      <View style={[styles.menuIconBox, { backgroundColor: Colors.blueAlpha }]}>
                        <Ionicons name="barbell" size={24} color={Colors.blue} />
                      </View>
                      <Text style={styles.menuItemText}>Start Workout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => openModal('weight')}>
                      <View style={[styles.menuIconBox, { backgroundColor: Colors.goldAlpha }]}>
                        <Ionicons name="scale" size={24} color={Colors.gold} />
                      </View>
                      <Text style={styles.menuItemText}>Log Weight</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {activeModalType === 'water' && (
                  <View style={styles.waterForm}>
                    <Text style={styles.modalTitle}>Quick Log Water</Text>
                    <View style={styles.waterAmounts}>
                      {[200, 350, 500, 1000].map(amt => (
                        <TouchableOpacity key={amt} style={styles.waterOption} onPress={() => logWater(amt)}>
                          <Text style={styles.waterOptionText}>+{amt} ml</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {activeModalType === 'weight' && (
                  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.weightForm}>
                      <Text style={styles.modalTitle}>Log Weight Today</Text>
                      <PekkaInput
                        value={weightInput}
                        onChangeText={setWeightInput}
                        placeholder={`e.g. ${profile?.weight_kg || 75}`}
                        keyboardType="numeric"
                        style={{ marginBottom: 16 }}
                      />
                      <PekkaButton title="SAVE WEIGHT" onPress={logWeight} disabled={!weightInput} />
                    </View>
                  </KeyboardAvoidingView>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerGradient: {
    paddingBottom: 20,
    marginBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: { fontSize: 24, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  dateText: { fontSize: 13, color: Colors.blue, fontFamily: Fonts.mono, letterSpacing: 1, marginBottom: 8 },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg4,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderColor: Colors.border,
  },
  leagueBadgeEmoji: { fontSize: 12, marginRight: 4 },
  leagueBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bellIcon: { padding: 4 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center'
  },

  ringsCard: { marginBottom: 16, padding: 12 },
  ringsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12,
  },
  ringWrapper: { width: '47%', alignItems: 'center', paddingVertical: 10 },
  ringPctText: { fontSize: 10, color: Colors.textDim, marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 12, marginTop: 4, letterSpacing: 0.5 },

  macrosCard: { marginBottom: 16 },
  sectionHeaderLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionDate: { fontSize: 12, color: Colors.textMuted },
  noMealsContainer: { alignItems: 'center', paddingVertical: 20 },
  noMealsText: { fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  logMealLink: { fontSize: 14, color: Colors.blue, fontWeight: '600' },

  macroBarsContainer: { gap: 12 },
  macroBarRow: { flexDirection: 'row', alignItems: 'center' },
  macroLabelBox: { width: 70, flexDirection: 'row', alignItems: 'center' },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  macroLabel: { fontSize: 12, color: Colors.textMuted },
  macroTrack: { flex: 1, height: 8, backgroundColor: Colors.bg5, borderRadius: 4, marginHorizontal: 12, overflow: 'hidden' },
  macroFill: { height: '100%', borderRadius: 4 },
  macroValues: { width: 65, textAlign: 'right', fontSize: 11, color: Colors.textDim, fontWeight: '600' },

  chartCard: { marginBottom: 16 },
  chartContainer: { height: 125, width: '100%', marginTop: 8 },

  workoutSection: { marginBottom: 16 },
  loggedWorkoutCard: {
    backgroundColor: '#111b18', // slight green tint
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,213,115,0.2)',
  },
  loggedWorkoutHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  loggedWorkoutTitle: { fontSize: 14, fontWeight: '700', color: Colors.green, marginLeft: 6, flex: 1 },
  xpBadge: { backgroundColor: Colors.greenAlpha, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  xpBadgeText: { fontSize: 10, color: Colors.green, fontWeight: '700' },
  workoutName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  workoutMetaRow: { flexDirection: 'row', alignItems: 'center' },
  workoutMetaText: { fontSize: 13, color: Colors.textMuted, marginLeft: 4 },
  metaDot: { fontSize: 12, color: Colors.textDim, marginHorizontal: 8 },

  noworkoutCard: { alignItems: 'center', paddingVertical: 24 },
  noWorkoutText: { fontSize: 14, color: Colors.textMuted, marginBottom: 16 },
  startWorkoutBtn: { backgroundColor: Colors.blueAlpha, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  startWorkoutText: { color: Colors.blue, fontWeight: '700', fontSize: 13 },
  recentWorkoutMiniCard: {
    marginTop: 8, backgroundColor: Colors.bg3, padding: 10, borderRadius: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.blue
  },
  recentWorkoutMiniText: { fontSize: 12, color: Colors.textMuted },

  insightCard: {
    backgroundColor: Colors.bg4,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
    marginBottom: 20,
  },
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: Colors.white },
  aiBadge: { backgroundColor: Colors.goldAlpha, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  aiBadgeText: { fontSize: 9, color: Colors.gold, fontWeight: '800' },
  insightText: { fontSize: 14, color: '#e8e8ff', fontStyle: 'italic', lineHeight: 20 },

  streaksSection: { marginBottom: 20 },
  streaksRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  streakBadge: {
    flex: 1, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  streakEmoji: { fontSize: 24, marginBottom: 4 },
  streakNumber: { fontSize: 20, fontWeight: '800', color: Colors.gold },
  streakLabel: { fontSize: 11, color: Colors.textMuted },
  streakStart: { fontSize: 11, color: Colors.red, marginTop: 4, fontWeight: '600' },

  fab: {
    position: 'absolute',
    bottom: 30, right: 20,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.blue,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.blue, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.textDim,
    alignSelf: 'center', marginBottom: 24,
  },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 },
  menuItem: { width: '46%', alignItems: 'center', backgroundColor: Colors.bg4, padding: 16, borderRadius: 16 },
  menuIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  menuItemText: { fontSize: 14, fontWeight: '600', color: Colors.text },

  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  waterForm: { paddingBottom: 20 },
  waterAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  waterOption: { backgroundColor: Colors.bg4, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: Colors.purpleAlpha },
  waterOptionText: { fontSize: 16, fontWeight: '700', color: Colors.purple },
  weightForm: { paddingBottom: 20 },
});
