import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../../theme';
import PekkaButton from '../../components/PekkaButton';
import { insertUserProfile, initializeStreaks } from '../../db/database';
import { CommonActions } from '@react-navigation/native';

export default function OnboardingCompleteScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const profileData = route.params?.profileData || {};

  const checkScale = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animated checkmark
    Animated.spring(checkScale, {
      toValue: 1,
      tension: 60,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Content fade in
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getLeagueEmoji = (league: string): string => {
    const map: Record<string, string> = {
      'Rookie': '🪨', 'Warrior': '⚒️', 'Fighter': '🥊',
      'Athlete': '🏃', 'Champion': '🛡️', 'Legend': '🥇',
    };
    return map[league] || '🪨';
  };

  const getLeagueColor = (league: string): string => {
    const map: Record<string, string> = {
      'Rookie': '#8899bb', 'Warrior': '#cd7f32', 'Fighter': '#b0c4d8',
      'Athlete': '#00d4ff', 'Champion': '#a29bfe', 'Legend': '#FFD700',
    };
    return map[league] || '#8899bb';
  };

  const handleEnterArena = async () => {
    try {
      // Save to SQLite
      await insertUserProfile({
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        dob: profileData.dob,
        sex: profileData.sex,
        height_cm: profileData.height_cm,
        weight_kg: profileData.weight_kg,
        target_weight_kg: profileData.target_weight_kg,
        body_fat_pct: profileData.body_fat_pct,
        goal: profileData.goal,
        experience_years: profileData.experience_years,
        training_days_per_week: profileData.training_days_per_week,
        activity_level: profileData.activity_level,
        training_types: profileData.training_types,
        bench_pr: profileData.bench_pr,
        squat_pr: profileData.squat_pr,
        deadlift_pr: profileData.deadlift_pr,
        units: profileData.units,
        profile_photo: profileData.profilePhoto || '',
        league: profileData.league,
        xp: profileData.xp,
        created_at: new Date().toISOString(),
        onboarding_complete: 1,
        calorie_goal: profileData.calorie_goal,
        protein_goal: profileData.protein_goal,
        carbs_goal: profileData.carbs_goal,
        fat_goal: profileData.fat_goal,
        water_goal_ml: profileData.water_goal_ml,
      });

      // Initialize streaks
      await initializeStreaks();

      // Set AsyncStorage flag
      await AsyncStorage.setItem('onboarding_complete', 'true');

      // Navigate to main app (reset stack)
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        })
      );
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Could not save your profile. Please try again.');
    }
  };

  const leagueColor = getLeagueColor(profileData.league);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.step}>6 of 6</Text>

        {/* Animated Checkmark */}
        <Animated.View style={[styles.checkContainer, { transform: [{ scale: checkScale }] }]}>
          <LinearGradient
            colors={[Colors.blue, Colors.purple]}
            style={styles.checkCircle}
          >
            <Text style={styles.checkMark}>✓</Text>
          </LinearGradient>
        </Animated.View>

        {/* Welcome Message */}
        <Animated.View style={[styles.messageContainer, { opacity: contentFade }]}>
          <Text style={styles.welcomeText}>
            Welcome to P.E.K.K.A, <Text style={{ color: Colors.gold }}>{profileData.name}!</Text>
          </Text>

          {/* League Badge */}
          <View style={[styles.leagueBadge, { borderColor: leagueColor }]}>
            <Text style={styles.leagueEmoji}>{getLeagueEmoji(profileData.league)}</Text>
            <Text style={[styles.leagueName, { color: leagueColor }]}>
              {profileData.league}
            </Text>
          </View>

          {/* Feature Cards */}
          <View style={styles.featureRow}>
            {[
              { emoji: '🏠', label: 'Track Daily' },
              { emoji: '💪', label: 'Log Workouts' },
              { emoji: '🥗', label: 'Fuel Right' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Enter Button */}
          <View style={styles.enterButtonWrapper}>
            <LinearGradient
              colors={[Colors.blue, Colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <PekkaButton
                title="ENTER THE ARENA →"
                onPress={handleEnterArena}
                style={styles.enterButton}
                textStyle={styles.enterButtonText}
              />
            </LinearGradient>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  step: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.blue, letterSpacing: 1, textAlign: 'center' },
  checkContainer: { alignItems: 'center', marginVertical: 24 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 40, color: Colors.white, fontWeight: '800' },
  messageContainer: { alignItems: 'center' },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 34,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: Colors.bg3,
    marginTop: 20,
    gap: 8,
  },
  leagueEmoji: { fontSize: 20 },
  leagueName: { fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 36,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.bg4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  featureEmoji: { fontSize: 28, marginBottom: 8 },
  featureLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  enterButtonWrapper: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientButton: {
    borderRadius: 14,
  },
  enterButton: {
    backgroundColor: 'transparent',
  },
  enterButtonText: {
    color: '#000',
    fontWeight: '800',
  },
});
