import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import { insertFood } from '../../db/database';
import { grantXP } from '../../utils/xp';

export default function AddCustomFoodScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  const handleSave = async () => {
    if (!name || !calories) {
      Alert.alert('Missing Fields', 'Name and calories are required.');
      return;
    }

    try {
      await insertFood({
        name,
        brand: brand || 'Custom',
        calories_per_100g: parseFloat(calories) || 0,
        protein_per_100g: parseFloat(protein) || 0,
        carbs_per_100g: parseFloat(carbs) || 0,
        fat_per_100g: parseFloat(fat) || 0,
        fiber_per_100g: parseFloat(fiber) || 0,
      });

      await grantXP('custom_food_added');
      Alert.alert('Food Created! 🎉', `${name} has been added to your food database.`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not save custom food.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Custom Food</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>All values per 100g</Text>

        <PekkaInput label="Food Name" value={name} onChangeText={setName} placeholder="e.g. Homemade Granola" />
        <PekkaInput label="Brand (optional)" value={brand} onChangeText={setBrand} placeholder="Custom" />
        <PekkaInput label="Calories (kcal)" value={calories} onChangeText={setCalories} placeholder="0" keyboardType="numeric" />
        <PekkaInput label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="0" keyboardType="numeric" />
        <PekkaInput label="Carbohydrates (g)" value={carbs} onChangeText={setCarbs} placeholder="0" keyboardType="numeric" />
        <PekkaInput label="Fat (g)" value={fat} onChangeText={setFat} placeholder="0" keyboardType="numeric" />
        <PekkaInput label="Fiber (g, optional)" value={fiber} onChangeText={setFiber} placeholder="0" keyboardType="numeric" />

        <PekkaButton title="SAVE FOOD" onPress={handleSave} disabled={!name || !calories} style={styles.saveBtn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  subtitle: { fontSize: 13, color: Colors.textMuted, marginBottom: 20 },
  saveBtn: { marginTop: 12 },
});
