import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaCard from '../../components/PekkaCard';
import { getExercises, Exercise } from '../../db/database';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];

export default function ExerciseLibraryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const filtered = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || e.muscle_group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const getDifficultyColor = (d: string) => {
    if (d === 'Beginner') return Colors.green;
    if (d === 'Intermediate') return Colors.gold;
    return Colors.red;
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <PekkaCard style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '20' }]}>
          <Text style={[styles.diffText, { color: getDifficultyColor(item.difficulty) }]}>
            {item.difficulty}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.muscle_group}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.metaText}>{item.equipment}</Text>
      </View>
      <Text style={styles.instructions} numberOfLines={2}>{item.instructions}</Text>
    </PekkaCard>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Exercise Library</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <PekkaInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises..."
        />
      </View>

      {/* Filter Pills */}
      <FlatList
        horizontal
        data={MUSCLE_GROUPS}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterPill, selectedGroup === item && styles.filterPillActive]}
            onPress={() => setSelectedGroup(item)}
          >
            <Text style={[styles.filterText, selectedGroup === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.countText}>{filtered.length} exercises</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderExercise}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  searchContainer: { paddingHorizontal: 20 },
  filterList: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: { backgroundColor: Colors.blueAlpha, borderColor: Colors.blue },
  filterText: { fontSize: 13, color: Colors.textDim, fontWeight: '600' },
  filterTextActive: { color: Colors.blue },
  countText: { fontSize: 12, color: Colors.textDim, paddingHorizontal: 20, marginBottom: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  exerciseCard: { marginBottom: 10 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  metaDot: { fontSize: 12, color: Colors.textDim },
  instructions: { fontSize: 13, color: Colors.textDim, marginTop: 8, lineHeight: 18 },
});
