import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaCard from '../../components/PekkaCard';
import EmptyState from '../../components/EmptyState';
import { insertCardioLog, getCardioLogs, deleteCardioLog, CardioLog } from '../../db/database';
import { getTodayString, formatDate } from '../../utils/formatters';
import { grantXP } from '../../utils/xp';

const CARDIO_TYPES = [
  { name: 'Run', icon: 'walk' },
  { name: 'Cycle', icon: 'bicycle' },
  { name: 'Swim', icon: 'water' },
  { name: 'HIIT', icon: 'flash' },
  { name: 'Jump Rope', icon: 'refresh-circle' },
  { name: 'Row', icon: 'boat' },
  { name: 'Elliptical', icon: 'infinite' },
];

export default function CardioScreen() {
  const [type, setType] = useState('Run');
  const [min, setMin] = useState('');
  const [sec, setSec] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<CardioLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
      setDate(getTodayString());
    }, [])
  );

  const loadLogs = async () => {
    try {
      const data = await getCardioLogs(7);
      setLogs(data);
    } catch (error) {
      console.error('Error loading cardio logs:', error);
    }
  };

  const handleSave = async () => {
    const totalMin = (parseFloat(min) || 0) + (parseFloat(sec) || 0) / 60;
    if (totalMin <= 0) {
      Alert.alert('Missing Duration', 'Please enter a valid duration.');
      return;
    }

    try {
      await insertCardioLog({
        date,
        type,
        duration_minutes: totalMin,
        distance_km: parseFloat(distance) || 0,
        calories: parseInt(calories) || 0,
        notes,
      });
      await grantXP('cardio_logged', 20);
      Alert.alert('Cardio Logged!', '+20 XP');
      
      setMin('');
      setSec('');
      setDistance('');
      setCalories('');
      setNotes('');
      await loadLogs();
    } catch (error) {
      Alert.alert('Error', 'Could not save cardio session.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete', 'Delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCardioLog(id);
          await loadLogs();
        },
      },
    ]);
  };

  const showDistance = !['HIIT', 'Jump Rope'].includes(type);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>LOG CARDIO</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={styles.typeContent}>
        {CARDIO_TYPES.map(t => (
          <TouchableOpacity
            key={t.name}
            style={[styles.typePill, type === t.name && styles.typePillActive]}
            onPress={() => setType(t.name)}
          >
            <Ionicons name={t.icon as any} size={16} color={type === t.name ? Colors.white : Colors.textMuted} style={styles.typeIcon} />
            <Text style={[styles.typeText, type === t.name && styles.typeTextActive]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <PekkaCard style={styles.formCard}>
        <View style={styles.timeRow}>
          <PekkaInput label="Mins" value={min} onChangeText={setMin} placeholder="00" keyboardType="numeric" style={styles.timeInput} />
          <Text style={styles.semi}>:</Text>
          <PekkaInput label="Secs" value={sec} onChangeText={setSec} placeholder="00" keyboardType="numeric" style={styles.timeInput} />
        </View>

        {showDistance && (
          <PekkaInput label="Distance" value={distance} onChangeText={setDistance} placeholder="km/miles" keyboardType="numeric" />
        )}

        <PekkaInput label="Calories Est." value={calories} onChangeText={setCalories} placeholder="kcal" keyboardType="numeric" />
        <PekkaInput label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        <PekkaInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>LOG CARDIO +20 XP</Text>
        </TouchableOpacity>
      </PekkaCard>

      <Text style={styles.sectionTitle}>Recent Cardio</Text>
      {logs.length === 0 ? (
        <EmptyState icon="heart-outline" title="No cardio yet" subtitle="Log your first session above" />
      ) : (
        logs.map(log => {
          const typeDef = CARDIO_TYPES.find(t => t.name === log.type);
          return (
            <PekkaCard key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.logTypeRow}>
                  {typeDef && <Ionicons name={typeDef.icon as any} size={18} color={Colors.blue} style={{marginRight: 8}} />}
                  <Text style={styles.logType}>{log.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(log.id)} style={{padding: 4}}>
                  <Ionicons name="trash-outline" size={16} color={Colors.red} />
                </TouchableOpacity>
              </View>
              <View style={styles.logStats}>
                <Text style={styles.logStatText}>{Math.round(log.duration_minutes)} min</Text>
                {log.distance_km > 0 && <Text style={styles.logStatText}> • {log.distance_km} dist</Text>}
                <Text style={styles.logStatText}> • {formatDate(log.date)}</Text>
              </View>
            </PekkaCard>
          );
        })
      )}
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16, letterSpacing: 1 },
  typeScroll: { flexGrow: 0, marginBottom: 20 },
  typeContent: { gap: 10, paddingRight: 20 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg5,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  typePillActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
  typeIcon: { marginRight: 6 },
  typeText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  typeTextActive: { color: Colors.bg, fontWeight: '800' },
  
  formCard: { marginBottom: 24, padding: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeInput: { flex: 1 },
  semi: { fontSize: 24, color: Colors.textMuted, marginHorizontal: 10, marginTop: 30, fontWeight: 'bold' },
  
  saveBtn: {
    backgroundColor: Colors.blue, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10,
    shadowColor: Colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  logCard: { marginBottom: 10, padding: 14, flexDirection: 'column' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logTypeRow: { flexDirection: 'row', alignItems: 'center' },
  logType: { fontSize: 15, fontWeight: '700', color: Colors.text },
  logStats: { flexDirection: 'row' },
  logStatText: { fontSize: 13, color: Colors.textMuted },
});
