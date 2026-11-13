import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitEngine } from '../services/HabitEngine';
import { SmartHomeDeviceManager } from '../services/SmartHomeDeviceManager';
import { remoteControl } from '../services/RemoteControlService';
import * as Haptics from 'expo-haptics';

interface ActionStep {
  id: string;
  deviceId: string;
  action: string;
  value?: any;
  delay?: number;
}

export default function GlobalExecutionScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  const devices = SmartHomeDeviceManager.getDevices();

  const addStep = () => {
    const newStep: ActionStep = {
      id: Date.now().toString(),
      deviceId: '',
      action: 'toggle',
      value: '',
      delay: 0,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, field: string, value: any) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id));
  };

  const saveRoutine = () => {
    if (!name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    const actions = steps.map((s) => ({ deviceId: s.deviceId, action: s.action, value: s.value }));
    HabitEngine.createHabit({
      name,
      description: `Global execution: ${steps.length} steps`,
      trigger_type: 'manual',
      trigger_value: 'global_execution',
      action_type: 'multi_device',
      action_params: { steps: actions },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const executeRoutine = async () => {
    if (steps.length === 0) return;
    setIsExecuting(true);
    setExecutionLog([]);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const delay = step.delay || 0;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }

      const logLine = `Step ${i + 1}: ${step.deviceId} → ${step.action} ${step.value || ''}`;
      setExecutionLog((prev) => [...prev, logLine]);

      try {
        await SmartHomeDeviceManager.sendDeviceCommand(step.deviceId, step.action, step.value);
        setExecutionLog((prev) => [...prev.slice(0, -1), `${logLine} ✅`]);
      } catch (e) {
        setExecutionLog((prev) => [...prev.slice(0, -1), `${logLine} ❌`]);
      }
    }

    setIsExecuting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View>
          <Text style={styles.title}>Global Execution</Text>
          <Text style={styles.subtitle}>One-step complex operations across devices</Text>

          <TextInput style={styles.input} placeholder="Routine name (e.g. Prepare Car)" placeholderTextColor="#666" value={name} onChangeText={setName} />

          <Text style={styles.sectionTitle}>Action Steps</Text>

          {steps.map((step) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={styles.stepRow}>
                <Text style={styles.stepNum}>#{steps.indexOf(step) + 1}</Text>
                <TextInput style={[styles.input, styles.stepInput]} placeholder="Device ID" placeholderTextColor="#666" value={step.deviceId} onChangeText={(t) => updateStep(step.id, 'deviceId', t)} />
              </View>
              <View style={styles.stepRow}>
                <TextInput style={[styles.input, styles.stepInput]} placeholder="Action (toggle, setTemperature, open)" placeholderTextColor="#666" value={step.action} onChangeText={(t) => updateStep(step.id, 'action', t)} />
                <TextInput style={[styles.input, styles.stepInput]} placeholder="Value" placeholderTextColor="#666" value={String(step.value)} onChangeText={(t) => updateStep(step.id, 'value', t)} />
              </View>
              <View style={styles.stepRow}>
                <Text style={styles.delayLabel}>Delay (sec):</Text>
                <TextInput style={[styles.input, styles.delayInput]} placeholder="0" placeholderTextColor="#666" value={String(step.delay)} keyboardType="numeric" onChangeText={(t) => updateStep(step.id, 'delay', parseInt(t) || 0)} />
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeStep(step.id)}>
                <Text style={styles.removeBtnText}>✕ Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addStepBtn} onPress={addStep}>
            <Text style={styles.addStepBtnText}>+ Add Step</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveBtn} onPress={saveRoutine}>
              <Text style={styles.saveBtnText}>💾 Save Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.execBtn, isExecuting && styles.execBtnDisabled]} onPress={executeRoutine} disabled={isExecuting}>
              <Text style={styles.execBtnText}>{isExecuting ? 'Executing...' : '▶ Execute'}</Text>
            </TouchableOpacity>
          </View>

          {executionLog.length > 0 && (
            <View style={styles.logContainer}>
              <Text style={styles.logTitle}>Execution Log</Text>
              {executionLog.map((line, i) => (
                <Text key={i} style={[styles.logLine, line.includes('✅') ? styles.logSuccess : line.includes('❌') ? styles.logError : styles.logInfo]}>{line}</Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginLeft: 20, marginRight: 20, marginTop: 40, marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 13, marginLeft: 20, marginRight: 20, marginBottom: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 20, marginRight: 20, marginTop: 12, marginBottom: 8 },
  stepCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12, marginHorizontal: 20, marginBottom: 8 },
  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  stepInput: { flex: 1 },
  stepNum: { color: '#60a5fa', fontSize: 14, fontWeight: '600', alignSelf: 'center', width: 30 },
  delayLabel: { color: '#ccc', fontSize: 12, alignSelf: 'center', width: 60 },
  delayInput: { width: 60 },
  removeBtn: { alignSelf: 'flex-end', padding: 4 },
  removeBtnText: { color: '#ef4444', fontSize: 12 },
  addStepBtn: { backgroundColor: 'rgba(59, 130, 246, 0.2)', padding: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
  addStepBtnText: { color: '#60a5fa', fontWeight: '600', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  execBtn: { flex: 1, backgroundColor: '#22c55e', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  execBtnDisabled: { opacity: 0.5 },
  execBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  logContainer: { marginHorizontal: 20, marginTop: 16, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 12 },
  logTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  logLine: { fontSize: 12, fontFamily: 'monospace', marginBottom: 4 },
  logSuccess: { color: '#22c55e' },
  logError: { color: '#ef4444' },
  logInfo: { color: '#ccc' },
});