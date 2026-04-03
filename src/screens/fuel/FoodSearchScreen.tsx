import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableWithoutFeedback,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../theme';
import { getDatabase } from '../../db/database';

export interface Food {
  id: number;
  name: string;
  brand: string | null;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  is_custom: number;
}

export default function FoodSearchScreen({ navigation, route }: any) {
  const { mealType, date } = route.params || { mealType: 'snack', date: '' };
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Quick Add Modal State
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [])
  );

  const loadInitial = async () => {
    try {
      const db = await getDatabase();
      
      // Load recents (last 10 unique)
      const recents = await db.getAllAsync<Food>(`
        SELECT DISTINCT f.* FROM food_entries fe
        JOIN foods f ON fe.food_id = f.id
        ORDER BY fe.logged_at DESC LIMIT 10
      `);
      setRecentFoods(recents);

      // Load all foods (first 50)
      const allF = await db.getAllAsync<Food>('SELECT * FROM foods ORDER BY name ASC LIMIT 50');
      setFoods(allF);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      setIsSearching(true);
      try {
        const db = await getDatabase();
        const results = await db.getAllAsync<Food>(
          `SELECT * FROM foods WHERE name LIKE '%${text}%' OR brand LIKE '%${text}%' ORDER BY name ASC LIMIT 50`
        );
        setFoods(results);
      } catch (e) {
        console.error(e);
      }
    } else {
      setIsSearching(false);
      loadInitial();
    }
  };

  const openQuickAdd = (food: Food) => {
    setSelectedFood(food);
    setQuantity('100');
    setQuickAddVisible(true);
  };

  const handleQuickAddConfirm = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0 || qty > 5000) {
      Alert.alert('Invalid', 'Enter valid quantity');
      return;
    }

    try {
      const factor = qty / 100;
      const c = Math.round(selectedFood.calories_per_100g * factor);
      const p = Math.round(selectedFood.protein_per_100g * factor);
      const cb = Math.round(selectedFood.carbs_per_100g * factor);
      const f = Math.round(selectedFood.fat_per_100g * factor);

      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO food_entries (date, meal_type, food_id, food_name, quantity_g, calories, protein_g, carbs_g, fat_g, logged_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, mealType, selectedFood.id, selectedFood.name, qty, c, p, cb, f, new Date().toISOString()]
      );

      setQuickAddVisible(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to add food');
      console.error(e);
    }
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={styles.foodRow}
      onPress={() => navigation.navigate('FoodDetail', { food: item, mealType, date })}
    >
      <View style={{flex: 1}}>
        <Text style={styles.fName} numberOfLines={1}>
          {item.name} {item.brand && <Text style={styles.fBrand}>({item.brand})</Text>}
        </Text>
        <Text style={styles.fCals}>{item.calories_per_100g} kcal <Text style={{fontSize: 10}}>/ 100g</Text></Text>
        <Text style={styles.fMacros}>P: {item.protein_per_100g}g · C: {item.carbs_per_100g}g · F: {item.fat_per_100g}g</Text>
      </View>
      <TouchableOpacity style={styles.plusBtn} onPress={() => openQuickAdd(item)}>
        <Ionicons name="add" size={24} color={Colors.bg} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add to {mealType}</Text>
        <View style={{width: 32}} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods..."
            placeholderTextColor={Colors.textDim}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => handleSearch('')}><Ionicons name="close-circle" size={18} color={Colors.textMuted} /></TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={isSearching ? foods : (recentFoods.length > 0 ? [...recentFoods, ...foods.filter(f => !recentFoods.find(rf => rf.id === f.id))] : foods)}
        keyExtractor={(item, index) => item.id.toString() + index}
        renderItem={renderFoodItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() => (
           <Text style={styles.sectionTitle}>
             {isSearching ? 'Search Results' : (recentFoods.length > 0 ? 'Recent & All Foods' : 'All Foods')}
           </Text>
        )}
        ListEmptyComponent={() => (
           <View style={{alignItems: 'center', marginTop: 40}}>
             <Text style={{color: Colors.textMuted}}>No foods found for "{searchQuery}"</Text>
           </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('AddCustomFood')}>
          <Ionicons name="add-circle" size={20} color={Colors.blue} />
          <Text style={styles.createBtnText}>Create Custom Food</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Modal */}
      {selectedFood && quickAddVisible && (() => {
        const factor = (parseFloat(quantity) || 0) / 100;
        return (
          <Modal transparent visible animationType="slide" onRequestClose={() => setQuickAddVisible(false)}>
            <TouchableWithoutFeedback onPress={() => setQuickAddVisible(false)}>
              <View style={styles.modalBg}>
                <TouchableWithoutFeedback>
                  <View style={styles.modalSheet}>
                    <View style={styles.dragHandle} />
                    <Text style={styles.mFoodName} numberOfLines={2}>{selectedFood.name}</Text>
                    
                    <View style={styles.qtyRow}>
                      <TextInput
                        style={styles.qtyInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="numeric"
                        autoFocus
                      />
                      <Text style={styles.qtyLbl}>grams</Text>
                    </View>

                    <View style={styles.mMacroGrid}>
                      <View style={styles.mMacroBox}>
                        <Text style={[styles.mMVal, {color: Colors.gold}]}>{Math.round(selectedFood.calories_per_100g * factor)}</Text>
                        <Text style={styles.mMLbl}>kcal</Text>
                      </View>
                      <View style={styles.mMacroBox}>
                        <Text style={[styles.mMVal, {color: Colors.blue}]}>{Math.round(selectedFood.protein_per_100g * factor)}g</Text>
                        <Text style={styles.mMLbl}>Protein</Text>
                      </View>
                      <View style={styles.mMacroBox}>
                        <Text style={[styles.mMVal, {color: Colors.gold}]}>{Math.round(selectedFood.carbs_per_100g * factor)}g</Text>
                        <Text style={styles.mMLbl}>Carbs</Text>
                      </View>
                      <View style={styles.mMacroBox}>
                        <Text style={[styles.mMVal, {color: Colors.orange}]}>{Math.round(selectedFood.fat_per_100g * factor)}g</Text>
                        <Text style={styles.mMLbl}>Fat</Text>
                      </View>
                    </View>

                    <TouchableOpacity style={styles.confirmAddBtn} onPress={handleQuickAddConfirm}>
                      <Text style={styles.confirmAddTxt}>ADD TO {mealType.toUpperCase()}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        );
      })()}

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, textTransform: 'capitalize' },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.bg5, height: 50 },
  searchInput: { flex: 1, color: Colors.text, fontSize: 16, marginLeft: 10, fontWeight: '600' },
  
  list: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontSize: 13, color: Colors.textDim, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  
  foodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg2, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  fName: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  fBrand: { fontSize: 14, fontWeight: '500', color: Colors.textMuted },
  fCals: { fontSize: 14, fontWeight: '800', color: Colors.blue, marginBottom: 4 },
  fMacros: { fontSize: 11, color: Colors.textDim, fontWeight: '700' },
  plusBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 16 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, backgroundColor: Colors.bg, borderTopWidth: 1, borderTopColor: Colors.border },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: Colors.bg3, borderRadius: 16 },
  createBtnText: { color: Colors.blue, fontWeight: '800', marginLeft: 8 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.bg2, padding: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: Colors.borderStrong },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.bg5, alignSelf: 'center', marginBottom: 20 },
  mFoodName: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 20 },
  
  qtyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  qtyInput: { backgroundColor: Colors.bg5, color: Colors.blue, fontSize: 32, fontWeight: '900', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 16, textAlign: 'center', minWidth: 120 },
  qtyLbl: { fontSize: 18, color: Colors.textMuted, marginLeft: 12, fontWeight: '600' },

  mMacroGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  mMacroBox: { flex: 1, backgroundColor: Colors.bg4, padding: 12, borderRadius: 12, alignItems: 'center' },
  mMVal: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  mMLbl: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase' },

  confirmAddBtn: { backgroundColor: Colors.blue, padding: 18, borderRadius: 16, alignItems: 'center' },
  confirmAddTxt: { color: Colors.bg, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
