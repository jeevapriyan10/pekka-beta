import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import EmptyState from '../../components/EmptyState';
import { getWorkouts, deleteWorkout, Workout } from '../../db/database';
import { formatDate, formatTime } from '../../utils/formatters';

export default function WorkoutHistoryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    try {
      const data = await getWorkouts(100);
      setWorkouts(data);
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWorkout(id);
            await loadWorkouts();
          } catch (error) {
            Alert.alert('Error', 'Could not delete workout');
          }
        },
      },
    ]);
  };

  const renderWorkout = ({ item }: { item: Workout }) => (
    <PekkaCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.workoutName}>{item.name || 'Workout'}</Text>
          <Text style={styles.workoutDate}>{formatDate(item.date)}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color={Colors.textDim} />
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatTime(item.duration_seconds)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(item.total_volume)}</Text>
          <Text style={styles.statLabel}>Volume (kg)</Text>
        </View>
        {item.rpe > 0 && (
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.rpe}</Text>
            <Text style={styles.statLabel}>RPE</Text>
          </View>
        )}
      </View>
      {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
    </PekkaCard>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Workout History</Text>
        <View style={{ width: 24 }} />
      </View>

      {workouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workout history"
          subtitle="Complete your first workout to see it here"
        />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderWorkout}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  workoutName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  workoutDate: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 20 },
  stat: {},
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.blue },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  notes: { fontSize: 13, color: Colors.textDim, marginTop: 10, fontStyle: 'italic' },
});
