import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import MemoryManagerScreen from '../screens/MemoryManagerScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RemoteControlScreen from '../screens/RemoteControlScreen';
import HabitScreen from '../screens/HabitScreen';
import SmartHomeDashboardScreen from '../screens/SmartHomeDashboardScreen';
import GlobalExecutionScreen from '../screens/GlobalExecutionScreen';
import MemoryVaultScreen from '../screens/MemoryVaultScreen';
import SecurityScreen from '../screens/SecurityScreen';
import AutomationEditorScreen from '../screens/AutomationEditorScreen';
import SleepModeScreen from '../screens/SleepModeScreen';
import MorningRoutineScreen from '../screens/MorningRoutineScreen';
import ShazamScreen from '../screens/ShazamScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a1628' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        cardStyle: { backgroundColor: '#000000' },
        animation: 'fade',
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Nova', headerLeft: () => null }}
      />
      <Stack.Screen
        name="Memory"
        component={MemoryManagerScreen}
        options={{ title: 'AI Memory Bank' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="RemoteControl"
        component={RemoteControlScreen}
        options={{ title: 'Nova Remote' }}
      />
      <Stack.Screen
        name="Habits"
        component={HabitScreen}
        options={{ title: 'Habits & Routines' }}
      />
      <Stack.Screen
        name="SmartHome"
        component={SmartHomeDashboardScreen}
        options={{ title: 'Smart Home' }}
      />
      <Stack.Screen
        name="GlobalExecution"
        component={GlobalExecutionScreen}
        options={{ title: 'Global Execution' }}
      />
      <Stack.Screen
        name="MemoryVault"
        component={MemoryVaultScreen}
        options={{ title: 'Memory Vault' }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ title: 'Security & Privacy' }}
      />
      <Stack.Screen
        name="AutomationEditor"
        component={AutomationEditorScreen}
        options={{ title: 'Automation Builder' }}
      />
      <Stack.Screen
        name="SleepMode"
        component={SleepModeScreen}
        options={{ title: 'Sleep Mode' }}
      />
      <Stack.Screen
        name="MorningRoutine"
        component={MorningRoutineScreen}
        options={{ title: 'Morning Routine' }}
      />
      <Stack.Screen
        name="Shazam"
        component={ShazamScreen}
        options={{ title: 'Shazam' }}
      />
    </Stack.Navigator>
  );
}