import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import { calculateTDEE, calculateCalorieTarget, calculateMacros } from '../../utils/tdee';

export default function GoalsScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const profileData = route.params?.profileData || {};
  const isImperial = profileData.units === 'imperial';

  const [benchPR, setBenchPR] = useState('');
  const [squatPR, setSquatPR] = useState('');
  const [deadliftPR, setDeadliftPR] = useState('');
  const [waterGoal, setWaterGoal] = useState('2500');
  const [calorieOverride, setCalorieOverride] = useState('');

  const tdeeInput = {
    weightKg: profileData.weight_kg || 70,
    heightCm: profileData.height_cm || 170,
    age: profileData.age || 25,
    sex: profileData.sex || 'Male',
    activityLevel: profileData.activity_level || 'Moderately Active',
    goal: profileData.goal || 'Stay Healthy',
  };

  const tdee = useMemo(() => calculateTDEE(tdeeInput), [profileData]);
  const recommendedCalories = useMemo(() => calculateCalorieTarget(tdeeInput), [profileData]);
  const currentCalories = calorieOverride ? parseInt(calorieOverride) || recommendedCalories : recommendedCalories;
  const macros = useMemo(() => calculateMacros(currentCalories, profileData.goal || 'Stay Healthy'), [currentCalories, profileData.goal]);

  const parsePR = (value: string): number => {
    const v = parseFloat(value);
    if (isNaN(v) || v <= 0) return 0;
    return isImperial ? Math.round(v / 2.205 * 10) / 10 : v;
  };

  const handleContinue = () => {
    navigation.navigate('LeaguePlacement', {
      profileData: {
        ...profileData,
        bench_pr: parsePR(benchPR),
        squat_pr: parsePR(squatPR),
        deadlift_pr: parsePR(deadliftPR),
        water_goal_ml: parseInt(waterGoal) || 2500,
        calorie_goal: currentCalories,
        protein_goal: macros.proteinG,
        carbs_goal: macros.carbsG,
        fat_goal: macros.fatG,
      },
    });
  };

  const unitLabel = isImperial ? 'lbs' : 'kg';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.step}>4 of 6</Text>
        <Text style={styles.title}>Your PRs & Goals</Text>
        <Text style={styles.subtitle}>Optional but helps us place you in the right league</Text>

        {/* PR Fields */}
        <PekkaInput
          label={`Bench Press Max (${unitLabel})`}
          value={benchPR}
          onChangeText={setBenchPR}
          placeholder="Optional"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Leave blank if you don't know</Text>

        <PekkaInput
          label={`Squat Max (${unitLabel})`}
          value={squatPR}
          onChangeText={setSquatPR}
          placeholder="Optional"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Leave blank if you don't know</Text>

        <PekkaInput
          label={`Deadlift Max (${unitLabel})`}
          value={deadliftPR}
          onChangeText={setDeadliftPR}
          placeholder="Optional"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Leave blank if you don't know</Text>

        {/* Water Goal */}
        <PekkaInput
          label="Daily Water Goal (ml)"
          value={waterGoal}
          onChangeText={setWaterGoal}
          placeholder="2500"
          keyboardType="numeric"
        />

        {/* TDEE & Calories */}
        <View style={styles.tdeeCard}>
          <Text style={styles.tdeeLabel}>Estimated TDEE</Text>
          <Text style={styles.tdeeValue}>{tdee} kcal/day</Text>
          <Text style={styles.tdeeDesc}>
            Based on your stats, activity level, and goal ({profileData.goal})
          </Text>
        </View>

        <PekkaInput
          label="Calorie Goal (kcal)"
          value={calorieOverride || recommendedCalories.toString()}
          onChangeText={setCalorieOverride}
          placeholder={recommendedCalories.toString()}
          keyboardType="numeric"
        />
        {calorieOverride ? (
          <TouchableOpacity onPress={() => setCalorieOverride('')}>
            <Text style={styles.useRecommended}>↩ Use recommended ({recommendedCalories} kcal)</Text>
          </TouchableOpacity>
        ) : null}

        {/* Macro Split */}
        <View style={styles.macroCard}>
          <Text style={styles.macroTitle}>Daily Macro Targets</Text>
          <View style={styles.macroBarContainer}>
            <View style={[styles.macroBar, { flex: macros.proteinPct, backgroundColor: Colors.blue }]} />
            <View style={[styles.macroBar, { flex: macros.carbsPct, backgroundColor: Colors.gold }]} />
            <View style={[styles.macroBar, { flex: macros.fatPct, backgroundColor: Colors.orange }]} />
          </View>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.blue }]} />
              <Text style={styles.macroName}>Protein</Text>
              <Text style={styles.macroValue}>{macros.proteinG}g ({macros.proteinPct}%)</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.gold }]} />
              <Text style={styles.macroName}>Carbs</Text>
              <Text style={styles.macroValue}>{macros.carbsG}g ({macros.carbsPct}%)</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroDot, { backgroundColor: Colors.orange }]} />
              <Text style={styles.macroName}>Fat</Text>
              <Text style={styles.macroValue}>{macros.fatG}g ({macros.fatPct}%)</Text>
            </View>
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <PekkaButton
            title="CONTINUE"
            onPress={handleContinue}
            style={styles.continueBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  step: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.blue, marginTop: 20, letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.white, marginTop: 8 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 8, marginBottom: 24 },
  hint: { fontSize: 12, color: Colors.textDim, marginTop: -12, marginBottom: 16, marginLeft: 4 },
  tdeeCard: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  tdeeLabel: { fontSize: 12, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  tdeeValue: { fontSize: 36, fontWeight: '800', color: Colors.blue, marginTop: 4 },
  tdeeDesc: { fontSize: 12, color: Colors.textDim, marginTop: 8, textAlign: 'center' },
  useRecommended: { fontSize: 13, color: Colors.blue, marginTop: -8, marginBottom: 16, fontWeight: '600' },
  macroCard: {
    backgroundColor: Colors.bg4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  macroTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  macroBarContainer: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    gap: 2,
  },
  macroBar: { height: 8, borderRadius: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { alignItems: 'center' },
  macroDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  macroName: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  macroValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  continueBtn: { flex: 1, marginLeft: 20 },
});
