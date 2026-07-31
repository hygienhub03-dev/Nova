import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitEngine } from '../services/HabitEngine';
import * as Haptics from 'expo-haptics';

export default function SleepModeScreen({ navigation }: any) {
  const [routineEnabled, setRoutineEnabled] = useState(true);
  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('07:00');

  const sleepActions = [
    { id: '1', name: 'Turn off lights', deviceAction: { deviceId: 'light_living', action: 'off' } },
    { id: '2', name: 'Turn off TV', deviceAction: { deviceId: 'tv_living', action: 'off' } },
    { id: '3', name: 'Lower AC temperature', deviceAction: { deviceId: 'ac_bedroom', action: 'setTemperature', value: 24 } },
    { id: '4', name: 'Lock front door', deviceAction: { deviceId: 'lock_main', action: 'lock' } },
    { id: '5', name: 'Activate sleep mode on speakers', deviceAction: { deviceId: 'speaker_bedroom', action: 'setSleepMode', value: true } },
    { id: '6', name: 'Set phone to Do Not Disturb', deviceAction: { deviceId: 'phone', action: 'dnd', value: true } },
  ];

  const toggleAction = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const action = sleepActions.find((a) => a.id === id);
    if (action) {
      HabitEngine.createHabit({
        name: `Sleep: ${action.name}`,
        description: `Automatically execute at bedtime (${bedtime})`,
        trigger_type: 'time',
        trigger_value: bedtime,
        action_type: 'device_command',
        action_params: action.deviceAction,
      });
    }
  };

  const activateSleepRoutine = () => {
    Alert.alert(
      'Activate Sleep Mode',
      `This will execute all enabled actions at ${bedtime}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sleepActions.forEach((action, i) => {
              setTimeout(() => toggleAction(action.id), i * 300);
            });
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <Text style={styles.title}>Sleep Mode</Text>
      <Text style={styles.subtitle}>Bedtime automation</Text>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Bedtime</Text>
          <Text style={styles.timeValue}>{bedtime}</Text>
        </View>
        <Text style={styles.timeArrow}>→</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Wake Up</Text>
          <Text style={styles.timeValue}>{wakeTime}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.toggleRow} onPress={() => setRoutineEnabled(!routineEnabled)}>
        <Text style={styles.toggleLabel}>Enable Sleep Routine</Text>
        <View style={[styles.toggle, routineEnabled && styles.toggleActive]}>
          <View style={[styles.thumb, routineEnabled && styles.thumbActive]} />
        </View>
      </TouchableOpacity>

      <FlatList
        data={sleepActions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.actionCard} onPress={() => toggleAction(item.id)}>
            <Text style={styles.actionName}>{item.name}</Text>
            <Text style={styles.actionDetail}>{JSON.stringify(item.deviceAction)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.activateBtn} onPress={activateSleepRoutine}>
        <Text style={styles.activateBtnText}>🌙 Activate Sleep Mode</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  timeBlock: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 14 },
  timeLabel: { color: '#888', fontSize: 12 },
  timeValue: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  timeArrow: { color: '#666', fontSize: 20, marginHorizontal: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 16 },
  toggleLabel: { color: '#fff', fontSize: 15 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingLeft: 2 },
  toggleActive: { backgroundColor: '#3b82f6' },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  thumbActive: { marginLeft: 20 },
  actionCard: { padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, marginBottom: 8 },
  actionName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  actionDetail: { color: '#666', fontSize: 11, marginTop: 4, fontFamily: 'monospace' },
  list: { paddingBottom: 30 },
  activateBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  activateBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});