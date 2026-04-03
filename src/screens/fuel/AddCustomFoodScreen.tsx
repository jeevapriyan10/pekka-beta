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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import PekkaCard from '../../components/PekkaCard';
import PekkaInput from '../../components/PekkaInput';
import PekkaButton from '../../components/PekkaButton';
import { getDatabase } from '../../db/database';

export default function AddCustomFoodScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSize, setServingSize] = useState('100');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');
  
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Food name is required');
      return;
    }
    const cals = parseInt(calories);
    const p = parseFloat(protein) || 0;
    const c = parseFloat(carbs) || 0;
    const f = parseFloat(fat) || 0;
    const fib = parseFloat(fiber) || null;
    const serv = parseFloat(servingSize);

    if (isNaN(cals) || isNaN(p) || isNaN(c) || isNaN(f) || isNaN(serv) || serv <= 0) {
      Alert.alert('Invalid', 'Please enter valid numbers for nutrition values and serving size');
      return;
    }

    const calculatedCals = (p * 4) + (c * 4) + (f * 9);
    if (Math.abs(calculatedCals - cals) > (cals * 0.2)) {
      Alert.alert(
        'Check Macros',
        `The calories you entered (${cals}) don't match the macro calories (~${Math.round(calculatedCals)}). Do you want to save anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Anyway', onPress: () => doSave(cals, p, c, f, fib, serv) }
        ]
      );
      return;
    }

    doSave(cals, p, c, f, fib, serv);
  };

  const doSave = async (cals: number, p: number, c: number, f: number, fib: number | null, serv: number) => {
    try {
      const factor = 100 / serv; // Normalize to 100g
      const c100 = Math.round(cals * factor);
      const p100 = p * factor;
      const c_100 = c * factor;
      const f100 = f * factor;
      const fib100 = fib ? fib * factor : null;

      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO foods (name, brand, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_custom)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [name, brand, c100, Math.round(p100*10)/10, Math.round(c_100*10)/10, Math.round(f100*10)/10, fib100 ? Math.round(fib100*10)/10 : null]
      );
      
      Alert.alert('Success', 'Custom food added!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save custom food');
      console.error(e);
    }
  };

  // Preview numbers (if they provided serving = 100, no change, otherwise we show them what they are entering)
  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Custom Food</Text>
        <View style={{width: 32}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <PekkaCard style={styles.formCard}>
          <PekkaInput label="Food Name *" value={name} onChangeText={setName} placeholder="e.g. Grandma's Lasagna" />
          <PekkaInput label="Brand (Optional)" value={brand} onChangeText={setBrand} placeholder="e.g. Homemade" />
          
          <View style={styles.row}>
            <PekkaInput label="Serving Size *" value={servingSize} onChangeText={setServingSize} keyboardType="numeric" style={{flex:1}} />
            <Text style={styles.unitLbl}>grams</Text>
          </View>
          
          <View style={styles.row}>
            <PekkaInput label="Calories *" value={calories} onChangeText={setCalories} keyboardType="numeric" style={{flex:1}} />
            <Text style={styles.unitLbl}>kcal</Text>
          </View>

          <View style={styles.macroRowForm}>
            <PekkaInput label="Protein *" value={protein} onChangeText={setProtein} keyboardType="numeric" style={{flex:1}} placeholder="g" />
            <View style={{width:10}} />
            <PekkaInput label="Carbs *" value={carbs} onChangeText={setCarbs} keyboardType="numeric" style={{flex:1}} placeholder="g" />
            <View style={{width:10}} />
            <PekkaInput label="Fat *" value={fat} onChangeText={setFat} keyboardType="numeric" style={{flex:1}} placeholder="g" />
          </View>

          <PekkaInput label="Fiber (Optional)" value={fiber} onChangeText={setFiber} keyboardType="numeric" placeholder="g" />
        </PekkaCard>

        {name.length > 0 && calories.length > 0 && (
          <PekkaCard style={styles.previewCard}>
            <Text style={styles.previewTitle}>Live Preview</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <View>
                <Text style={styles.pName}>{name} {brand ? `(${brand})` : ''}</Text>
                <Text style={styles.pServ}>{servingSize}g serving</Text>
              </View>
              <View style={{alignItems: 'flex-end'}}>
                <Text style={styles.pCals}>{calories} kcal</Text>
                <Text style={styles.pMacros}>P:{protein||0} C:{carbs||0} F:{fat||0}</Text>
              </View>
            </View>
          </PekkaCard>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <PekkaButton title="SAVE FOOD" onPress={handleSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  
  scroll: { padding: 20, paddingBottom: 120 },
  formCard: { padding: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  unitLbl: { width: 60, fontSize: 16, color: Colors.textMuted, marginLeft: 10, alignSelf:'center', marginTop: 15 },
  macroRowForm: { flexDirection: 'row', justifyContent: 'space-between' },

  previewCard: { padding: 16, backgroundColor: Colors.bg4, borderLeftWidth: 4, borderLeftColor: Colors.blue },
  previewTitle: { fontSize: 11, color: Colors.blue, fontWeight: '800', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  pName: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  pServ: { fontSize: 12, color: Colors.textDim },
  pCals: { fontSize: 20, fontWeight: '900', color: Colors.gold, marginBottom: 4 },
  pMacros: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: Colors.bg },
});
