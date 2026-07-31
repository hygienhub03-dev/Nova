import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitEngine } from '../services/HabitEngine';
import * as Haptics from 'expo-haptics';

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  label: string;
  config: Record<string, any>;
}

export default function AutomationEditorScreen({ navigation }: any) {
  const [flowName, setFlowName] = useState('');
  const [nodes, setNodes] = useState<FlowNode[]>([]);

  const addNode = (type: FlowNode['type']) => {
    const labels: Record<string, string> = {
      trigger: 'When...',
      condition: 'If...',
      action: 'Then...',
      delay: 'Wait...',
    };
    const newNode: FlowNode = {
      id: Date.now().toString(),
      type,
      label: labels[type],
      config: {},
    };
    setNodes([...nodes, newNode]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateNodeConfig = (id: string, config: Record<string, any>) => {
    setNodes(nodes.map((n) => (n.id === id ? { ...n, config } : n)));
  };

  const removeNode = (id: string) => {
    setNodes(nodes.filter((n) => n.id !== id));
  };

  const saveAutomation = () => {
    if (!flowName.trim()) { Alert.alert('Error', 'Flow name is required'); return; }
    if (nodes.length === 0) { Alert.alert('Error', 'Add at least one step'); return; }

    const triggerNode = nodes.find((n) => n.type === 'trigger');
    const actionNodes = nodes.filter((n) => n.type === 'action');

    HabitEngine.createHabit({
      name: flowName,
      description: `Automated flow: ${nodes.length} steps`,
      trigger_type: triggerNode?.config?.triggerType || 'manual',
      trigger_value: triggerNode?.config?.triggerValue || 'manual',
      action_type: 'multi_step',
      action_params: { nodes },
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  const nodeColors: Record<string, string> = {
    trigger: '#f59e0b',
    condition: '#8b5cf6',
    action: '#22c55e',
    delay: '#6b7280',
  };

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Automation Flow Builder</Text>
        <Text style={styles.subtitle}>IF → THEN → ELSE logic</Text>

        <TextInput style={styles.input} placeholder="Flow name (e.g., Morning Routine)" placeholderTextColor="#666" value={flowName} onChangeText={setFlowName} />

        <Text style={styles.sectionTitle}>Add Steps</Text>

        <View style={styles.addRow}>
          {(['trigger', 'condition', 'action', 'delay'] as const).map((type) => (
            <TouchableOpacity key={type} style={[styles.addNodeBtn, { backgroundColor: nodeColors[type] + '33' }]} onPress={() => addNode(type)}>
              <Text style={styles.addNodeText}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.flowContainer}>
          {nodes.map((node, index) => (
            <View key={node.id} style={styles.flowNode}>
              <View style={[styles.nodeHeader, { backgroundColor: nodeColors[node.type] + '44' }]}>
                <Text style={styles.nodeLabel}>{node.label}</Text>
                <TouchableOpacity onPress={() => removeNode(node.id)}>
                  <Text style={styles.removeNodeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.nodeType}>{node.type}</Text>
              {index < nodes.length - 1 && <Text style={styles.flowArrow}>↓</Text>}
            </View>
          ))}
        </View>

        {nodes.length > 0 && (
          <TouchableOpacity style={styles.saveBtn} onPress={saveAutomation}>
            <Text style={styles.saveBtnText}>💾 Save Automation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  addNodeBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  addNodeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  flowContainer: { paddingVertical: 8 },
  flowNode: { marginBottom: 4 },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10 },
  nodeLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  removeNodeText: { color: '#ef4444', fontSize: 14 },
  nodeType: { color: '#888', fontSize: 11, marginLeft: 12 },
  flowArrow: { color: '#555', fontSize: 16, textAlign: 'center', marginVertical: 2 },
  saveBtn: { backgroundColor: '#3b82f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});