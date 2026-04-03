import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import { getDatabase } from '../../db/database';
import { Food } from './FoodSearchScreen';

export default function FoodDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const food: Food = route.params?.food;
  const initialMealType = route.params?.mealType || 'snack';
  const date = route.params?.date || new Date().toISOString().split('T')[0];

  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState(initialMealType);

  if (!food) return null;

  const qty = parseFloat(quantity) || 0;
  const factor = qty / 100;

  const cals = Math.round(food.calories_per_100g * factor);
  const pro = Math.round(food.protein_per_100g * factor);
  const carb = Math.round(food.carbs_per_100g * factor);
  const fat = Math.round(food.fat_per_100g * factor);
  const fiber = food.fiber_per_100g ? Math.round(food.fiber_per_100g * factor) : null;

  const macroTotal = pro + carb + fat || 1;
  const pPct = pro / macroTotal;
  const cPct = carb / macroTotal;
  const fPct = fat / macroTotal;

  const handleAdd = async () => {
    if (qty <= 0 || qty > 5000) {
      Alert.alert('Invalid', 'Enter a valid quantity');
      return;
    }
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO food_entries (date, meal_type, food_id, food_name, quantity_g, calories, protein_g, carbs_g, fat_g, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, mealType, food.id, food.name, qty, cals, pro, carb, fat, new Date().toISOString()]
      );
      // Go back to Diary
      navigation.navigate('Fuel');
    } catch (e) {
      Alert.alert('Error', 'Could not add entry');
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food Details</Text>
        <View style={{width: 32}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleInfo}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
        </View>

        <PekkaCard style={styles.panelCard}>
          <View style={styles.panelTop}>
            <View>
              <Text style={styles.calsLabel}>CALORIES</Text>
              <Text style={styles.calsValue}>{cals} <Text style={{fontSize: 16, color: Colors.textDim}}>kcal</Text></Text>
            </View>
            <View style={styles.donutWrap}>
              <Svg width="80" height="80" viewBox="0 0 80 80">
                <Circle cx="40" cy="40" r="32" stroke={Colors.bg5} strokeWidth="10" fill="none" />
                {macroTotal > 1 && (
                  <G transform="rotate(-90 40 40)">
                    <Circle cx="40" cy="40" r="32" stroke={Colors.blue} strokeWidth="10" fill="none" strokeDasharray={`${pPct * (2 * Math.PI * 32)} 1000`} strokeDashoffset="0" />
                    <Circle cx="40" cy="40" r="32" stroke={Colors.gold} strokeWidth="10" fill="none" strokeDasharray={`${cPct * (2 * Math.PI * 32)} 1000`} strokeDashoffset={`-${pPct * (2 * Math.PI * 32)}`} />
                    <Circle cx="40" cy="40" r="32" stroke={Colors.orange} strokeWidth="10" fill="none" strokeDasharray={`${fPct * (2 * Math.PI * 32)} 1000`} strokeDashoffset={`-${(pPct + cPct) * (2 * Math.PI * 32)}`} />
                  </G>
                )}
              </Svg>
            </View>
          </View>

          <View style={styles.macrosList}>
            <View style={styles.macroRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.mDot, {backgroundColor: Colors.blue}]} />
                <Text style={styles.mRowLbl}>Protein</Text>
              </View>
              <Text style={styles.mRowVal}>{pro}g</Text>
            </View>
            <View style={styles.macroRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.mDot, {backgroundColor: Colors.gold}]} />
                <Text style={styles.mRowLbl}>Carbohydrates</Text>
              </View>
              <Text style={styles.mRowVal}>{carb}g</Text>
            </View>
            <View style={styles.macroRow}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={[styles.mDot, {backgroundColor: Colors.orange}]} />
                <Text style={styles.mRowLbl}>Fat</Text>
              </View>
              <Text style={styles.mRowVal}>{fat}g</Text>
            </View>
            {fiber !== null && (
              <View style={styles.macroRow}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <View style={[styles.mDot, {backgroundColor: Colors.purple}]} />
                  <Text style={styles.mRowLbl}>Dietary Fiber</Text>
                </View>
                <Text style={styles.mRowVal}>{fiber}g</Text>
              </View>
            )}
          </View>
        </PekkaCard>

        <PekkaCard style={styles.controlCard}>
          <Text style={styles.ctrlLbl}>Quantity</Text>
          <View style={styles.qtyBox}>
            <TextInput
              style={styles.qtyInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />
            <Text style={styles.qtyUnit}>grams</Text>
          </View>
        </PekkaCard>

        <PekkaCard style={styles.controlCard}>
          <Text style={styles.ctrlLbl}>Meal</Text>
          <View style={styles.mealPills}>
            {['breakfast', 'lunch', 'dinner', 'snacks'].map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.mealPill, mealType === m && styles.mealPillAct]}
                onPress={() => setMealType(m)}
              >
                <Text style={[styles.mealPillTxt, mealType === m && styles.mealPillTxtAct]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </PekkaCard>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnTxt}>ADD TO MEAL</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  
  scroll: { padding: 20, paddingBottom: 120 },
  titleInfo: { marginBottom: 24, paddingHorizontal: 10 },
  foodName: { fontSize: 28, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  foodBrand: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },

  panelCard: { padding: 20, marginBottom: 16 },
  panelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calsLabel: { fontSize: 12, color: Colors.textMuted, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  calsValue: { fontSize: 36, fontWeight: '900', color: Colors.gold },
  donutWrap: { width: 80, height: 80 },

  macrosList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  mRowLbl: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  mRowVal: { fontSize: 14, color: Colors.textMuted, fontWeight: '700' },

  controlCard: { padding: 16, marginBottom: 16 },
  ctrlLbl: { fontSize: 12, color: Colors.textDim, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12 },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, borderRadius: 12, borderWidth: 1, borderColor: Colors.bg5 },
  qtyInput: { flex: 1, padding: 16, fontSize: 24, fontWeight: '800', color: Colors.blue },
  qtyUnit: { fontSize: 16, color: Colors.textMuted, paddingRight: 16, fontWeight: '600' },

  mealPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mealPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, backgroundColor: Colors.bg4, borderWidth: 1, borderColor: Colors.border },
  mealPillAct: { backgroundColor: Colors.blueAlpha, borderColor: Colors.blue },
  mealPillTxt: { fontSize: 14, color: Colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  mealPillTxtAct: { color: Colors.blue, fontWeight: '800' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: Colors.bg },
  addBtn: { backgroundColor: Colors.blue, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  addBtnTxt: { color: Colors.bg, fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
