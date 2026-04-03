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
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import PekkaCard from '../../components/PekkaCard';
import EmptyState from '../../components/EmptyState';
import { insertCardioLog, getCardioLogs, deleteCardioLog, CardioLog } from '../../db/database';
import { getTodayString, formatDate } from '../../utils/formatters';
import { grantXP } from '../../utils/xp';

const CARDIO_TYPES = ['Treadmill Run', 'Stationary Bike', 'Jump Rope', 'Rowing Machine', 'Elliptical', 'Stair Climber', 'Outdoor Run', 'Swimming'];

export default function CardioScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [logs, setLogs] = useState<CardioLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

  const loadLogs = async () => {
    try {
      const data = await getCardioLogs(50);
      setLogs(data);
    } catch (error) {
      console.error('Error loading cardio logs:', error);
    }
  };

  const handleSave = async () => {
    if (!type || !duration) {
      Alert.alert('Missing Fields', 'Please select a type and enter duration.');
      return;
    }

    try {
      await insertCardioLog({
        date: getTodayString(),
        type,
        duration_minutes: parseFloat(duration) || 0,
        distance_km: parseFloat(distance) || 0,
        calories: parseInt(calories) || 0,
        notes,
      });
      await grantXP('cardio_logged');
      setShowForm(false);
      setType('');
      setDuration('');
      setDistance('');
      setCalories('');
      setNotes('');
      await loadLogs();
      Alert.alert('Cardio Logged! 🏃', 'Your session has been saved.');
    } catch (error) {
      Alert.alert('Error', 'Could not save cardio session.');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Session', 'Are you sure?', [
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Cardio</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close' : 'add-circle-outline'} size={24} color={Colors.blue} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {showForm && (
          <PekkaCard style={styles.formCard}>
            <Text style={styles.formTitle}>Log Cardio Session</Text>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeGrid}>
              {CARDIO_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typePill, type === t && styles.typePillActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <PekkaInput label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="30" keyboardType="numeric" />
            <PekkaInput label="Distance (km)" value={distance} onChangeText={setDistance} placeholder="Optional" keyboardType="numeric" />
            <PekkaInput label="Calories (estimated)" value={calories} onChangeText={setCalories} placeholder="Optional" keyboardType="numeric" />
            <PekkaInput label="Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />

            <PekkaButton title="SAVE SESSION" onPress={handleSave} disabled={!type || !duration} />
          </PekkaCard>
        )}

        {logs.length === 0 && !showForm ? (
          <EmptyState
            icon="heart-outline"
            title="No cardio sessions"
            subtitle="Tap + to log your first cardio session"
          />
        ) : (
          logs.map(log => (
            <PekkaCard key={log.id} style={styles.logCard}>
              <View style={styles.logHeader}>
                <Text style={styles.logType}>{log.type}</Text>
                <TouchableOpacity onPress={() => handleDelete(log.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.textDim} />
                </TouchableOpacity>
              </View>
              <Text style={styles.logDate}>{formatDate(log.date)}</Text>
              <View style={styles.logStats}>
                <Text style={styles.logStat}>{log.duration_minutes} min</Text>
                {log.distance_km > 0 && <Text style={styles.logStat}>· {log.distance_km} km</Text>}
                {log.calories > 0 && <Text style={styles.logStat}>· {log.calories} cal</Text>}
              </View>
            </PekkaCard>
          ))
        )}
      </ScrollView>
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  formCard: { marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillActive: { backgroundColor: Colors.greenAlpha, borderColor: Colors.green },
  typeText: { fontSize: 12, color: Colors.textDim, fontWeight: '600' },
  typeTextActive: { color: Colors.green },
  logCard: { marginBottom: 10 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logType: { fontSize: 16, fontWeight: '700', color: Colors.text },
  logDate: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  logStats: { flexDirection: 'row', marginTop: 8, gap: 4 },
  logStat: { fontSize: 13, color: Colors.textMuted },
});
