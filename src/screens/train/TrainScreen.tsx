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
import EmptyState from '../../components/EmptyState';
import { getWorkouts, getCardioLogs, Workout, CardioLog } from '../../db/database';
import { formatDate, formatTime } from '../../utils/formatters';

export default function TrainScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [recentCardio, setRecentCardio] = useState<CardioLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [workouts, cardio] = await Promise.all([
        getWorkouts(5),
        getCardioLogs(5),
      ]);
      setRecentWorkouts(workouts);
      setRecentCardio(cardio);
    } catch (error) {
      console.error('Error loading train data:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>TRAIN</Text>
        <Text style={styles.screenSubtitle}>Build strength. Track progress.</Text>

        {/* Action Cards */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('WorkoutSession')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: Colors.blueAlpha }]}>
              <Ionicons name="add-circle-outline" size={28} color={Colors.blue} />
            </View>
            <Text style={styles.actionTitle}>New Workout</Text>
            <Text style={styles.actionDesc}>Start logging</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('ExerciseLibrary')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: Colors.purpleAlpha }]}>
              <Ionicons name="library-outline" size={28} color={Colors.purple} />
            </View>
            <Text style={styles.actionTitle}>Exercises</Text>
            <Text style={styles.actionDesc}>60+ exercises</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('WorkoutHistory')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: Colors.goldAlpha }]}>
              <Ionicons name="time-outline" size={28} color={Colors.gold} />
            </View>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionDesc}>Past workouts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Cardio')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: Colors.greenAlpha }]}>
              <Ionicons name="heart-outline" size={28} color={Colors.green} />
            </View>
            <Text style={styles.actionTitle}>Cardio</Text>
            <Text style={styles.actionDesc}>Log sessions</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Workouts */}
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        {recentWorkouts.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="No workouts yet"
            subtitle="Start your first workout to see it here"
          />
        ) : (
          recentWorkouts.map((w) => (
            <PekkaCard key={w.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{w.name || 'Workout'}</Text>
                <Text style={styles.workoutDate}>{formatDate(w.date)}</Text>
              </View>
              <View style={styles.workoutStats}>
                <View style={styles.workoutStat}>
                  <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.workoutStatText}>{formatTime(w.duration_seconds)}</Text>
                </View>
                <View style={styles.workoutStat}>
                  <Ionicons name="barbell-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.workoutStatText}>{Math.round(w.total_volume)} kg vol</Text>
                </View>
                {w.rpe > 0 && (
                  <View style={styles.workoutStat}>
                    <Ionicons name="flash-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.workoutStatText}>RPE {w.rpe}</Text>
                  </View>
                )}
              </View>
            </PekkaCard>
          ))
        )}

        {/* Recent Cardio */}
        {recentCardio.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Cardio</Text>
            {recentCardio.map((c) => (
              <PekkaCard key={c.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutName}>{c.type}</Text>
                  <Text style={styles.workoutDate}>{formatDate(c.date)}</Text>
                </View>
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStat}>
                    <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.workoutStatText}>{c.duration_minutes} min</Text>
                  </View>
                  {c.distance_km > 0 && (
                    <View style={styles.workoutStat}>
                      <Ionicons name="navigate-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.workoutStatText}>{c.distance_km} km</Text>
                    </View>
                  )}
                  {c.calories > 0 && (
                    <View style={styles.workoutStat}>
                      <Ionicons name="flame-outline" size={14} color={Colors.textMuted} />
                      <Text style={styles.workoutStatText}>{c.calories} cal</Text>
                    </View>
                  )}
                </View>
              </PekkaCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  screenTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 4,
    marginTop: 16,
  },
  screenSubtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, marginBottom: 24 },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.bg4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  actionDesc: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  workoutCard: { marginBottom: 10 },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  workoutDate: { fontSize: 12, color: Colors.textDim },
  workoutStats: { flexDirection: 'row', gap: 16 },
  workoutStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  workoutStatText: { fontSize: 12, color: Colors.textMuted },
});
