import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme';

import HomeScreen from '../screens/home/HomeScreen';
import TrainScreen from '../screens/train/TrainScreen';
import WorkoutSessionScreen from '../screens/train/WorkoutSessionScreen';
import ExerciseLibraryScreen from '../screens/train/ExerciseLibraryScreen';
import WorkoutHistoryScreen from '../screens/train/WorkoutHistoryScreen';
import CardioScreen from '../screens/train/CardioScreen';
import FuelScreen from '../screens/fuel/FuelScreen';
import FoodSearchScreen from '../screens/fuel/FoodSearchScreen';
import FoodDetailScreen from '../screens/fuel/FoodDetailScreen';
import AddCustomFoodScreen from '../screens/fuel/AddCustomFoodScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const TrainStack = createStackNavigator();
const FuelStack = createStackNavigator();

function TrainStackNavigator() {
  return (
    <TrainStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#06060f' } }}>
      <TrainStack.Screen name="TrainHome" component={TrainScreen} />
      <TrainStack.Screen name="WorkoutSession" component={WorkoutSessionScreen} />
      <TrainStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <TrainStack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
      <TrainStack.Screen name="Cardio" component={CardioScreen} />
    </TrainStack.Navigator>
  );
}

function FuelStackNavigator() {
  return (
    <FuelStack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#06060f' } }}>
      <FuelStack.Screen name="FuelHome" component={FuelScreen} />
      <FuelStack.Screen name="FoodSearch" component={FoodSearchScreen} />
      <FuelStack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <FuelStack.Screen name="AddCustomFood" component={AddCustomFoodScreen} />
    </FuelStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Train') iconName = focused ? 'barbell' : 'barbell-outline';
          else if (route.name === 'Fuel') iconName = focused ? 'nutrition' : 'nutrition-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor:
          route.name === 'Home' ? '#00d4ff' :
          route.name === 'Train' ? '#FFD700' :
          route.name === 'Fuel' ? '#2ed573' :
          '#a29bfe',
        tabBarInactiveTintColor: '#3a3a62',
        tabBarStyle: {
          backgroundColor: '#09091a',
          borderTopColor: 'rgba(0,212,255,0.10)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 1,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Train" component={TrainStackNavigator} />
      <Tab.Screen name="Fuel" component={FuelStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
