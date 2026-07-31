import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HabitCardProps {
  habit: any;
  onToggle: (id: number, active: boolean) => void;
  onDelete: (id: number, name: string) => void;
}

export default function HabitCard({ habit, onToggle, onDelete }: HabitCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{habit.name}</Text>
        <TouchableOpacity onPress={() => onToggle(habit.id, !habit.is_active)}>
          <View style={[styles.toggle, habit.is_active && styles.toggleActive]}>
            <View style={[styles.thumb, habit.is_active && styles.thumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>{habit.description}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>Confidence: {Math.round(habit.confidence * 100)}%</Text>
        <Text style={styles.metaText}>Trigger: {habit.trigger_type} → {habit.trigger_value}</Text>
        <Text style={styles.metaText}>Triggered: {habit.times_triggered}x</Text>
      </View>
      <View style={styles.confidenceBar}>
        <View style={[styles.confidenceFill, { width: `${habit.confidence * 100}%` }]} />
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(habit.id, habit.name)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { color: '#fff', fontSize: 15, fontWeight: '600' },
  toggle: { width: 40, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingLeft: 2 },
  toggleActive: { backgroundColor: '#3b82f6' },
  thumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  thumbActive: { marginLeft: 20 },
  description: { color: '#aaa', fontSize: 12, lineHeight: 16, marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 12 },
  metaText: { color: '#666', fontSize: 10 },
  confidenceBar: { height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginVertical: 6 },
  confidenceFill: { height: 3, backgroundColor: '#3b82f6', borderRadius: 2 },
  deleteBtn: { alignSelf: 'flex-end', padding: 4 },
  deleteText: { color: '#ef4444', fontSize: 11 },
});