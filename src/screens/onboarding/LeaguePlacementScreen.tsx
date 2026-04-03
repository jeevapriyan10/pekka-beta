import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '../../theme';
import PekkaButton from '../../components/PekkaButton';
import { computeLeague, LeagueResult } from '../../utils/league';

export default function LeaguePlacementScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const profileData = route.params?.profileData || {};

  const [analyzing, setAnalyzing] = useState(true);
  const [result, setResult] = useState<LeagueResult | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      const leagueResult = computeLeague({
        experienceYears: profileData.experienceLabel || '< 1 year',
        trainingFrequency: profileData.frequencyLabel || '1–2×/week',
        goal: profileData.goal || 'Stay Healthy',
        activityLevel: profileData.activity_level || 'Sedentary',
        weightKg: profileData.weight_kg || 70,
        benchPR: profileData.bench_pr || undefined,
        squatPR: profileData.squat_pr || undefined,
        deadliftPR: profileData.deadlift_pr || undefined,
      });

      setResult(leagueResult);
      setAnalyzing(false);

      // Fade in result
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Pulsing badge animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    navigation.navigate('OnboardingComplete', {
      profileData: {
        ...profileData,
        league: result?.league || 'Rookie',
        xp: result?.xp || 0,
      },
    });
  };

  if (analyzing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.analyzingContainer}>
          <Text style={styles.step}>5 of 6</Text>
          <Text style={styles.title}>Your Starting League</Text>
          <View style={styles.analyzeBox}>
            <Text style={styles.analyzeText}>Analyzing your profile...</Text>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.analyzeHint}>Evaluating experience, strength ratios, and activity data</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView
        style={{ opacity: fadeIn }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>5 of 6</Text>
        <Text style={styles.title}>Your Starting League</Text>

        {/* League Badge */}
        <View style={styles.badgeArea}>
          <Animated.View
            style={[
              styles.badgeGlow,
              {
                transform: [{ scale: scaleAnim }],
                borderColor: result?.color || Colors.blue,
                shadowColor: result?.color || Colors.blue,
              },
            ]}
          >
            <Text style={styles.badgeEmoji}>{result?.emoji}</Text>
          </Animated.View>
          <Text style={[styles.leagueName, { color: result?.color }]}>
            {result?.league}
          </Text>
          <Text style={styles.xpText}>Starting XP: {result?.xp}</Text>
        </View>

        {/* Reasons */}
        <View style={styles.reasonsCard}>
          <Text style={styles.reasonsTitle}>Why this league?</Text>
          {result?.reasons.map((reason, idx) => (
            <View key={idx} style={styles.reasonRow}>
              <Text style={styles.reasonBullet}>•</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <PekkaButton
          title="ACCEPT PLACEMENT"
          onPress={handleAccept}
          style={styles.acceptBtn}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.reconsider}>
          <Text style={styles.reconsiderText}>← Reconsider</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  analyzingContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  step: { fontSize: 12, fontFamily: Fonts.mono, color: Colors.blue, marginTop: 20, letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.white, marginTop: 8 },
  analyzeBox: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
  },
  analyzeText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.bg5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.blue,
    borderRadius: 3,
  },
  analyzeHint: {
    fontSize: 12,
    color: Colors.textDim,
    marginTop: 16,
    textAlign: 'center',
  },
  badgeArea: {
    alignItems: 'center',
    marginVertical: 40,
  },
  badgeGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeEmoji: {
    fontSize: 52,
  },
  leagueName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 16,
    textTransform: 'uppercase',
  },
  xpText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 8,
    fontWeight: '600',
  },
  reasonsCard: {
    backgroundColor: Colors.bg4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reasonBullet: {
    fontSize: 14,
    color: Colors.blue,
    marginRight: 10,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    flex: 1,
  },
  acceptBtn: {
    marginBottom: 16,
  },
  reconsider: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  reconsiderText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
