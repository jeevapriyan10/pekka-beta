import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import PekkaCard from '../../components/PekkaCard';
import {
  insertWorkout,
  insertWorkoutExercise,
  insertWorkoutSet,
  getExercises,
  Exercise,
  updateStreak,
} from '../../db/database';
import { getTodayString, formatTime } from '../../utils/formatters';
import { grantXP } from '../../utils/xp';

interface WorkoutExEntry {
  exercise: Exercise;
  sets: { weight: string; reps: string; isWarmup: boolean }[];
}

export default function WorkoutSessionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExEntry[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [rpe, setRpe] = useState('');
  const [notes, setNotes] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadExercises();
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadExercises = async () => {
    try {
      const exs = await getExercises();
      setExercises(exs);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    setWorkoutExercises(prev => [
      ...prev,
      { exercise, sets: [{ weight: '', reps: '', isWarmup: false }] },
    ]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const addSet = (exIdx: number) => {
    setWorkoutExercises(prev => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: [...copy[exIdx].sets, { weight: '', reps: '', isWarmup: false }],
      };
      return copy;
    });
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    setWorkoutExercises(prev => {
      const copy = [...prev];
      copy[exIdx] = {
        ...copy[exIdx],
        sets: copy[exIdx].sets.filter((_, i) => i !== setIdx),
      };
      return copy;
    });
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'weight' | 'reps', value: string) => {
    setWorkoutExercises(prev => {
      const copy = [...prev];
      const sets = [...copy[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      copy[exIdx] = { ...copy[exIdx], sets };
      return copy;
    });
  };

  const removeExercise = (exIdx: number) => {
    setWorkoutExercises(prev => prev.filter((_, i) => i !== exIdx));
  };

  const saveWorkout = async () => {
    if (workoutExercises.length === 0) {
      Alert.alert('Empty Workout', 'Add at least one exercise before saving.');
      return;
    }

    try {
      if (timerRef.current) clearInterval(timerRef.current);

      let totalVolume = 0;
      workoutExercises.forEach(we => {
        we.sets.forEach(s => {
          const w = parseFloat(s.weight) || 0;
          const r = parseInt(s.reps) || 0;
          if (!s.isWarmup) totalVolume += w * r;
        });
      });

      const today = getTodayString();
      const workoutId = await insertWorkout({
        name: workoutName || 'Workout',
        date: today,
        duration_seconds: elapsedSeconds,
        total_volume: totalVolume,
        notes,
        rpe: parseInt(rpe) || 0,
      });

      for (let i = 0; i < workoutExercises.length; i++) {
        const we = workoutExercises[i];
        const weId = await insertWorkoutExercise({
          workout_id: workoutId,
          exercise_id: we.exercise.id,
          exercise_name: we.exercise.name,
          order_index: i,
        });

        for (let j = 0; j < we.sets.length; j++) {
          const s = we.sets[j];
          await insertWorkoutSet({
            workout_exercise_id: weId,
            set_number: j + 1,
            weight_kg: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps) || 0,
            is_warmup: s.isWarmup ? 1 : 0,
          });
        }
      }

      await updateStreak('workout', today);
      await grantXP('workout_completed');

      Alert.alert('Workout Saved! 💪', `Volume: ${Math.round(totalVolume)} kg\nDuration: ${formatTime(elapsedSeconds)}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Could not save workout. Please try again.');
    }
  };

  const filteredExercises = exercises.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <PekkaButton title="SAVE" onPress={saveWorkout} style={styles.saveBtn} textStyle={{ fontSize: 12 }} />
        </View>

        <PekkaInput
          label="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="e.g. Push Day, Leg Day..."
        />

        {/* Exercises */}
        {workoutExercises.map((we, exIdx) => (
          <PekkaCard key={exIdx} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{we.exercise.name}</Text>
              <TouchableOpacity onPress={() => removeExercise(exIdx)}>
                <Ionicons name="close-circle" size={22} color={Colors.red} />
              </TouchableOpacity>
            </View>
            <Text style={styles.muscleGroup}>{we.exercise.muscle_group}</Text>

            {/* Sets Header */}
            <View style={styles.setHeaderRow}>
              <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>KG</Text>
              <Text style={[styles.setHeaderText, { flex: 1 }]}>REPS</Text>
              <Text style={[styles.setHeaderText, { flex: 0.3 }]}></Text>
            </View>

            {we.sets.map((set, setIdx) => (
              <View key={setIdx} style={styles.setRow}>
                <Text style={[styles.setNumber, { flex: 0.5 }]}>{setIdx + 1}</Text>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <PekkaInput
                    value={set.weight}
                    onChangeText={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.setInput}
                  />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <PekkaInput
                    value={set.reps}
                    onChangeText={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                    placeholder="0"
                    keyboardType="numeric"
                    style={styles.setInput}
                  />
                </View>
                <TouchableOpacity onPress={() => removeSet(exIdx, setIdx)} style={{ flex: 0.3 }}>
                  <Ionicons name="trash-outline" size={16} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIdx)}>
              <Ionicons name="add" size={16} color={Colors.blue} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </PekkaCard>
        ))}

        {/* Add Exercise Button */}
        {!showExercisePicker ? (
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setShowExercisePicker(true)}
          >
            <Ionicons name="add-circle-outline" size={22} color={Colors.blue} />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        ) : (
          <PekkaCard style={styles.pickerCard}>
            <PekkaInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
            />
            <ScrollView style={styles.exerciseList} nestedScrollEnabled>
              {filteredExercises.slice(0, 15).map(ex => (
                <TouchableOpacity key={ex.id} style={styles.exerciseOption} onPress={() => addExercise(ex)}>
                  <Text style={styles.exerciseOptionName}>{ex.name}</Text>
                  <Text style={styles.exerciseOptionGroup}>{ex.muscle_group}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </PekkaCard>
        )}

        {/* RPE & Notes */}
        <View style={styles.bottomSection}>
          <PekkaInput
            label="RPE (1-10)"
            value={rpe}
            onChangeText={setRpe}
            placeholder="8"
            keyboardType="numeric"
          />
          <PekkaInput
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it feel?"
            multiline
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  timer: { fontSize: 20, fontWeight: '800', color: Colors.blue, fontFamily: Fonts.mono },
  saveBtn: { paddingHorizontal: 20, paddingVertical: 10, minHeight: 38 },
  exerciseCard: { marginBottom: 12 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  muscleGroup: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setHeaderText: { fontSize: 10, color: Colors.textDim, fontWeight: '600', letterSpacing: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  setNumber: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  setInput: { paddingVertical: 8, paddingHorizontal: 10, fontSize: 14, marginBottom: 0 },
  addSetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginTop: 4 },
  addSetText: { fontSize: 13, color: Colors.blue, fontWeight: '600' },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addExerciseText: { fontSize: 15, color: Colors.blue, fontWeight: '600' },
  pickerCard: { marginBottom: 20 },
  exerciseList: { maxHeight: 200 },
  exerciseOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exerciseOptionName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  exerciseOptionGroup: { fontSize: 12, color: Colors.textMuted },
  cancelText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 10 },
  bottomSection: { marginTop: 8 },
});
