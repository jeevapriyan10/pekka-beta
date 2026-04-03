import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import PhysicalStatsScreen from '../screens/onboarding/PhysicalStatsScreen';
import TrainingExperienceScreen from '../screens/onboarding/TrainingExperienceScreen';
import GoalsScreen from '../screens/onboarding/GoalsScreen';
import LeaguePlacementScreen from '../screens/onboarding/LeaguePlacementScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';

const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#06060f' },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhysicalStats" component={PhysicalStatsScreen} />
      <Stack.Screen name="TrainingExperience" component={TrainingExperienceScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="LeaguePlacement" component={LeaguePlacementScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
}
