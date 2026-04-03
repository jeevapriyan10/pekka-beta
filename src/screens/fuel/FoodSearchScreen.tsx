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
import { Colors } from '../../theme';
import PekkaInput from '../../components/PekkaInput';
import PekkaCard from '../../components/PekkaCard';
import { searchFoods, getFoods, Food } from '../../db/database';

export default function FoodSearchScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const mealType = route.params?.mealType || 'Snack';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);

  useEffect(() => {
    loadFoods();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      handleSearch();
    } else {
      loadFoods();
    }
  }, [query]);

  const loadFoods = async () => {
    try {
      const foods = await getFoods();
      setResults(foods);
    } catch (error) {
      console.error('Error loading foods:', error);
    }
  };

  const handleSearch = async () => {
    try {
      const foods = await searchFoods(query);
      setResults(foods);
    } catch (error) {
      console.error('Error searching foods:', error);
    }
  };

  const renderFood = ({ item }: { item: Food }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('FoodDetail', { food: item, mealType })}
    >
      <PekkaCard style={styles.foodCard}>
        <View style={styles.foodHeader}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodCals}>{item.calories_per_100g} kcal</Text>
        </View>
        <Text style={styles.foodMeta}>
          P {item.protein_per_100g}g · C {item.carbs_per_100g}g · F {item.fat_per_100g}g per 100g
        </Text>
        {item.brand !== 'Generic' && <Text style={styles.foodBrand}>{item.brand}</Text>}
      </PekkaCard>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Add to {mealType}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <PekkaInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search 120+ foods..."
        />
      </View>

      <Text style={styles.countText}>{results.length} foods</Text>

      <FlatList
        data={results}
        keyExtractor={item => item.id.toString()}
        renderItem={renderFood}
        contentContainerStyle={styles.list}
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
  countText: { fontSize: 12, color: Colors.textDim, paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  foodCard: { marginBottom: 8 },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodName: { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1 },
  foodCals: { fontSize: 14, fontWeight: '700', color: Colors.green },
  foodMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  foodBrand: { fontSize: 11, color: Colors.textDim, marginTop: 2 },
});
