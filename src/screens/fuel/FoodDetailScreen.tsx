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
import PekkaCard from '../../components/PekkaCard';
import { insertFoodEntry, updateStreak, Food } from '../../db/database';
import { getTodayString } from '../../utils/formatters';
import { grantXP } from '../../utils/xp';

export default function FoodDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const food: Food = route.params?.food;
  const mealType: string = route.params?.mealType || 'Snack';

  const [quantity, setQuantity] = useState('100');
  const grams = parseFloat(quantity) || 0;
  const multiplier = grams / 100;

  const calories = Math.round(food.calories_per_100g * multiplier);
  const protein = Math.round(food.protein_per_100g * multiplier * 10) / 10;
  const carbs = Math.round(food.carbs_per_100g * multiplier * 10) / 10;
  const fat = Math.round(food.fat_per_100g * multiplier * 10) / 10;

  const quickAmounts = [50, 100, 150, 200, 250, 300];

  const handleLog = async () => {
    if (grams <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid amount in grams.');
      return;
    }

    try {
      await insertFoodEntry({
        date: getTodayString(),
        meal_type: mealType,
        food_id: food.id,
        food_name: food.name,
        quantity_g: grams,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
      });

      await grantXP('meal_logged');
      await updateStreak('nutrition', getTodayString());

      Alert.alert('Logged! 🥗', `${food.name} added to ${mealType}`);
      navigation.goBack();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not log food entry.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Food Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PekkaCard style={styles.foodCard}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodBrand}>{food.brand}</Text>
          <Text style={styles.mealBadge}>Adding to: {mealType}</Text>
        </PekkaCard>

        {/* Nutrition Per 100g */}
        <PekkaCard style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Per 100g</Text>
          <View style={styles.nutriGrid}>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValue, { color: Colors.green }]}>{food.calories_per_100g}</Text>
              <Text style={styles.nutriLabel}>kcal</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValue, { color: Colors.blue }]}>{food.protein_per_100g}g</Text>
              <Text style={styles.nutriLabel}>Protein</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValue, { color: Colors.gold }]}>{food.carbs_per_100g}g</Text>
              <Text style={styles.nutriLabel}>Carbs</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValue, { color: Colors.orange }]}>{food.fat_per_100g}g</Text>
              <Text style={styles.nutriLabel}>Fat</Text>
            </View>
          </View>
        </PekkaCard>

        {/* Quantity Input */}
        <PekkaInput
          label="Quantity (grams)"
          value={quantity}
          onChangeText={setQuantity}
          placeholder="100"
          keyboardType="numeric"
        />

        {/* Quick Amounts */}
        <View style={styles.quickRow}>
          {quickAmounts.map(amt => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, quantity === amt.toString() && styles.quickBtnActive]}
              onPress={() => setQuantity(amt.toString())}
            >
              <Text style={[styles.quickText, quantity === amt.toString() && styles.quickTextActive]}>
                {amt}g
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calculated Nutrition */}
        <PekkaCard style={styles.calcCard}>
          <Text style={styles.sectionTitle}>For {grams}g</Text>
          <View style={styles.nutriGrid}>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValueLarge, { color: Colors.green }]}>{calories}</Text>
              <Text style={styles.nutriLabel}>kcal</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValueLarge, { color: Colors.blue }]}>{protein}g</Text>
              <Text style={styles.nutriLabel}>Protein</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValueLarge, { color: Colors.gold }]}>{carbs}g</Text>
              <Text style={styles.nutriLabel}>Carbs</Text>
            </View>
            <View style={styles.nutriItem}>
              <Text style={[styles.nutriValueLarge, { color: Colors.orange }]}>{fat}g</Text>
              <Text style={styles.nutriLabel}>Fat</Text>
            </View>
          </View>
        </PekkaCard>

        <PekkaButton
          title={`LOG ${food.name.toUpperCase()}`}
          onPress={handleLog}
          style={styles.logBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  foodCard: { marginBottom: 16 },
  foodName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  foodBrand: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  mealBadge: { fontSize: 12, color: Colors.blue, fontWeight: '600', marginTop: 8 },
  nutritionCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  nutriGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  nutriItem: { alignItems: 'center' },
  nutriValue: { fontSize: 16, fontWeight: '700' },
  nutriValueLarge: { fontSize: 22, fontWeight: '800' },
  nutriLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnActive: { backgroundColor: Colors.greenAlpha, borderColor: Colors.green },
  quickText: { fontSize: 13, color: Colors.textDim, fontWeight: '600' },
  quickTextActive: { color: Colors.green },
  calcCard: { marginBottom: 24, backgroundColor: Colors.bg3, borderColor: Colors.borderStrong },
  logBtn: { marginBottom: 20 },
});
