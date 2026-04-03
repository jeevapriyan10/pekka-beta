import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Fonts } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import PekkaButton from '../../components/PekkaButton';
import PekkaInput from '../../components/PekkaInput';
import {
  getUserProfile,
  updateUserProfile,
  clearAllData,
  UserProfile,
  getWorkoutCount,
  getStreak,
} from '../../db/database';
import { calculateBMI } from '../../utils/tdee';
import { getLeagueForXP } from '../../utils/xp';
import { formatWeight, formatHeight } from '../../utils/formatters';

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editTargetWeight, setEditTargetWeight] = useState('');
  const [editWaterGoal, setEditWaterGoal] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [prof, wCount, wStreak] = await Promise.all([
        getUserProfile(),
        getWorkoutCount(),
        getStreak('workout'),
      ]);
      setProfile(prof);
      setWorkoutCount(wCount);
      setStreak(wStreak?.current_streak || 0);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const openEditModal = () => {
    if (profile) {
      setEditName(profile.name);
      setEditWeight(profile.weight_kg.toString());
      setEditTargetWeight(profile.target_weight_kg.toString());
      setEditWaterGoal((profile.water_goal_ml || 2500).toString());
    }
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateUserProfile({
        name: editName,
        weight_kg: parseFloat(editWeight) || profile?.weight_kg || 0,
        target_weight_kg: parseFloat(editTargetWeight) || profile?.target_weight_kg || 0,
        water_goal_ml: parseInt(editWaterGoal) || 2500,
      });
      setEditModalVisible(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  const handleResetData = () => {
    Alert.alert(
      '⚠️ Reset All Data',
      'This will permanently delete all your data and return to onboarding. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              await AsyncStorage.removeItem('onboarding_complete');
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Onboarding' }],
                })
              );
            } catch (error) {
              Alert.alert('Error', 'Could not reset data.');
            }
          },
        },
      ]
    );
  };

  const leagueInfo = getLeagueForXP(profile?.xp || 0);
  const bmi = profile ? calculateBMI(profile.weight_kg, profile.height_cm) : 0;
  const units = profile?.units || 'metric';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>PROFILE</Text>
          <TouchableOpacity onPress={openEditModal}>
            <Ionicons name="settings-outline" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Profile Hero Card */}
        <PekkaCard style={styles.heroCard}>
          <View style={styles.heroContent}>
            {profile?.profile_photo ? (
              <Image source={{ uri: profile.profile_photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(profile?.name || 'U')}</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{profile?.name}</Text>
              <Text style={styles.heroUsername}>@{profile?.username}</Text>
              {(profile?.city || profile?.country) && (
                <Text style={styles.heroLocation}>
                  {[profile?.city, profile?.country].filter(Boolean).join(', ')}
                </Text>
              )}
              <View style={[styles.leaguePill, { borderColor: leagueInfo.color }]}>
                <Text style={styles.leagueEmoji}>{leagueInfo.emoji}</Text>
                <Text style={[styles.leagueName, { color: leagueInfo.color }]}>{leagueInfo.name}</Text>
              </View>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{workoutCount}</Text>
              <Text style={styles.heroStatLabel}>Workouts</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{streak}</Text>
              <Text style={styles.heroStatLabel}>Streak</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: Colors.gold }]}>{profile?.xp || 0}</Text>
              <Text style={styles.heroStatLabel}>Total XP</Text>
            </View>
          </View>
        </PekkaCard>

        {/* Body Stats Card */}
        <PekkaCard style={styles.bodyCard}>
          <Text style={styles.cardTitle}>Body Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatWeight(profile?.weight_kg || 0, units)}</Text>
              <Text style={styles.statLabel}>Weight</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatHeight(profile?.height_cm || 0, units)}</Text>
              <Text style={styles.statLabel}>Height</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{bmi}</Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile?.body_fat_pct ? `${profile.body_fat_pct}%` : '—'}</Text>
              <Text style={styles.statLabel}>Body Fat</Text>
            </View>
          </View>
        </PekkaCard>

        {/* Goals Card */}
        <PekkaCard style={styles.goalsCard}>
          <Text style={styles.cardTitle}>Goals</Text>
          <View style={styles.goalRow}>
            <View style={[styles.goalChip, { backgroundColor: Colors.blueAlpha }]}>
              <Text style={[styles.goalChipText, { color: Colors.blue }]}>{profile?.goal}</Text>
            </View>
          </View>
          <View style={styles.goalStats}>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>TDEE</Text>
              <Text style={styles.goalStatValue}>{profile?.calorie_goal || 2000} kcal</Text>
            </View>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Protein</Text>
              <Text style={[styles.goalStatValue, { color: Colors.blue }]}>{profile?.protein_goal || 150}g</Text>
            </View>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Carbs</Text>
              <Text style={[styles.goalStatValue, { color: Colors.gold }]}>{profile?.carbs_goal || 250}g</Text>
            </View>
            <View style={styles.goalStat}>
              <Text style={styles.goalStatLabel}>Fat</Text>
              <Text style={[styles.goalStatValue, { color: Colors.orange }]}>{profile?.fat_goal || 65}g</Text>
            </View>
          </View>
        </PekkaCard>

        {/* PRs Card */}
        <PekkaCard style={styles.prsCard}>
          <Text style={styles.cardTitle}>Personal Records</Text>
          {[
            { name: 'Bench Press', value: profile?.bench_pr },
            { name: 'Squat', value: profile?.squat_pr },
            { name: 'Deadlift', value: profile?.deadlift_pr },
          ].map((pr, i) => (
            <View key={i} style={styles.prRow}>
              <Text style={styles.prName}>{pr.name}</Text>
              <Text style={styles.prValue}>
                {pr.value ? formatWeight(pr.value, units) : '—'}
              </Text>
            </View>
          ))}
        </PekkaCard>

        {/* Edit Profile Button */}
        <PekkaButton
          title="EDIT PROFILE"
          variant="secondary"
          onPress={openEditModal}
          style={styles.editBtn}
        />

        {/* Reset Data */}
        {/*<PekkaButton
          title="RESET ALL DATA"
          variant="danger"
          onPress={handleResetData}
          style={styles.resetBtn}
        />*/}
      </ScrollView>


      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <PekkaInput label="Name" value={editName} onChangeText={setEditName} />
              <PekkaInput label="Weight (kg)" value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" />
              <PekkaInput label="Target Weight (kg)" value={editTargetWeight} onChangeText={setEditTargetWeight} keyboardType="numeric" />
              <PekkaInput label="Water Goal (ml)" value={editWaterGoal} onChangeText={setEditWaterGoal} keyboardType="numeric" />
              <PekkaButton title="SAVE CHANGES" onPress={handleSaveEdit} style={{ marginTop: 8 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 20 },
  screenTitle: { fontSize: 32, fontWeight: '900', color: Colors.white, letterSpacing: 4 },
  heroCard: { marginBottom: 16, backgroundColor: Colors.surface, borderColor: Colors.borderStrong },
  heroContent: { flexDirection: 'row', gap: 16, marginBottom: 18 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bg5, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: Colors.blue },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: '800', color: Colors.white },
  heroUsername: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  heroLocation: { fontSize: 12, color: Colors.textDim, marginTop: 2 },
  leaguePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.bg3,
    marginTop: 8,
    gap: 5,
  },
  leagueEmoji: { fontSize: 13 },
  leagueName: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroStats: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 14 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 20, fontWeight: '800', color: Colors.blue },
  heroStatLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  heroStatDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  bodyCard: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    width: '47%',
    backgroundColor: Colors.bg3,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  goalsCard: { marginBottom: 16 },
  goalRow: { marginBottom: 12 },
  goalChip: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  goalChipText: { fontSize: 13, fontWeight: '600' },
  goalStats: { flexDirection: 'row', justifyContent: 'space-between' },
  goalStat: { alignItems: 'center' },
  goalStatLabel: { fontSize: 10, color: Colors.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  goalStatValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  prsCard: { marginBottom: 16 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  prName: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  prValue: { fontSize: 14, fontWeight: '700', color: Colors.blue },
  editBtn: { marginBottom: 12 },
  resetBtn: { marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.white },
});
