import React, { useState } from 'react';
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
import PekkaButton from '../../components/PekkaButton';

const EXPERIENCE_OPTIONS = ['< 1 year', '1 year', '2 years', '3–4 years', '5+ years', '10+ years'];
const FREQUENCY_OPTIONS = ['1–2×/week', '3×/week', '4×/week', '5×/week', '6–7×/week'];
const GOAL_OPTIONS = ['Build Muscle', 'Lose Fat', 'Get Stronger', 'Improve Endurance', 'Athletic Performance', 'Stay Healthy'];
const TRAINING_TYPES = ['Weight Training', 'Calisthenics', 'Cardio', 'Combat Sports', 'Yoga / Mobility', 'HIIT'];
const ACTIVITY_LEVELS = [
  { label: 'Sedentary', desc: 'Office job, no exercise' },
  { label: 'Lightly Active', desc: 'Light exercise 1-3 days' },
  { label: 'Moderately Active', desc: 'Moderate exercise 3-5 days' },
  { label: 'Very Active', desc: 'Hard exercise 6-7 days' },
  { label: 'Extra Active', desc: 'Physical job + training' },
];

export default function TrainingExperienceScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const profileData = route.params?.profileData || {};

  const [experience, setExperience] = useState('');
  const [frequency, setFrequency] = useState('');
  const [goal, setGoal] = useState('');
  const [trainingTypes, setTrainingTypes] = useState<string[]>(['Weight Training']);
  const [activityLevel, setActivityLevel] = useState('');

  const toggleTrainingType = (type: string) => {
    setTrainingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const canContinue = experience && frequency && goal && activityLevel;

  const handleContinue = () => {
    if (!canContinue) return;

    const freqMap: Record<string, number> = {
      '1–2×/week': 2, '3×/week': 3, '4×/week': 4, '5×/week': 5, '6–7×/week': 6,
    };
    const expMap: Record<string, number> = {
      '< 1 year': 0, '1 year': 1, '2 years': 2, '3–4 years': 3, '5+ years': 5, '10+ years': 10,
    };

    navigation.navigate('Goals', {
      profileData: {
        ...profileData,
        experience_years: expMap[experience] || 0,
        experienceLabel: experience,
        training_days_per_week: freqMap[frequency] || 3,
        frequencyLabel: frequency,
        goal,
        training_types: trainingTypes.join(', '),
        activity_level: activityLevel,
      },
    });
  };

  const renderPill = (label: string, isActive: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={onPress}
    >
      <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>3 of 6</Text>
        <Text style={styles.title}>Training Experience</Text>
        <View style={{ height: 24 }} />

        {/* Years of Training */}
        <Text style={styles.sectionTitle}>Years of Training</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          <View style={styles.pillRow}>
            {EXPERIENCE_OPTIONS.map(opt => renderPill(opt, experience === opt, () => setExperience(opt)))}
          </View>
        </ScrollView>

        {/* Training Frequency */}
        <Text style={styles.sectionTitle}>Training Frequency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
          <View style={styles.pillRow}>
            {FREQUENCY_OPTIONS.map(opt => renderPill(opt, frequency === opt, () => setFrequency(opt)))}
          </View>
        </ScrollView>

        {/* Primary Goal */}
        <Text style={styles.sectionTitle}>Primary Goal</Text>
        <View style={styles.goalGrid}>
          {GOAL_OPTIONS.map(opt => renderPill(opt, goal === opt, () => setGoal(opt)))}
        </View>

        {/* Training Types */}
        <Text style={styles.sectionTitle}>Training Types <Text style={styles.multiHint}>(multi-select)</Text></Text>
        <View style={styles.goalGrid}>
          {TRAINING_TYPES.map(opt => renderPill(opt, trainingTypes.includes(opt), () => toggleTrainingType(opt)))}
        </View>

        {/* Activity Level */}
        <Text style={styles.sectionTitle}>Activity Level</Text>
        {ACTIVITY_LEVELS.map(({ label, desc }) => (
          <TouchableOpacity
            key={label}
            style={[styles.radioRow, activityLevel === label && styles.radioRowActive]}
            onPress={() => setActivityLevel(label)}
          >
            <View style={[styles.radioCircle, activityLevel === label && styles.radioCircleActive]}>
              {activityLevel === label && <View style={styles.radioDot} />}
            </View>
            <View style={styles.radioContent}>
              <Text style={[styles.radioLabel, activityLevel === label && styles.radioLabelActive]}>
                {label}
              </Text>
              <Text style={styles.radioDesc}>{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <PekkaButton
            title="CONTINUE"
            onPress={handleContinue}
            disabled={!canContinue}
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 20 },
  multiHint: { fontSize: 12, color: Colors.textDim, fontWeight: '400' },
  pillScroll: { marginBottom: 8 },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.blueAlpha,
    borderColor: Colors.blue,
  },
  pillText: { fontSize: 13, color: Colors.textDim, fontWeight: '600' },
  pillTextActive: { color: Colors.blue },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  radioRowActive: {
    backgroundColor: Colors.blueAlpha,
    borderColor: Colors.blue,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioCircleActive: {
    borderColor: Colors.blue,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.blue,
  },
  radioContent: { flex: 1 },
  radioLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  radioLabelActive: { color: Colors.blue },
  radioDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  continueBtn: { flex: 1, marginLeft: 20 },
});
