import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitEngine } from '../services/HabitEngine';
import * as Haptics from 'expo-haptics';

export default function HabitScreen({ navigation }: any) {
  const [habits, setHabits] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', trigger_type: 'time', trigger_value: '', action_type: 'device_command', action_params: '' });

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = () => {
    setHabits(HabitEngine.getAllHabits());
  };

  const addHabit = () => {
    if (!newHabit.name.trim()) {
      Alert.alert('Error', 'Habit name is required');
      return;
    }
    try {
      const params = JSON.parse(newHabit.action_params || '{}');
      HabitEngine.createHabit({ ...newHabit, action_params: params });
      setNewHabit({ name: '', description: '', trigger_type: 'time', trigger_value: '', action_type: 'device_command', action_params: '{}' });
      setShowAddModal(false);
      loadHabits();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Invalid JSON in action params');
    }
  };

  const toggleHabit = (id: number, active: boolean) => {
    HabitEngine.toggleHabit(id, active);
    loadHabits();
  };

  const deleteHabit = (id: number, name: string) => {
    Alert.alert('Delete Habit', `Delete "${name}" and all its routine logs?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { HabitEngine.deleteHabit(id); loadHabits(); } },
    ]);
  };

  const renderHabit = ({ item }: { item: any }) => (
    <View style={styles.habitCard}>
      <View style={styles.habitHeader}>
        <Text style={styles.habitName}>{item.name}</Text>
        <TouchableOpacity onPress={() => toggleHabit(item.id, !item.is_active)}>
          <Text style={item.is_active ? styles.activeText : styles.inactiveText}>
            {item.is_active ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.habitDesc}>{item.description}</Text>
      <View style={styles.habitMeta}>
        <Text style={styles.habitMetaText}>Trigger: {item.trigger_type} → {item.trigger_value}</Text>
        <Text style={styles.habitMetaText}>Action: {item.action_type}</Text>
        <View style={styles.confidenceBar}>
          <View style={[styles.confidenceFill, { width: `${item.confidence * 100}%` }]} />
        </View>
        <Text style={styles.confidenceText}>{Math.round(item.confidence * 100)}% confidence</Text>
      </View>
      <View style={styles.habitActions}>
        <TouchableOpacity onPress={() => Alert.alert('Log Success', 'Mark as successful?', [{ text: 'Yes', onPress: () => HabitEngine.updateConfidence(item.id, true) }])}>
          <Text style={styles.habitActionBtn}>✅ Success</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Alert.alert('Log Failure', 'Mark as failed?', [{ text: 'Yes', onPress: () => HabitEngine.updateConfidence(item.id, false) }])}>
          <Text style={styles.habitActionBtn}>❌ Failed</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteHabit(item.id, item.name)}>
          <Text style={styles.habitActionBtnDanger}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habits & Routines</Text>
        <Text style={styles.subtitle}>Proactive automation engine</Text>
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderHabit}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No habits yet. Create one to start proactive automation.</Text>
        }
      />

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addBtnText}>+ New Habit</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Habit</Text>

            <TextInput style={styles.input} placeholder="Habit name" placeholderTextColor="#666" value={newHabit.name} onChangeText={(t) => setNewHabit({ ...newHabit, name: t })} />

            <TextInput style={styles.input} placeholder="Description" placeholderTextColor="#666" value={newHabit.description} onChangeText={(t) => setNewHabit({ ...newHabit, description: t })} />

            <Text style={styles.label}>Trigger Type</Text>
            <View style={styles.pickerRow}>
              {['time', 'event', 'location', 'device'].map((t) => (
                <TouchableOpacity key={t} style={[styles.pickerBtn, newHabit.trigger_type === t && styles.pickerBtnActive]} onPress={() => setNewHabit({ ...newHabit, trigger_type: t })}>
                  <Text style={[styles.pickerBtnText, newHabit.trigger_type === t && styles.pickerBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Trigger value (e.g. 07:30, laundry_done, home, washing_machine_stopped)" placeholderTextColor="#666" value={newHabit.trigger_value} onChangeText={(t) => setNewHabit({ ...newHabit, trigger_value: t })} />

            <TextInput style={styles.input} placeholder='Action params (JSON, e.g. {"deviceId":"ac1","action":"setTemperature","value":24})' placeholderTextColor="#666" value={newHabit.action_params} onChangeText={(t) => setNewHabit({ ...newHabit, action_params: t })} multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={addHabit}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  list: { padding: 20, paddingBottom: 100 },
  habitCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, marginBottom: 12 },
  habitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  habitName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  activeText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  inactiveText: { color: '#666', fontSize: 13, fontWeight: '600' },
  habitDesc: { color: '#aaa', fontSize: 13, marginBottom: 8, lineHeight: 18 },
  habitMeta: { marginBottom: 8 },
  habitMetaText: { color: '#777', fontSize: 11, marginBottom: 2 },
  confidenceBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginVertical: 4 },
  confidenceFill: { height: 4, backgroundColor: '#3b82f6', borderRadius: 2 },
  confidenceText: { color: '#555', fontSize: 11 },
  habitActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  habitActionBtn: { color: '#60a5fa', fontSize: 13, fontWeight: '500' },
  habitActionBtnDanger: { color: '#ef4444', fontSize: 13, fontWeight: '500' },
  addBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#3b82f6', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
  modalContent: { marginHorizontal: 20, backgroundColor: '#1a1a2e', borderRadius: 20, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  label: { color: '#888', fontSize: 12, marginBottom: 6, marginTop: 4 },
  pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pickerBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  pickerBtnActive: { backgroundColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, borderColor: '#3b82f6' },
  pickerBtnText: { color: '#888', fontSize: 13 },
  pickerBtnTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
  cancelBtnText: { color: '#ccc', fontWeight: '500' },
  createBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: '#3b82f6' },
  createBtnText: { color: '#fff', fontWeight: '600' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
});