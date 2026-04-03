import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import { getExercises, Exercise } from '../../db/database';

const MUSCLE_GROUPS = ['All', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'];

export default function ExerciseLibraryScreen({ navigation, route }: any) {
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
    const matchesGroup = selectedGroup === 'All' || e.muscle_group.toLowerCase().includes(selectedGroup.toLowerCase());
    return matchesSearch && matchesGroup;
  });

  const getDifficultyColor = (d: string) => {
    if (d === 'Beginner') return Colors.green;
    if (d === 'Intermediate') return Colors.gold;
    return Colors.red;
  };

  const handleSelect = (exercise: Exercise) => {
    if (route.params?.onSelectExercise) {
      route.params.onSelectExercise(exercise);
    }
    navigation.goBack();
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.exerciseCard} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={styles.mainInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.pillsRow}>
          <View style={styles.musclePill}>
            <Text style={styles.musclePillText}>{item.muscle_group}</Text>
          </View>
          <View style={styles.equipPill}>
            <Text style={styles.equipPillText}>{item.equipment}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.diffDot, { backgroundColor: getDifficultyColor(item.difficulty) }]} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Library</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <PekkaInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterWrapper}>
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
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        renderItem={renderExercise}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={20}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  searchIcon: { position: 'absolute', left: 16, top: 18, zIndex: 1 },
  searchInput: { flex: 1, paddingLeft: 46, marginBottom: 0 },
  filterWrapper: { height: 44, marginBottom: 16 },
  filterList: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.bg5,
    justifyContent: 'center',
  },
  filterPillActive: { backgroundColor: Colors.blueAlpha, borderColor: Colors.blue },
  filterText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: Colors.blue },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.bg2, padding: 16, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.bg5,
  },
  mainInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  pillsRow: { flexDirection: 'row', gap: 6 },
  musclePill: { backgroundColor: Colors.bg5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  musclePillText: { fontSize: 11, color: Colors.textDim, fontWeight: '600' },
  equipPill: { backgroundColor: Colors.bg5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  equipPillText: { fontSize: 11, color: Colors.textDim, fontWeight: '600' },
  
  diffDot: { width: 12, height: 12, borderRadius: 6, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.5, shadowRadius: 2, elevation: 3 },
});
