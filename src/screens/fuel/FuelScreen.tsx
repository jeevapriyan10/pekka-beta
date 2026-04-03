import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, G, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import CircularProgress from '../../components/CircularProgress';
import { 
  getDatabase,
  getUserProfile, 
  UserProfile,
  updateUserProfile
} from '../../db/database';
import { getTodayString } from '../../utils/formatters';
import { grantXP, getLeagueForXP } from '../../utils/xp';

// Note: Assuming these DB functions exist or we'll define local wrappers below
import {
  getFoodEntriesByDate,
  deleteFoodEntry,
} from '../../db/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FoodEntry {
  id: number;
  date: string;
  meal_type: string;
  food_id: number;
  food_name: string;
  quantity_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

interface WaterLog {
  id: number;
  date: string;
  amount_ml: number;
  logged_at: string;
}

// In case delete/update water functions aren't exported, we define local DB wrappers
async function fetchWaterLogs(date: string): Promise<WaterLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<WaterLog>('SELECT * FROM water_logs WHERE date = ? ORDER BY logged_at DESC', [date]);
}
async function addWaterLog(date: string, ml: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT INTO water_logs (date, amount_ml, logged_at) VALUES (?, ?, ?)', [date, ml, new Date().toISOString()]);
}
async function removeWaterLog(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM water_logs WHERE id = ?', [id]);
}
async function fetchFoodEntriesForWeek(): Promise<FoodEntry[]> {
  const db = await getDatabase();
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return db.getAllAsync<FoodEntry>('SELECT * FROM food_entries WHERE date >= ?', [d.toISOString().split('T')[0]]);
}
async function updateFoodQuantity(id: number, qty: number, cals: number, p: number, c: number, f: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE food_entries SET quantity_g=?, calories=?, protein_g=?, carbs_g=?, fat_g=? WHERE id=?', [qty, cals, p, c, f, id]);
}
async function checkSeeded(): Promise<boolean> {
  const db = await getDatabase();
  const res = await db.getFirstAsync<{c: number}>('SELECT COUNT(*) as c FROM foods');
  return (res?.c || 0) > 0;
}

// Challenges
const allChallenges = [
  { id: 1, text: "Log all 3 main meals", xp: 35, check: (entries: FoodEntry[]) => ['breakfast', 'lunch', 'dinner'].every(m => entries.some(e => e.meal_type === m)) },
  { id: 2, text: "Hit your protein goal", xp: 25, check: (entries: FoodEntry[], profile: UserProfile) => entries.reduce((s, e) => s + e.protein_g, 0) >= profile.protein_goal },
  { id: 3, text: "Drink water goal today", xp: 20, check: (entries: FoodEntry[], profile: UserProfile, water: number) => water >= profile.water_goal_ml },
  { id: 4, text: "Stay within calorie goal", xp: 25, check: (entries: FoodEntry[], profile: UserProfile) => { const c = entries.reduce((s, e) => s + e.calories, 0); return c > 0 && c <= profile.calorie_goal; } },
  { id: 5, text: "Log breakfast", xp: 15, check: (entries: FoodEntry[]) => entries.some(e => e.meal_type === 'breakfast') },
];

