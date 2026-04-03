import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle } from 'react-native-svg';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import EmptyState from '../../components/EmptyState';
import CardioScreen from './CardioScreen';
import { 
  getWorkouts, 
  Workout, 
  getPersonalRecords, 
  PersonalRecord,
  getWorkoutExercises,
  getExercises,
  getStreak,
  deleteWorkout,
} from '../../db/database';
import { formatDate, formatTime, isWithinDays } from '../../utils/formatters';

export default function TrainScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Workout' | 'Cardio' | 'History'>('Workout');
  
  // Data State
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [monthlyVolume, setMonthlyVolume] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [workedMuscles, setWorkedMuscles] = useState<string[]>([]);

  // History Expand
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const allW = await getWorkouts(100);
      const allEx = await getExercises();
      const allPrs = await getPersonalRecords();
      const st = await getStreak('workout');
      
      setBestStreak(st?.best_streak || 0);

      // Top 3 PRs
      const sortedPrs = allPrs.sort((a, b) => b.one_rm - a.one_rm).slice(0, 3);
      setPrs(sortedPrs);

      let wCount = 0;
      let wVol = 0;
      let mCount = 0;
      let mVol = 0;
      const mSet = new Set<string>();

      for (const w of allW) {
        if (isWithinDays(w.date, 30)) {
          mCount++;
          mVol += w.total_volume;
        }
        if (isWithinDays(w.date, 7)) {
          wCount++;
          wVol += w.total_volume;
          
          const exps = await getWorkoutExercises(w.id);
          exps.forEach(we => {
            const definedEx = allEx.find(e => e.id === we.exercise_id);
            if (definedEx) mSet.add(definedEx.muscle_group);
          });
        }
      }

      setWeeklyCount(wCount);
      setWeeklyVolume(wVol);
      setMonthlyCount(mCount);
      setMonthlyVolume(mVol);
      setWorkedMuscles(Array.from(mSet));
      setRecentWorkouts(allW);

    } catch (error) {
      console.error('Error loading Train tab data:', error);
    }
  };

  const handleTemplate = (tpl: string) => {
    navigation.navigate('WorkoutSession', { template: tpl });
  };

  const handleDeleteWorkout = (id: number) => {
    Alert.alert('Delete Workout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteWorkout(id);
        loadData();
      }}
    ]);
  };

  // -------------------------
  // RENDER WORKOUT TAB
  // -------------------------
  const renderWorkoutTab = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Start Button Area */}
      <TouchableOpacity style={styles.startCard} onPress={() => navigation.navigate('WorkoutSession')} activeOpacity={0.8}>
        <View style={styles.startCardIcon}>
          <Text style={{fontSize: 32}}>💪</Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.startCardTitle}>Begin Session</Text>
          <Text style={styles.startCardSub}>Log your sets & track your PRs</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* QUICK START */}
      <Text style={styles.sectionTitle}>QUICK START</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll} contentContainerStyle={{gap: 12, paddingRight: 20}}>
        {['Push Day', 'Pull Day', 'Leg Day'].map(tpl => (
          <TouchableOpacity key={tpl} style={styles.templateChip} onPress={() => handleTemplate(tpl)}>
            <Ionicons name="flash" size={16} color={Colors.gold} style={{marginRight: 6}} />
            <Text style={styles.templateText}>{tpl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid: Volume & Heatmap */}
      <View style={styles.twoColGrid}>
        {/* Weekly Volume */}
        <PekkaCard style={styles.gridCard}>
          <Text style={styles.cardHeaderSmall}>WEEKLY VOLUME</Text>
          <View style={styles.volValueRow}>
            <Text style={styles.volValue}>{weeklyCount}</Text>
            <Text style={styles.volLbl}>workouts</Text>
          </View>
          <View style={styles.volValueRow}>
            <Text style={styles.volValue}>{weeklyVolume.toLocaleString()}</Text>
            <Text style={styles.volLbl}>kg lifted</Text>
          </View>
        </PekkaCard>

        {/* Heatmap */}
        <PekkaCard style={{ ...styles.gridCard, alignItems: 'center' } as any}>
          <Text style={styles.cardHeaderSmall}>MUSCLES WORKED</Text>
          <Svg width="80" height="120" viewBox="0 0 100 120" style={{marginTop: 10}}>
            {/* Simple Abstract Body */}
            {/* Head */}
            <Circle cx="50" cy="15" r="12" fill={Colors.bg5} />
            {/* Shoulders */}
            <Circle cx="25" cy="40" r="10" fill={workedMuscles.includes('Shoulders') ? Colors.gold : Colors.bg5} />
            <Circle cx="75" cy="40" r="10" fill={workedMuscles.includes('Shoulders') ? Colors.gold : Colors.bg5} />
            {/* Chest */}
            <Rect x="35" y="30" width="30" height="20" rx="4" fill={workedMuscles.includes('Chest') ? Colors.gold : Colors.bg5} />
            {/* Back (Background overlapping chest slightly conceptually, combine with Chest or leave separate. We'll simplify) */}
            {workedMuscles.includes('Back') && !workedMuscles.includes('Chest') && (
              <Rect x="35" y="30" width="30" height="20" rx="4" fill={Colors.blue} />
            )}
            {/* Arms */}
            <Rect x="15" y="55" width="12" height="30" rx="6" fill={workedMuscles.includes('Arms') ? Colors.gold : Colors.bg5} />
            <Rect x="73" y="55" width="12" height="30" rx="6" fill={workedMuscles.includes('Arms') ? Colors.gold : Colors.bg5} />
            {/* Core */}
            <Rect x="38" y="55" width="24" height="25" rx="4" fill={workedMuscles.includes('Core') ? Colors.gold : Colors.bg5} />
            {/* Legs */}
            <Rect x="35" y="85" width="12" height="35" rx="6" fill={workedMuscles.includes('Legs') ? Colors.gold : Colors.bg5} />
            <Rect x="53" y="85" width="12" height="35" rx="6" fill={workedMuscles.includes('Legs') ? Colors.gold : Colors.bg5} />
          </Svg>
        </PekkaCard>
      </View>

      {/* PRs */}
      <Text style={[styles.sectionTitle, {marginTop: 20}]}>TOP PRs</Text>
      {prs.length === 0 ? (
        <EmptyState icon="medal-outline" title="No PRs yet" subtitle="Start lifting to log personal records" />
      ) : (
        prs.map(pr => (
          <View key={pr.id} style={styles.prRow}>
            <View style={styles.prIconBox}>
              <Ionicons name="trophy" size={20} color={Colors.gold} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.prName}>{pr.exercise_name}</Text>
              <Text style={styles.prDate}>{formatDate(pr.date)}</Text>
            </View>
            <View style={styles.prStatBox}>
              <Text style={styles.prWeight}>{pr.weight_kg} kg</Text>
              <Text style={styles.prReps}>× {pr.reps}</Text>
            </View>
          </View>
        ))
      )}

      <View style={{height: 40}} />
    </ScrollView>
  );

  // -------------------------
  // RENDER CARDIO TAB
  // -------------------------
  const renderCardioTab = () => (
    <View style={{flex: 1, padding: 16}}>
      <CardioScreen />
    </View>
  );

  // -------------------------
  // RENDER HISTORY TAB
  // -------------------------
  const renderHistoryTab = () => {
    // Generate GitHub-style heatmap data
    const cells = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    // 12 weeks = 84 days
    for(let i=0; i<84; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (83 - i));
      const dStr = d.toISOString().split('T')[0];
      const workoutsOnDay = recentWorkouts.filter(w => w.date === dStr);
      
      let vol = 0;
      workoutsOnDay.forEach(w => vol+=w.total_volume);
      
      let fill = Colors.bg5;
      if(vol > 0 && vol < 3000) fill = Colors.blueAlpha;
      else if(vol >= 3000 && vol < 7000) fill = Colors.blue;
      else if(vol >= 7000) fill = Colors.gold;
      
      const col = Math.floor(i/7);
      const row = i%7;
      cells.push(<Rect key={i} x={col*14} y={row*14} width="10" height="10" rx="2" fill={fill}/>);
    }

    return (
      <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryVal}>{monthlyCount}</Text>
              <Text style={styles.summaryLbl}>Mo. Workouts</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryVal}>{monthlyVolume >= 1000 ? (monthlyVolume/1000).toFixed(1)+'k' : monthlyVolume}</Text>
              <Text style={styles.summaryLbl}>Mo. Vol (kg)</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryVal}>{bestStreak}</Text>
              <Text style={styles.summaryLbl}>Best Streak</Text>
            </View>
          </View>

          <PekkaCard style={styles.heatmapCard}>
            <Text style={styles.cardHeaderSmall}>LAST 12 WEEKS</Text>
            <View style={{marginTop: 12, alignItems: 'center'}}>
              <Svg width={12*14} height={7*14} viewBox={`0 0 ${12*14} ${7*14}`}>
                {cells}
              </Svg>
            </View>
          </PekkaCard>

          {recentWorkouts.length === 0 ? (
            <EmptyState icon="time-outline" title="No History" subtitle="Your completed workouts will appear here" />
          ) : (
            recentWorkouts.map(w => (
              <PekkaCard key={w.id} style={styles.historyCard}>
                <TouchableOpacity 
                  style={styles.historyHeader} 
                  onPress={() => setExpandedWorkoutId(expandedWorkoutId === w.id ? null : w.id)}
                  onLongPress={() => handleDeleteWorkout(w.id)}
                >
                  <View style={{flex: 1}}>
                    <Text style={styles.historyDate}>{new Date(w.date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</Text>
                    <Text style={styles.historyTitle}>{w.name}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.historyStats}>{formatTime(w.duration_seconds)}</Text>
                    <Text style={styles.historyStats}>{Math.round(w.total_volume).toLocaleString()} kg</Text>
                  </View>
                </TouchableOpacity>

                {expandedWorkoutId === w.id && (
                  <View style={styles.historyExpanded}>
                    <Text style={{color: Colors.textDim, fontSize: 13, fontStyle: 'italic', marginBottom: 8}}>Hold to delete workout</Text>
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteWorkout(w.id)}>
                      <Text style={{color: Colors.red, fontWeight: '600'}}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </PekkaCard>
            ))
          )}
          <View style={{height: 40}} />
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>TRAIN</Text>
        <Ionicons name="barbell" size={24} color={Colors.gold} />
      </View>

      {/* Pill Tabs */}
      <View style={styles.tabsContainer}>
        {['Workout', 'Cardio', 'History'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'Workout' && renderWorkoutTab()}
      {activeTab === 'Cardio' && renderCardioTab()}
      {activeTab === 'History' && renderHistoryTab()}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  mainTitle: { fontSize: 24, fontWeight: '900', color: Colors.gold, letterSpacing: 2 },
  
  tabsContainer: {
    flexDirection: 'row', backgroundColor: Colors.bg3, marginHorizontal: 20, marginTop: 16, marginBottom: 16,
    borderRadius: 20, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 16 },
  tabActive: { backgroundColor: Colors.blueAlpha },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.blue, fontWeight: '800' },
  
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  startCard: {
    backgroundColor: Colors.blue, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    shadowColor: Colors.blue, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  startCardIcon: {
    width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, alignItems: 'center',
    justifyContent: 'center', marginRight: 16,
  },
  startCardTitle: { fontSize: 22, fontWeight: '900', color: Colors.bg, marginBottom: 4 },
  startCardSub: { fontSize: 13, color: 'rgba(6,6,15,0.6)', fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
  
  templatesScroll: { flexGrow: 0, marginBottom: 24 },
  templateChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg4, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  templateText: { fontSize: 14, fontWeight: '700', color: Colors.text },

  twoColGrid: { flexDirection: 'row', gap: 12 },
  gridCard: { flex: 1, padding: 16 },
  cardHeaderSmall: { fontSize: 10, color: Colors.textMuted, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  volValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  volValue: { fontSize: 24, fontWeight: '900', color: Colors.white, marginRight: 6 },
  volLbl: { fontSize: 12, color: Colors.textDim, fontWeight: '600' },

  prRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg3, padding: 16, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  prIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.goldAlpha, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  prName: { fontSize: 15, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  prDate: { fontSize: 12, color: Colors.textDim },
  prStatBox: { alignItems: 'flex-end' },
  prWeight: { fontSize: 16, fontWeight: '800', color: Colors.gold },
  prReps: { fontSize: 12, color: Colors.textMuted },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  summaryBox: { flex: 1, backgroundColor: Colors.bg4, padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  summaryVal: { fontSize: 20, fontWeight: '900', color: Colors.blue, marginBottom: 4 },
  summaryLbl: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' },

  heatmapCard: { marginBottom: 20, padding: 16 },
  historyCard: { marginBottom: 10, padding: 0, overflow: 'hidden' },
  historyHeader: { flexDirection: 'row', padding: 16, justifyContent: 'space-between' },
  historyDate: { fontSize: 12, color: Colors.textDim, marginBottom: 4, textTransform: 'uppercase', fontWeight: '700' },
  historyTitle: { fontSize: 16, fontWeight: '800', color: Colors.white },
  historyStats: { fontSize: 13, color: Colors.textMuted, marginTop: 2, fontFamily: Fonts.mono },
  historyExpanded: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 16, backgroundColor: Colors.bg3 },
  delBtn: { backgroundColor: Colors.redAlpha, padding: 10, borderRadius: 8, alignItems: 'center' },
});
