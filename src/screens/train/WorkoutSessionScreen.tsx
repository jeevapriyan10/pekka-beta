import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TouchableOpacity,
  Vibration,
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import PekkaButton from '../../components/PekkaButton';
import CircularProgress from '../../components/CircularProgress';
import {
  insertWorkout,
  insertWorkoutExercise,
  insertWorkoutSet,
  insertPersonalRecord,
  getBestPR,
  Exercise,
  updateStreak,
  getExercisesByMuscleGroup,
  searchExercises,
} from '../../db/database';
import { getTodayString, formatTime } from '../../utils/formatters';
import { grantXP, getLeagueForXP } from '../../utils/xp';

// Template Data
const TEMPLATES: Record<string, string[]> = {
  'Push Day': ['Bench Press (Barbell)', 'Incline Bench Press (Dumbbell)', 'Overhead Press (Dumbbell)', 'Lateral Raise (Dumbbell)', 'Tricep Pushdown (Cable)'],
  'Pull Day': ['Deadlift (Barbell)', 'Pull Up', 'Bent Over Row (Barbell)', 'Seated Cable Row', 'Face Pull (Cable)', 'Bicep Curl (Barbell)'],
  'Leg Day': ['Squat (Barbell)', 'Romanian Deadlift (Barbell)', 'Leg Press (Machine)', 'Leg Curl (Machine)', 'Calf Raise (Machine)'],
};

interface SetData {
  id: string;
  weight: string;
  reps: string;
  isWarmup: boolean;
  done: boolean;
}

interface WorkoutExEntry {
  id: string;
  exercise: Exercise;
  sets: SetData[];
}