export default function FuelScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Diary' | 'Nutrition' | 'Water'>('Diary');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSeeded, setIsSeeded] = useState(true);

  // Diary State
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);
  const [editQty, setEditQty] = useState('');

  // Water State
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [customWater, setCustomWater] = useState('');

  // Nutrition State
  const [weeklyEntries, setWeeklyEntries] = useState<FoodEntry[]>([]);
  
  // Challenges State
  const [challenges, setChallenges] = useState<typeof allChallenges>([]);
  const [completedChallenges, setCompletedChallenges] = useState<number[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAllData(selectedDate);
    }, [selectedDate])
  );

  const loadAllData = async (dateStr: string) => {
    try {
      const seeded = await checkSeeded();
      setIsSeeded(seeded);
      
      const prof = await getUserProfile();
      setProfile(prof);

      const fEntries = await getFoodEntriesByDate(dateStr);
      setFoodEntries(fEntries);

      const wLogs = await fetchWaterLogs(dateStr);
      setWaterLogs(wLogs);

      if (activeTab === 'Nutrition') {
         const wEnt = await fetchFoodEntriesForWeek();
         setWeeklyEntries(wEnt);
      }

      setupChallenges(dateStr, fEntries, prof, wLogs);

    } catch (e) {
      console.error(e);
    }
  };

  const setupChallenges = async (dateStr: string, fEnt: FoodEntry[], prof: UserProfile | null, wLogs: WaterLog[]) => {
    if (!prof) return;
    const waterTotal = wLogs.reduce((s, l) => s + l.amount_ml, 0);
    
    // Deterministic pick
    const dayOfYear = Math.floor((new Date(dateStr).getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const c1 = allChallenges[dayOfYear % allChallenges.length];
    const c2 = allChallenges[(dayOfYear + 1) % allChallenges.length];
    const c3 = allChallenges[(dayOfYear + 2) % allChallenges.length];
    const dailyChalls = [c1, c2, c3];
    setChallenges(dailyChalls);

    const completed = [];
    for (const c of dailyChalls) {
       const key = `challenge_completed_${dateStr}_${c.id}`;
       const done = await AsyncStorage.getItem(key);
       if (done) {
         completed.push(c.id);
       } else if (c.check(fEnt, prof, waterTotal)) {
         await AsyncStorage.setItem(key, 'true');
         completed.push(c.id);
         const leagueUp = await grantXP(`daily_challenge_${c.id}`, c.xp);
         Alert.alert('Challenge Complete!', `+${c.xp} XP: ${c.text}`);
         if (leagueUp) {
           const newProf = await getUserProfile();
           Alert.alert('🏆 LEAGUE UP!', `You've advanced to ${newProf?.league}!`);
         }
       }
    }
    setCompletedChallenges(completed);
  };

  // DIARY ACTIONS
  const handleDateChange = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const newDateStr = d.toISOString().split('T')[0];
    
    if (newDateStr > getTodayString()) {
      Alert.alert('Future Logging', 'Cannot log data for future dates.');
      return;
    }
    setSelectedDate(newDateStr);
  };

  const handleDeleteFood = (id: number) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteFoodEntry(id);
        loadAllData(selectedDate);
      }}
    ]);
  };

  const handleSaveEdit = async () => {
    if (!editEntry) return;
    const qty = parseFloat(editQty);
    if (!qty || qty <= 0 || qty > 5000) {
      Alert.alert('Invalid', 'Enter a valid quantity (1-5000g)');
      return;
    }
    const ratio = qty / editEntry.quantity_g;
    await updateFoodQuantity(
      editEntry.id, 
      qty,
      Math.round(editEntry.calories * ratio),
      Math.round(editEntry.protein_g * ratio),
      Math.round(editEntry.carbs_g * ratio),
      Math.round(editEntry.fat_g * ratio)
    );
    setEditEntry(null);
    loadAllData(selectedDate);
  };

  const df = new Date(selectedDate);
  const dateDisplay = selectedDate === getTodayString() ? `TODAY · ${df.toLocaleDateString('en-US', {weekday:'short', day:'numeric', month:'short'}).toUpperCase()}` : df.toLocaleDateString('en-US', {weekday:'short', day:'numeric', month:'short'}).toUpperCase();

  const totalCals = foodEntries.reduce((s, e) => s + e.calories, 0);
  const totalPro = foodEntries.reduce((s, e) => s + e.protein_g, 0);
  const totalCarb = foodEntries.reduce((s, e) => s + e.carbs_g, 0);
  const totalFat = foodEntries.reduce((s, e) => s + e.fat_g, 0);
  const goalCals = profile?.calorie_goal || 2000;
  
  let calsColor = Colors.green;
  if (totalCals > goalCals * 0.9 && totalCals <= goalCals * 1.1) calsColor = Colors.gold;
  if (totalCals > goalCals * 1.1) calsColor = Colors.red;

  const macroTotal = totalPro + totalCarb + totalFat || 1;

  // WATER ACTIONS
  const waterTotal = waterLogs.reduce((s, l) => s + l.amount_ml, 0);
  const handleAddWater = async (ml: number) => {
    if (ml <= 0 || ml > 5000) return;
    await addWaterLog(getTodayString(), ml);
    
    // Check local goal hit
    if (waterTotal < (profile?.water_goal_ml || 2500) && (waterTotal + ml) >= (profile?.water_goal_ml || 2500)) {
      const key = `water_goal_${getTodayString()}`;
      const hit = await AsyncStorage.getItem(key);
      if (!hit) {
        await AsyncStorage.setItem(key, 'true');
        await grantXP('water_goal_hit', 10);
        Alert.alert('Hydration Goal Reached! 💧', '+10 XP');
      }
    }
    
    setCustomWater('');
    loadAllData(selectedDate);
  };
  const handleDeleteWater = (id: number) => {
    Alert.alert('Delete', 'Delete water log?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await removeWaterLog(id);
        loadAllData(selectedDate);
      }}
    ]);
  };

  // NUTRITION ACTIONS
  const handleRecalculateTDEE = () => {
    Alert.alert('Recalculate TDEE', 'We will update your targets based on your latest profile weight and settings.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Recalculate', onPress: async () => {
         if(!profile) return;
         // Extremely simplified Mifflin St Jeor local
         let bmr = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * 30) + (profile.sex === 'male' ? 5 : -161);
         const multipliers: any = { 'Sedentary': 1.2, 'Light': 1.375, 'Moderate': 1.55, 'Active': 1.725, 'Very Active': 1.9 };
         let tdee = bmr * (multipliers[profile.activity_level] || 1.375);
         let cGoal = tdee;
         if (profile.goal === 'Build Muscle') cGoal += 300;
         else if (profile.goal === 'Lose Fat') cGoal -= 500;
         
         await updateUserProfile({
           calorie_goal: Math.round(cGoal),
           protein_goal: Math.round(profile.weight_kg * 2.2), // 2.2g per kg
           fat_goal: Math.round((cGoal * 0.25)/9),
           carbs_goal: Math.round((cGoal - (profile.weight_kg * 2.2 * 4) - ((cGoal * 0.25))) / 4)
         });
         loadAllData(selectedDate);
         Alert.alert('Success', 'Targets updated successfully.');
      }}
    ]);
  };

  // -------------------------
  // RENDER DIARY
  // -------------------------
  const renderDiary = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(-1)}>
          <Ionicons name="chevron-back" size={24} color={Colors.blue} />
        </TouchableOpacity>
        <Text style={styles.dateDisplay}>{dateDisplay}</Text>
        <TouchableOpacity style={styles.dateArrow} onPress={() => handleDateChange(1)} disabled={selectedDate === getTodayString()}>
          <Ionicons name="chevron-forward" size={24} color={selectedDate === getTodayString() ? Colors.textDim : Colors.blue} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <PekkaCard style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={{flex: 1}}>
            <Text style={[styles.calsText, {color: calsColor}]}>
              {totalCals.toLocaleString()} <Text style={{fontSize: 16, color: Colors.textDim}}>/ {goalCals.toLocaleString()} kcal</Text>
            </Text>
            <Text style={styles.calsRemaining}>{Math.max(0, goalCals - totalCals).toLocaleString()} remaining</Text>
          </View>
          <View style={styles.macroDonut}>
            {/* Simple mini SVG Donut */}
            <Svg width="60" height="60" viewBox="0 0 60 60">
              <Circle cx="30" cy="30" r="24" stroke={Colors.bg4} strokeWidth="8" fill="none" />
              {macroTotal > 1 && (
                <>
                  <Circle cx="30" cy="30" r="24" stroke={Colors.blue} strokeWidth="8" fill="none" strokeDasharray={`${(totalPro/macroTotal)*(2*Math.PI*24)} 1000`} strokeDashoffset="0" />
                  <Circle cx="30" cy="30" r="24" stroke={Colors.gold} strokeWidth="8" fill="none" strokeDasharray={`${(totalCarb/macroTotal)*(2*Math.PI*24)} 1000`} strokeDashoffset={`-${(totalPro/macroTotal)*(2*Math.PI*24)}`} />
                  <Circle cx="30" cy="30" r="24" stroke={Colors.orange} strokeWidth="8" fill="none" strokeDasharray={`${(totalFat/macroTotal)*(2*Math.PI*24)} 1000`} strokeDashoffset={`-${((totalPro+totalCarb)/macroTotal)*(2*Math.PI*24)}`} />
                </>
              )}
            </Svg>
          </View>
        </View>

        <View style={styles.summaryMacros}>
          {[ 
            { lbl: 'Protein', val: totalPro, goal: profile?.protein_goal||150, col: Colors.blue },
            { lbl: 'Carbs', val: totalCarb, goal: profile?.carbs_goal||250, col: Colors.gold },
            { lbl: 'Fat', val: totalFat, goal: profile?.fat_goal||65, col: Colors.orange }
          ].map(m => (
            <View key={m.lbl} style={styles.macroCol}>
              <Text style={styles.macroColLbl}>{m.lbl}</Text>
              <View style={styles.macroColBarBg}>
                <View style={[styles.macroColBarFill, { backgroundColor: m.col, width: `${Math.min(100, (m.val/m.goal)*100)}%` }]} />
              </View>
              <Text style={styles.macroColVal}>{Math.round(m.val)} / {m.goal}g</Text>
            </View>
          ))}
        </View>
      </PekkaCard>

      {/* Meals */}
      {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
        const mealEntries = foodEntries.filter(e => e.meal_type === meal);
        const mealCals = mealEntries.reduce((s, e) => s + e.calories, 0);
        let hdCol = Colors.green;
        if(meal==='lunch') hdCol = Colors.gold;
        if(meal==='dinner') hdCol = Colors.blue;
        if(meal==='snacks') hdCol = Colors.purple;

        return (
          <View key={meal} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Text style={[styles.mealTitle, {color: hdCol}]}>{meal.toUpperCase()}</Text>
              <View style={{flex: 1, alignItems: 'flex-end', paddingRight: 12}}>
                {mealCals > 0 && <Text style={styles.mealTotalCals}>{mealCals} kcal</Text>}
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('FoodSearch', { mealType: meal, date: selectedDate })}>
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {mealEntries.length === 0 ? (
              <TouchableOpacity style={styles.emptyMealSlot} onPress={() => navigation.navigate('FoodSearch', { mealType: meal, date: selectedDate })}>
                <Text style={styles.emptyMealText}>Tap + to add {meal}</Text>
              </TouchableOpacity>
            ) : (
              mealEntries.map(entry => (
                <View key={entry.id} style={styles.foodRow}>
                  <TouchableOpacity style={{flex: 1}} onPress={() => { setEditEntry(entry); setEditQty(entry.quantity_g.toString()); }} onLongPress={() => handleDeleteFood(entry.id)}>
                    <View style={styles.foodRowTop}>
                      <Text style={styles.foodRowName} numberOfLines={1}>{entry.food_name}</Text>
                      <Text style={styles.foodRowCals}>{entry.calories} <Text style={{fontSize: 11, color: Colors.textDim}}>kcal</Text></Text>
                    </View>
                    <View style={styles.foodRowBot}>
                      <Text style={styles.foodRowQty}>{entry.quantity_g}g</Text>
                      <Text style={styles.foodRowMacros}>P: {entry.protein_g}g · C: {entry.carbs_g}g · F: {entry.fat_g}g</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        );
      })}

      {/* Challenges Widget */}
      <PekkaCard style={styles.challengesCard}>
        <View style={styles.chHeader}>
          <Text style={styles.chTitle}>TODAY'S CHALLENGES</Text>
          <View style={styles.chBadge}><Text style={styles.chBadgeText}>🎯 DAILY</Text></View>
        </View>
        {challenges.map(c => {
          const done = completedChallenges.includes(c.id);
          return (
            <View key={c.id} style={styles.chRow}>
              <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={22} color={done ? Colors.green : Colors.borderStrong} />
              <Text style={[styles.chText, done && {color: Colors.textMuted, textDecorationLine:'line-through'}]}>{c.text}</Text>
              <View style={[styles.chXpBadge, done && {backgroundColor: 'transparent'}]}>
                <Text style={[styles.chXpText, done && {color: Colors.textDim}]}>+{c.xp} XP</Text>
              </View>
            </View>
          );
        })}
      </PekkaCard>
      
      <View style={{height: 40}} />
    </ScrollView>
  );

  // -------------------------
  // RENDER NUTRITION
  // -------------------------
  const renderNutrition = () => {
    // Process weekly data
    const last7cals = [0,0,0,0,0,0,0];
    const last7macros = [{p:0,c:0,f:0},{p:0,c:0,f:0},{p:0,c:0,f:0},{p:0,c:0,f:0},{p:0,c:0,f:0},{p:0,c:0,f:0},{p:0,c:0,f:0}];
    
    let sumC=0, sumP=0, sumCar=0, sumF=0;
    let daysWithFood = 0;

    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const dayEntries = weeklyEntries.filter(e => e.date === dStr);
      let dc=0, dp=0, dcar=0, df=0;
      dayEntries.forEach(e => { dc+=e.calories; dp+=e.protein_g; dcar+=e.carbs_g; df+=e.fat_g; });
      last7cals[6-i] = dc;
      last7macros[6-i] = {p:dp, c:dcar, f:df};
      if (dc > 0) { sumC+=dc; sumP+=dp; sumCar+=dcar; sumF+=df; daysWithFood++; }
    }

    const avgC = daysWithFood > 0 ? Math.round(sumC/daysWithFood) : 0;
    const avgP = daysWithFood > 0 ? Math.round(sumP/daysWithFood) : 0;
    const avgCar = daysWithFood > 0 ? Math.round(sumCar/daysWithFood) : 0;
    const avgF = daysWithFood > 0 ? Math.round(sumF/daysWithFood) : 0;

    const maxWeeklyCals = Math.max(...last7cals, goalCals) * 1.1;

    let targetLabel = "maintenance";
    let targetColor = Colors.gold;
    if (profile?.goal === 'Build Muscle') { targetLabel = "+300 surplus"; targetColor = Colors.green; }
    if (profile?.goal === 'Lose Fat') { targetLabel = "−500 deficit"; targetColor = Colors.blue; }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <PekkaCard style={styles.tdeeCard}>
          <View style={styles.tdeeHeader}>
            <Text style={styles.tdeeTitle}>YOUR TDEE</Text>
            <TouchableOpacity onPress={() => Alert.alert('TDEE', 'Total Daily Energy Expenditure estimated via Mifflin-St Jeor equation.')}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.tdeeCals}>{goalCals.toLocaleString()} <Text style={{fontSize: 16, color: Colors.textDim}}>kcal/day</Text></Text>
          <Text style={styles.tdeeGoalRow}>Goal: <Text style={{color: Colors.white}}>{profile?.goal}</Text></Text>
          <Text style={styles.tdeeTargetRow}>Target: <Text style={{color: targetColor}}>{targetLabel}</Text></Text>

          <View style={styles.tdeeMacros}>
            <Text style={styles.tdeeMacroTxt}>Protein: <Text style={{color: Colors.white}}>{profile?.protein_goal}g</Text></Text>
            <Text style={{color: Colors.textDim}}>·</Text>
            <Text style={styles.tdeeMacroTxt}>Carbs: <Text style={{color: Colors.white}}>{profile?.carbs_goal}g</Text></Text>
            <Text style={{color: Colors.textDim}}>·</Text>
            <Text style={styles.tdeeMacroTxt}>Fat: <Text style={{color: Colors.white}}>{profile?.fat_goal}g</Text></Text>
          </View>

          <TouchableOpacity style={styles.recalcBtn} onPress={handleRecalculateTDEE}>
            <Ionicons name="refresh" size={16} color={Colors.blue} />
            <Text style={styles.recalcTxt}>Recalculate</Text>
          </TouchableOpacity>
        </PekkaCard>

        <PekkaCard style={styles.chartCardFull}>
          <Text style={styles.sectionTitle}>7-DAY CALORIES</Text>
          <View style={styles.chartContainerFull}>
            <Svg width="100%" height="100%">
              <Rect x="0" y={150 - ((goalCals)/maxWeeklyCals)*120} width="100%" height="1" fill={Colors.gold} strokeDasharray="4,4" />
              {avgC > 0 && <Rect x="0" y={150 - (avgC/maxWeeklyCals)*120} width="100%" height="1" fill={Colors.purple} strokeDasharray="4,4" />}
              
              {last7cals.map((cals, i) => {
                const h = (cals/maxWeeklyCals)*120;
                const spc = (SCREEN_WIDTH - 72)/7;
                const x = (spc * i) + (spc/2) - 10;
                let col = Colors.purpleAlpha;
                if(i===6) col = Colors.blue;
                else if(cals > goalCals) col = Colors.red;
                return (
                  <G key={i}>
                    <Rect x={x} y={150-h} width={20} height={h} rx={4} fill={cals>0?col:Colors.bg5} />
                    <Text>{}</Text>
                  </G>
                )
              })}
            </Svg>
          </View>
        </PekkaCard>

        <Text style={[styles.sectionTitle, {marginTop: 10}]}>7-DAY AVERAGES</Text>
        <View style={styles.avgGrid}>
          <PekkaCard style={styles.avgBox}>
            <Text style={styles.avgBoxVal}>{avgC}</Text>
            <Text style={styles.avgBoxLbl}>Calories</Text>
          </PekkaCard>
          <PekkaCard style={styles.avgBox}>
            <Text style={[styles.avgBoxVal, {color: Colors.blue}]}>{avgP}g</Text>
            <Text style={styles.avgBoxLbl}>Protein</Text>
          </PekkaCard>
          <PekkaCard style={styles.avgBox}>
            <Text style={[styles.avgBoxVal, {color: Colors.gold}]}>{avgCar}g</Text>
            <Text style={styles.avgBoxLbl}>Carbs</Text>
          </PekkaCard>
          <PekkaCard style={styles.avgBox}>
            <Text style={[styles.avgBoxVal, {color: Colors.orange}]}>{avgF}g</Text>
            <Text style={styles.avgBoxLbl}>Fat</Text>
          </PekkaCard>
        </View>

        <View style={{height: 40}} />
      </ScrollView>
    );
  };

  // -------------------------
  // RENDER WATER
  // -------------------------
  const renderWater = () => {
    let currentGoal = profile?.water_goal_ml || 2500;
    let pct = waterTotal > 0 ? (waterTotal / currentGoal) : 0;
    
    let msg = "Start hydrating! 💧";
    let msgCol = Colors.textMuted;
    if(pct > 0.1) msg = "Keep going...";
    if(pct > 0.45) msg = "Halfway there!";
    if(pct > 0.7) msg = "Almost there 💪";
    if(pct >= 1) { msg = "Goal reached! 🎉"; msgCol = Colors.green; }

    return (
      <View style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.waterRingWrap}>
            <CircularProgress
              size={200}
              strokeWidth={14}
              color={pct>=1 ? Colors.green : Colors.purple}
              value={waterTotal}
              max={currentGoal}
            />
            <View style={styles.waterRingInner}>
              <Text style={styles.wrVal}>{(waterTotal/1000).toFixed(1)}L</Text>
              <Text style={styles.wrGoal}>/ {(currentGoal/1000).toFixed(1)}L</Text>
            </View>
            <Text style={[styles.wrMsg, {color: msgCol}]}>{msg}</Text>
          </View>

          <Text style={styles.sectionTitle}>QUICK ADD</Text>
          <View style={styles.quickAddRow}>
            {[100, 200, 350, 500].map(amt => (
              <TouchableOpacity key={amt} style={styles.waterAddBtn} onPress={() => handleAddWater(amt)}>
                <Text style={styles.waterAddBtnTxt}>+{amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customWaterRow}>
            <TextInput
              style={styles.customWaterInput}
              value={customWater}
              onChangeText={setCustomWater}
              keyboardType="numeric"
              placeholder="Custom"
              placeholderTextColor={Colors.textDim}
            />
            <Text style={styles.cwUnit}>ml</Text>
            <TouchableOpacity style={styles.cwAddBtn} onPress={() => { handleAddWater(parseInt(customWater)); setCustomWater(''); }}>
              <Text style={styles.cwAddTxt}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, {marginTop: 20}]}>TODAY'S LOGS ({waterLogs.length})</Text>
          {waterLogs.length === 0 ? (
            <Text style={{color: Colors.textMuted, fontSize: 13, marginBottom: 20}}>No water logged yet today.</Text>
          ) : (
            waterLogs.map(l => (
              <View key={l.id} style={styles.wLogRow}>
                <Ionicons name="water" size={20} color={Colors.purple} />
                <Text style={styles.wlVal}>{l.amount_ml} ml</Text>
                <Text style={styles.wlTime}>{new Date(l.logged_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</Text>
                <TouchableOpacity onPress={() => handleDeleteWater(l.id)} style={{marginLeft:'auto'}}>
                  <Ionicons name="close-circle-outline" size={20} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
            ))
          )}

        </ScrollView>
      </View>
    );
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.mainTitle}>FUEL</Text>
        <Ionicons name="restaurant" size={24} color={Colors.gold} />
      </View>

      {/* Pill Tabs */}
      <View style={styles.tabsContainer}>
        {['Diary', 'Nutrition', 'Water'].map(tab => (
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
      <View style={{flex: 1}}>
        {activeTab === 'Diary' && renderDiary()}
        {activeTab === 'Nutrition' && renderNutrition()}
        {activeTab === 'Water' && renderWater()}
      </View>

      {/* Edit Modal (Diary inline edit) */}
      {editEntry && (
        <Modal transparent visible animationType="fade">
          <TouchableWithoutFeedback onPress={() => setEditEntry(null)}>
            <View style={styles.modalBg}>
              <TouchableWithoutFeedback>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>Edit Quantity</Text>
                  <Text style={styles.modalSub}>{editEntry.food_name}</Text>
                  <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center', marginVertical: 20}}>
                    <TextInput
                      style={styles.modalInput}
                      value={editQty}
                      onChangeText={setEditQty}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={{fontSize:18, color:Colors.textMuted, marginLeft:8}}>g</Text>
                  </View>
                  <View style={{flexDirection:'row', gap:10}}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditEntry(null)}>
                      <Text style={styles.modalBtnTxtCan}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveEdit}>
                      <Text style={styles.modalBtnTxtSav}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

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

  // DIARY
  dateSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: Colors.bg2, padding: 12, borderRadius: 16 },
  dateArrow: { padding: 4 },
  dateDisplay: { fontSize: 14, fontWeight: '800', color: Colors.text, letterSpacing: 0.5 },

  summaryCard: { marginBottom: 20, padding: 16 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calsText: { fontSize: 28, fontWeight: '900' },
  calsRemaining: { fontSize: 13, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
  macroDonut: { width: 60, height: 60 },

  summaryMacros: { flexDirection: 'row', justifyContent: 'space-between' },
  macroCol: { flex: 1, paddingHorizontal: 6 },
  macroColLbl: { fontSize: 11, color: Colors.textDim, marginBottom: 6, fontWeight: '700' },
  macroColBarBg: { height: 6, backgroundColor: Colors.bg5, borderRadius: 3, marginBottom: 6 },
  macroColBarFill: { height: '100%', borderRadius: 3 },
  macroColVal: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },

  mealSection: { marginBottom: 20 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8, marginBottom: 10 },
  mealTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  mealTotalCals: { fontSize: 14, fontWeight: '800', color: Colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addBtnText: { fontSize: 12, color: Colors.white, fontWeight: '700', marginLeft: 4 },
  
  emptyMealSlot: { paddingVertical: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.borderStrong, borderRadius: 12, alignItems: 'center' },
  emptyMealText: { fontSize: 13, color: Colors.textDim, fontWeight: '600' },

  foodRow: { backgroundColor: Colors.bg2, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: Colors.bg5 },
  foodRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  foodRowName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, paddingRight: 10 },
  foodRowCals: { fontSize: 15, fontWeight: '800', color: Colors.blue },
  foodRowBot: { flexDirection: 'row', alignItems: 'center' },
  foodRowQty: { fontSize: 12, color: Colors.textMuted, marginRight: 12, fontWeight: '600' },
  foodRowMacros: { fontSize: 11, color: Colors.textDim, fontWeight: '600' },

  challengesCard: { backgroundColor: Colors.bg4, padding: 16, marginTop: 10 },
  chHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  chTitle: { fontSize: 13, fontWeight: '800', color: Colors.text, letterSpacing: 1 },
  chBadge: { backgroundColor: Colors.goldAlpha, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chBadgeText: { fontSize: 9, color: Colors.gold, fontWeight: '800' },
  chRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  chText: { flex: 1, fontSize: 13, color: Colors.text, marginLeft: 10, fontWeight: '500' },
  chXpBadge: { backgroundColor: Colors.blueAlpha, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  chXpText: { fontSize: 10, color: Colors.blue, fontWeight: '800' },

  // NUTRITION
  tdeeCard: { backgroundColor: '#18182b', padding: 20, marginBottom: 20 },
  tdeeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tdeeTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1 },
  tdeeCals: { fontSize: 32, fontWeight: '900', color: Colors.gold, marginBottom: 12 },
  tdeeGoalRow: { fontSize: 14, color: Colors.textMuted, marginBottom: 4 },
  tdeeTargetRow: { fontSize: 14, color: Colors.textMuted, marginBottom: 16 },
  tdeeMacros: { flexDirection: 'row', backgroundColor: Colors.bg, padding: 12, borderRadius: 12, justifyContent: 'space-between', marginBottom: 16 },
  tdeeMacroTxt: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  recalcBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: Colors.blueAlpha },
  recalcTxt: { color: Colors.blue, fontWeight: '700', marginLeft: 6 },

  chartCardFull: { padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: Colors.textMuted, letterSpacing: 1, marginBottom: 12 },
  chartContainerFull: { height: 160, width: '100%', marginTop: 10 },

  avgGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  avgBox: { width: '47%', padding: 16, alignItems: 'center' },
  avgBoxVal: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  avgBoxLbl: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase' },

  // WATER
  waterRingWrap: { alignItems: 'center', marginVertical: 30 },
  waterRingInner: { position: 'absolute', alignItems: 'center', top: 65 },
  wrVal: { fontSize: 32, fontWeight: '900', color: Colors.text },
  wrGoal: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },
  wrMsg: { marginTop: 24, fontSize: 16, fontWeight: '700' },

  quickAddRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  waterAddBtn: { backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.purpleAlpha, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  waterAddBtnTxt: { color: Colors.purple, fontWeight: '800', fontSize: 13 },

  customWaterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, padding: 8, borderRadius: 16, marginBottom: 30 },
  customWaterInput: { flex: 1, color: Colors.text, fontSize: 18, fontWeight: '700', paddingLeft: 10 },
  cwUnit: { color: Colors.textMuted, fontSize: 16, marginRight: 16 },
  cwAddBtn: { backgroundColor: Colors.purple, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  cwAddTxt: { color: Colors.white, fontWeight: '800' },

  wLogRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg3, padding: 16, borderRadius: 16, marginBottom: 8 },
  wlVal: { fontSize: 16, fontWeight: '800', color: Colors.text, marginLeft: 12 },
  wlTime: { fontSize: 13, color: Colors.textMuted, marginLeft: 12, fontFamily: Fonts.mono },

  // MODAL
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: Colors.bg2, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalSub: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  modalInput: { backgroundColor: Colors.bg5, width: 100, borderRadius: 12, padding: 12, textAlign: 'center', fontSize: 24, fontWeight: '800', color: Colors.blue },
  modalBtnCancel: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, backgroundColor: Colors.bg4 },
  modalBtnTxtCan: { color: Colors.textMuted, fontWeight: '700' },
  modalBtnSave: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, backgroundColor: Colors.blue },
  modalBtnTxtSav: { color: Colors.bg, fontWeight: '800' },
});
