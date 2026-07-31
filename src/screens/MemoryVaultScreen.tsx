import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MemoryEngine } from '../services/MemoryEngine';
import { PrivacySecurityService } from '../services/PrivacySecurityService';
import * as Haptics from 'expo-haptics';

export default function MemoryVaultScreen({ navigation }: any) {
  const [facts, setFacts] = useState<any[]>([]);
  const [qaPairs, setQaPairs] = useState<any[]>([]);
  const [exportData, setExportData] = useState<string>('');
  const [privacyScore, setPrivacyScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setFacts(MemoryEngine.getAllFacts());
    setQaPairs(MemoryEngine.getAllLearnedQA());
    const score = await PrivacySecurityService.getPrivacyScore();
    setPrivacyScore(score);
  };

  const clearAll = () => {
    Alert.alert('Clear All Memory', 'This will make Nova forget everything it learned.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: async () => { MemoryEngine.clearAll(); loadData(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  };

  const exportMemory = async () => {
    const data = await PrivacySecurityService.exportMemory();
    setExportData(data);
    await Share.share({ message: data, title: 'Nova Memory Export' });
  };

  const renderFact = ({ item }: { item: any }) => (
    <View style={styles.entryCard}>
      <Text style={styles.entryType}>Fact</Text>
      <Text style={styles.entryContent}>{item.content}</Text>
      <Text style={styles.entryTime}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  const renderQA = ({ item }: { item: any }) => (
    <View style={styles.entryCard}>
      <Text style={styles.entryType}>Learned Q&A</Text>
      <Text style={styles.entryContent}>Q: {item.question}</Text>
      <Text style={styles.entryContent}>A: {item.answer}</Text>
      <Text style={styles.entryTime}>{new Date(item.id).toLocaleString()}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Memory Vault</Text>
        <Text style={styles.subtitle}>Full data control & privacy</Text>
      </View>

      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>MITEE 3.0 Privacy Score</Text>
        <View style={styles.scoreBar}>
          <View style={[styles.scoreFill, { width: `${privacyScore}%` }]} />
        </View>
        <Text style={styles.scoreText}>{privacyScore}/100</Text>
        <Text style={styles.securityDesc}>All endpoints encrypted. Memory exportable. Full data control.</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={exportMemory}>
          <Text style={styles.actionBtnText}>📤 Export Memory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={clearAll}>
          <Text style={styles.dangerBtnText}>🗑 Clear Memory</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Facts ({facts.length})</Text>
      <FlatList data={facts} keyExtractor={(item) => item.id.toString()} renderItem={renderFact} contentContainerStyle={styles.list} />

      <Text style={styles.listTitle}>Learned Q&A ({qaPairs.length})</Text>
      <FlatList data={qaPairs} keyExtractor={(item) => item.id.toString()} renderItem={renderQA} contentContainerStyle={styles.list} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  securityCard: { margin: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  securityTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scoreBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginVertical: 8 },
  scoreFill: { height: 8, backgroundColor: '#22c55e', borderRadius: 4 },
  scoreText: { color: '#22c55e', fontSize: 24, fontWeight: 'bold' },
  securityDesc: { color: '#888', fontSize: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  dangerBtn: { backgroundColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  dangerBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  listTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 20, marginTop: 12, marginBottom: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  entryCard: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 10, marginBottom: 8 },
  entryType: { color: '#60a5fa', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  entryContent: { color: '#e0e0e0', fontSize: 13, lineHeight: 18 },
  entryTime: { color: '#666', fontSize: 10, marginTop: 6 },
});