export default function WorkoutSessionScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  
  // State
  const [workoutName, setWorkoutName] = useState(route.params?.template || 'Workout');
  const [exercises, setExercises] = useState<WorkoutExEntry[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  
  // Rest Timer
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [currentRestDuration, setCurrentRestDuration] = useState(90);

  // Modals / Overlays
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [prBanner, setPrBanner] = useState<{ visible: boolean, text: string }>({ visible: false, text: '' });
  const [earnedXP, setEarnedXP] = useState(0);
  const [prsBroken, setPrsBroken] = useState(0);

  // Refs
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(0.2)).current;
  const prAnim = useRef(new Animated.Value(-100)).current;

  // Init
  useEffect(() => {
    startElapsedTimer();
    pulseAnimation();
    if (route.params?.template) {
      loadTemplate(route.params.template);
    }
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, []);

  const loadTemplate = async (templateName: string) => {
    const list = TEMPLATES[templateName];
    if (!list) return;
    const loaded: WorkoutExEntry[] = [];
    for (const name of list) {
      const hits = await searchExercises(name);
      if (hits.length > 0) {
        loaded.push({
          id: Math.random().toString(),
          exercise: hits[0],
          sets: [{ id: Math.random().toString(), weight: '', reps: '', isWarmup: false, done: false }]
        });
      }
    }
    setExercises(loaded);
  };

  const startElapsedTimer = () => {
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const pulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  };

  const showPRBanner = (text: string) => {
    setPrBanner({ visible: true, text });
    Animated.sequence([
      Animated.spring(prAnim, { toValue: insets.top + 50, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(prAnim, { toValue: -100, duration: 300, useNativeDriver: true }),
    ]).start(() => setPrBanner({ visible: false, text: '' }));
  };

  // Rest Timer Logic
  const startRestTimer = (seconds: number) => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setCurrentRestDuration(seconds);
    setRestSecondsRemaining(seconds);
    setRestTimerActive(true);

    restTimerRef.current = setInterval(() => {
      setRestSecondsRemaining(prev => {
        if (prev <= 1) {
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          setRestTimerActive(false);
          Vibration.vibrate([0, 200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    setRestTimerActive(false);
  };

  // Actions
  const addExerciseFromLibrary = () => {
    navigation.navigate('ExerciseLibrary', {
      onSelectExercise: (ex: Exercise) => {
        setExercises(prev => [...prev, {
          id: Math.random().toString(),
          exercise: ex,
          sets: [{ id: Math.random().toString(), weight: '', reps: '', isWarmup: false, done: false }]
        }]);
      }
    });
  };

  const addSet = (exId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            id: Math.random().toString(),
            weight: lastSet ? lastSet.weight : '',
            reps: lastSet ? lastSet.reps : '',
            isWarmup: false,
            done: false,
          }]
        };
      }
      return ex;
    }));
  };

  const removeSet = (exId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
    recalcVolume();
  };

  const removeExercise = (exId: string) => {
    Alert.alert('Remove Exercise', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
          setExercises(prev => prev.filter(e => e.id !== exId));
          recalcVolume();
        } 
      }
    ]);
  };

  const updateSet = (exId: string, setId: string, field: 'weight'|'reps'|'isWarmup', value: any) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exId) {
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      }
      return ex;
    }));
  };

  const toggleSetDone = async (ex: WorkoutExEntry, setId: string) => {
    let justCompleted = false;
    let completedWeight = 0;
    let completedReps = 0;
    let wasWarmup = false;

    setExercises(prev => prev.map(e => {
      if (e.id === ex.id) {
        return {
          ...e,
          sets: e.sets.map(s => {
            if (s.id === setId) {
              const newDone = !s.done;
              if (newDone && (parseFloat(s.weight) > 0 || parseInt(s.reps) > 0)) {
                justCompleted = true;
                completedWeight = parseFloat(s.weight) || 0;
                completedReps = parseInt(s.reps) || 0;
                wasWarmup = s.isWarmup;
              }
              return { ...s, done: newDone };
            }
            return s;
          })
        };
      }
      return e;
    }));

    setTimeout(recalcVolume, 50);

    if (justCompleted) {
      startRestTimer(currentRestDuration);
      if (!wasWarmup && completedWeight > 0) {
        const best = await getBestPR(ex.exercise.name);
        const oneRM = completedWeight * (1 + completedReps/30);
        if (!best || completedWeight > best.weight_kg || (completedWeight === best.weight_kg && completedReps > best.reps)) {
          showPRBanner(`🏅 NEW PR! ${ex.exercise.name} ${completedWeight}kg × ${completedReps}`);
          setPrsBroken(p => p + 1);
          grantXP('pr_set', 50);
          await insertPersonalRecord({
            exercise_name: ex.exercise.name,
            weight_kg: completedWeight,
            reps: completedReps,
            one_rm: oneRM,
            date: getTodayString()
          });
        }
      }
    }
  };

  const recalcVolume = () => {
    let vol = 0;
    exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.done && !s.isWarmup) {
          vol += (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0);
        }
      });
    });
    setTotalVolume(vol);
  };

  const handleFinish = async () => {
    let doneSets = 0;
    exercises.forEach(ex => doneSets += ex.sets.filter(s => s.done).length);
    
    if (doneSets === 0) {
      Alert.alert('Empty Workout', 'Log at least 1 set before finishing.');
      return;
    }

    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    if (restTimerRef.current) clearInterval(restTimerRef.current);

    try {
      const wid = await insertWorkout({
        name: workoutName,
        date: getTodayString(),
        duration_seconds: elapsedSeconds,
        total_volume: totalVolume,
        notes: '',
        rpe: 0,
      });

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const hasDoneSets = ex.sets.some(s => s.done);
        if (!hasDoneSets) continue;

        const weId = await insertWorkoutExercise({
          workout_id: wid,
          exercise_id: ex.exercise.id,
          exercise_name: ex.exercise.name,
          order_index: i
        });

        for (let j = 0; j < ex.sets.length; j++) {
          const s = ex.sets[j];
          if (s.done) {
            await insertWorkoutSet({
              workout_exercise_id: weId,
              set_number: j + 1,
              weight_kg: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps) || 0,
              is_warmup: s.isWarmup ? 1 : 0,
              notes: ''
            });
          }
        }
      }

      await updateStreak('workout', getTodayString());
      await grantXP('workout_completed', 30);
      setEarnedXP(30 + (prsBroken * 50));
      setSummaryVisible(true);

    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'All progress will be lost.', [
      { text: 'Keep working', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" hidden={false} translucent />

      {/* PR Banner */}
      <Animated.View style={[styles.prBanner, { transform: [{ translateY: prAnim }] }]}>
        <Ionicons name="medal" size={24} color={Colors.white} />
        <Text style={styles.prBannerText}>{prBanner.text}</Text>
      </Animated.View>

      {/* TOP HUD */}
      <View style={[styles.hud, { paddingTop: insets.top + 10 }]}>
        <View style={styles.hudRow}>
          <Text style={styles.hudTime}>{formatTime(elapsedSeconds)}</Text>
          <View style={styles.hudCenter}>
            <Text style={styles.hudLabel}>ACTIVE SESSION</Text>
            <Animated.View style={[styles.pulseLine, { opacity: pulseAnim }]} />
          </View>
          <Text style={styles.hudVolume}>{totalVolume.toLocaleString()} kg</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <TextInput
            style={styles.workoutNameInput}
            value={workoutName}
            onChangeText={setWorkoutName}
            placeholder="Workout Name"
            placeholderTextColor={Colors.textDim}
          />
        </View>

        {exercises.map((ex, exIdx) => (
          <PekkaCard key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{flex:1}}>
                <Text style={styles.exerciseName}>{ex.exercise.name}</Text>
                <View style={styles.pillsRow}>
                  <View style={styles.pill}><Text style={styles.pillText}>{ex.exercise.muscle_group}</Text></View>
                  <View style={styles.pill}><Text style={styles.pillText}>{ex.exercise.equipment}</Text></View>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeExercise(ex.id)} style={{padding:8}}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.setsHeader}>
              <Text style={[styles.setHeaderText, {width: 40, textAlign: 'center'}]}>SET</Text>
              <Text style={[styles.setHeaderText, {flex: 1, textAlign: 'center'}]}>KG</Text>
              <Text style={[styles.setHeaderText, {flex: 1, textAlign: 'center'}]}>REPS</Text>
              <Text style={[styles.setHeaderText, {width: 40, textAlign: 'center'}]}>DONE</Text>
            </View>

            {ex.sets.map((set, setIdx) => (
              <View key={set.id} style={[styles.setRow, set.done && styles.setRowDone]}>
                <TouchableOpacity
                  style={styles.setNumberBtn}
                  onPress={() => updateSet(ex.id, set.id, 'isWarmup', !set.isWarmup)}
                  onLongPress={() => removeSet(ex.id, set.id)}
                >
                  <Text style={[styles.setNumberText, set.isWarmup && {color: Colors.orange}]}>
                    {set.isWarmup ? 'W' : (setIdx + 1)}
                  </Text>
                </TouchableOpacity>

                <View style={{flex: 1, paddingHorizontal: 4}}>
                  <TextInput
                    style={[styles.setInput, set.done && styles.setInputDone]}
                    value={set.weight}
                    onChangeText={v => updateSet(ex.id, set.id, 'weight', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textDim}
                    editable={!set.done}
                  />
                </View>
                
                <Text style={{color: Colors.textDim}}>×</Text>
                
                <View style={{flex: 1, paddingHorizontal: 4}}>
                  <TextInput
                    style={[styles.setInput, set.done && styles.setInputDone]}
                    value={set.reps}
                    onChangeText={v => updateSet(ex.id, set.id, 'reps', v)}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textDim}
                    editable={!set.done}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.doneBtn, set.done && styles.doneBtnActive]}
                  onPress={() => toggleSetDone(ex, set.id)}
                >
                  <Ionicons name="checkmark" size={18} color={set.done ? Colors.bg : Colors.textDim} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(ex.id)}>
              <Ionicons name="add" size={16} color={Colors.blue} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </PekkaCard>
        ))}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={addExerciseFromLibrary}>
          <Ionicons name="add-circle" size={24} color={Colors.blue} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

        <PekkaButton title="FINISH WORKOUT" onPress={handleFinish} style={styles.finishBtn} textStyle={{color: Colors.bg, fontWeight: '900', fontSize: 16}} />
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
        
        <View style={{height: 100}} />
      </ScrollView>

      {/* REST TIMER OVERLAY */}
      {restTimerActive && (
        <View style={styles.restOverlay}>
          <Text style={styles.restTitle}>Rest</Text>
          <View style={styles.restCircle}>
            <CircularProgress
              size={180}
              strokeWidth={10}
              color={Colors.blue}
              value={restSecondsRemaining}
              max={currentRestDuration}
            />
            <Text style={styles.restTimeText}>{formatTime(restSecondsRemaining)}</Text>
          </View>
          
          <TouchableOpacity style={styles.skipRestBtn} onPress={stopRestTimer}>
            <Text style={styles.skipRestText}>Skip Rest</Text>
          </TouchableOpacity>

          <View style={styles.restPresets}>
            {[30, 60, 90, 120, 180].map(sec => (
              <TouchableOpacity key={sec} onPress={() => startRestTimer(sec)} style={styles.presetChip}>
                <Text style={styles.presetText}>{sec}s</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* SUMMARY MODAL */}
      <Modal visible={summaryVisible} animationType="slide" transparent>
        <View style={styles.summaryModalBg}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>WORKOUT COMPLETE</Text>
            
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{formatTime(elapsedSeconds)}</Text>
                <Text style={styles.summaryLbl}>Duration</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{totalVolume.toLocaleString()}</Text>
                <Text style={styles.summaryLbl}>Total Vol (kg)</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0)}</Text>
                <Text style={styles.summaryLbl}>Sets</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{exercises.length}</Text>
                <Text style={styles.summaryLbl}>Exercises</Text>
              </View>
            </View>

            <View style={styles.summaryXPRow}>
              <Text style={styles.summaryXPText}>+{earnedXP} XP</Text>
            </View>
            
            {prsBroken > 0 && (
               <Text style={{color: Colors.green, textAlign: 'center', marginBottom: 20, fontWeight: '700'}}>
                 🏅 {prsBroken} PRs Broken!
               </Text>
            )}

            <View style={styles.summaryActions}>
              <TouchableOpacity style={[styles.sumBtn, styles.sumBtnShare]} onPress={() => Alert.alert('Share', 'Sharing coming soon')}>
                <Text style={styles.sumBtnShareText}>Share Card</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sumBtn, styles.sumBtnDone]} onPress={() => { setSummaryVisible(false); navigation.goBack(); }}>
                <Text style={styles.sumBtnDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  
  hud: { backgroundColor: Colors.bg2, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 10, paddingHorizontal: 20, zIndex: 10 },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudTime: { fontFamily: Fonts.mono, fontSize: 20, color: Colors.gold, fontWeight: '800', width: 80 },
  hudCenter: { alignItems: 'center' },
  hudLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '800', letterSpacing: 2 },
  pulseLine: { width: 40, height: 2, backgroundColor: Colors.blue, marginTop: 4, borderRadius: 1 },
  hudVolume: { fontSize: 16, color: Colors.blue, fontWeight: '700', width: 80, textAlign: 'right' },
  
  scrollContent: { padding: 16 },
  titleRow: { marginBottom: 16 },
  workoutNameInput: { fontSize: 28, fontWeight: '800', color: Colors.white, paddingVertical: 8 },
  
  exerciseCard: { marginBottom: 16, padding: 16, backgroundColor: Colors.bg4 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  exerciseName: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  pillsRow: { flexDirection: 'row', gap: 8 },
  pill: { backgroundColor: Colors.bg5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pillText: { fontSize: 10, color: Colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
  
  setsHeader: { flexDirection: 'row', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
  setHeaderText: { fontSize: 10, color: Colors.textDim, fontWeight: '700', letterSpacing: 1 },
  
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  setRowDone: { opacity: 0.7 },
  setNumberBtn: { width: 40, alignItems: 'center', paddingVertical: 8 },
  setNumberText: { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  setInput: { backgroundColor: Colors.bg5, color: Colors.text, borderRadius: 8, padding: 10, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  setInputDone: { backgroundColor: Colors.bg3, color: Colors.textDim },
  doneBtn: { width: 40, height: 36, borderRadius: 8, backgroundColor: Colors.bg5, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  doneBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  
  addSetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.bg5 },
  addSetText: { fontSize: 14, color: Colors.blue, fontWeight: '700', marginLeft: 6 },
  
  addExerciseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.blueAlpha, paddingVertical: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: Colors.borderStrong, borderStyle: 'dashed' },
  addExerciseText: { fontSize: 16, color: Colors.blue, fontWeight: '800', marginLeft: 8 },
  
  finishBtn: { backgroundColor: Colors.gold, borderRadius: 16, shadowColor: Colors.gold },
  discardBtn: { alignItems: 'center', marginTop: 16, padding: 10 },
  discardText: { color: Colors.red, fontSize: 14, fontWeight: '600' },

  prBanner: { position: 'absolute', top: 0, left: 16, right: 16, backgroundColor: Colors.green, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', zIndex: 100, shadowColor: '#000', shadowOffset: {width:0,height:4}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  prBannerText: { color: Colors.white, fontWeight: '800', fontSize: 14, marginLeft: 10, flex: 1 },

  restOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,6,15,0.92)', zIndex: 50, alignItems: 'center', justifyContent: 'center' },
  restTitle: { fontSize: 28, fontWeight: '900', color: Colors.white, marginBottom: 40, letterSpacing: 2 },
  restCircle: { width: 180, height: 180, alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  restTimeText: { position: 'absolute', fontSize: 40, fontWeight: '900', color: Colors.blue, fontFamily: Fonts.mono },
  skipRestBtn: { paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border, marginBottom: 40 },
  skipRestText: { fontSize: 16, color: Colors.text, fontWeight: '700' },
  restPresets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  presetChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.bg5, borderRadius: 8 },
  presetText: { fontSize: 14, color: Colors.textMuted, fontWeight: '700' },

  summaryModalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  summaryCard: { backgroundColor: Colors.bg2, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Colors.borderStrong, alignItems: 'center' },
  summaryTitle: { fontSize: 20, fontWeight: '900', color: Colors.gold, marginBottom: 24, letterSpacing: 1 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
  summaryItem: { width: '45%', alignItems: 'center', backgroundColor: Colors.bg4, padding: 16, borderRadius: 16 },
  summaryVal: { fontSize: 24, fontWeight: '900', color: Colors.white, marginBottom: 4 },
  summaryLbl: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryXPRow: { backgroundColor: Colors.blueAlpha, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  summaryXPText: { color: Colors.blue, fontWeight: '800', fontSize: 16 },
  summaryActions: { flexDirection: 'row', width: '100%', gap: 12 },
  sumBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  sumBtnShare: { backgroundColor: Colors.bg5 },
  sumBtnShareText: { color: Colors.text, fontWeight: '700' },
  sumBtnDone: { backgroundColor: Colors.blue },
  sumBtnDoneText: { color: Colors.bg, fontWeight: '900' },
});
