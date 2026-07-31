import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitEngine } from '../services/HabitEngine';
import * as Haptics from 'expo-haptics';

export default function MorningRoutineScreen({ navigation }: any) {
  const [wakeTime, setWakeTime] = useState('07:00');
  const morningActions = [
    { id: '1', name: 'Open sheer curtains', deviceAction: { deviceId: 'curtain_bedroom', action: 'open', value: 80 } },
    { id: '2', name: 'Start coffee machine', deviceAction: { deviceId: 'coffee_machine', action: 'start' } },
    { id: '3', name: 'Read weather forecast', deviceAction: { deviceId: 'speaker', action: 'tts', value: 'Good morning. Today is sunny with a high of 24 degrees.' } },
    { id: '4', name: 'Turn on bedroom lights', deviceAction: { deviceId: 'light_bedroom', action: 'on', value: 70 } },
    { id: '5', name: 'Set AC to comfortable temp', deviceAction: { deviceId: 'ac_bedroom', action: 'setTemperature', value: 23 } },
    { id: '6', name: 'Turn off night mode', deviceAction: { deviceId: 'phone', action: 'dnd', value: false } },
  ];

  const toggleAction = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const action = morningActions.find((a) => a.id === id);
    if (action) {
      HabitEngine.createHabit({
        name: `Morning: ${action.name}`,
        description: `Automatically execute at wake time (${wakeTime})`,
        trigger_type: 'time',
        trigger_value: wakeTime,
        action_type: 'device_command',
        action_params: action.deviceAction,
      });
    }
  };

  const activateMorningRoutine = () => {
    Alert.alert(
      'Start Morning Routine',
      `This will execute all enabled actions at ${wakeTime}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            morningActions.forEach((action, i) => {
              setTimeout(() => toggleAction(action.id), i * 300);
            });
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <Text style={styles.title}>Morning Routine</Text>
      <Text style={styles.subtitle}>Wake up automation</Text>

      <View style={styles.timeBlock}>
        <Text style={styles.timeLabel}>Wake Time</Text>
        <Text style={styles.timeValue}>{wakeTime}</Text>
      </View>

      <FlatList
        data={morningActions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.actionCard} onPress={() => toggleAction(item.id)}>
            <Text style={styles.actionName}>{item.name}</Text>
            <Text style={styles.actionDetail}>{JSON.stringify(item.deviceAction)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.activateBtn} onPress={activateMorningRoutine}>
        <Text style={styles.activateBtnText}>☀️ Start Morning Routine</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  timeBlock: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 20, borderRadius: 16, marginBottom: 20 },
  timeLabel: { color: '#888', fontSize: 12 },
  timeValue: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  actionCard: { padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8 },
  actionName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  actionDetail: { color: '#666', fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  list: { paddingBottom: 30 },
  activateBtn: { backgroundColor: '#f59e0b', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  activateBtnText: { color: '#000', fontWeight: '600', fontSize: 16 },
});