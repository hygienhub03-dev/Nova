import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, InteractionManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MemoryEngine } from '../services/MemoryEngine';

export default function MemoryManagerScreen({ navigation }: { navigation: any }) {
  const [facts, setFacts] = useState<any[]>([]);
  const [qaPairs, setQaPairs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'facts' | 'qa'>('facts');

  useEffect(() => {
    loadMemories();
    const unsubscribe = navigation.addListener('focus', loadMemories);
    return unsubscribe;
  }, [navigation]);

  const loadMemories = () => {
    InteractionManager.runAfterInteractions(() => {
      const loadedFacts = MemoryEngine.getAllFacts();
      const loadedQA = MemoryEngine.getAllLearnedQA();
      setFacts(loadedFacts);
      setQaPairs(loadedQA);
    });
  };

  const clearAllMemories = () => {
    Alert.alert(
      'Clear AI Memory?',
      'This will erase all learned facts and past Q&A pairs. The AI will forget everything it learned.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            InteractionManager.runAfterInteractions(() => {
              MemoryEngine.clearAll();
              setFacts([]);
              setQaPairs([]);
            });
          },
        },
      ]
    );
  };

  const deleteFact = (id: number) => {
    // MemoryEngine not exposed for single delete; we clear all here
    // For single item deletion, we rely on clearAll for now
    Alert.alert('Info', 'Individual deletion clears all memory. Use with caution.');
  };

  const renderFact = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>
          {item.category === 'user_preference' ? 'Preference' : 'Fact'}
        </Text>
        <Text style={styles.cardTime}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.cardText}>{item.content}</Text>
    </View>
  );

  const renderQA = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>Learned Q&A</Text>
      <Text style={styles.questionText}>{item.question}</Text>
      <Text style={styles.cardText}>{item.answer}</Text>
      {item.keywords ? (
        <Text style={styles.keywords}>Keywords: {item.keywords}</Text>
      ) : null}
    </View>
  );

  const data = activeTab === 'facts' ? facts : qaPairs;

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Memory Bank</Text>
        <Text style={styles.subtitle}>Recursive Learning Database</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'facts' && styles.tabActive]}
          onPress={() => setActiveTab('facts')}
        >
          <Text style={[styles.tabText, activeTab === 'facts' && styles.tabTextActive]}>Facts ({facts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qa' && styles.tabActive]}
          onPress={() => setActiveTab('qa')}
        >
          <Text style={[styles.tabText, activeTab === 'qa' && styles.tabTextActive]}>Q&A Pairs ({qaPairs.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'facts' ? renderFact : renderQA}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No memories yet. Ask complex questions to start the learning process.</Text>
        }
      />

      {(facts.length > 0 || qaPairs.length > 0) && (
        <TouchableOpacity style={styles.clearBtn} onPress={clearAllMemories}>
          <Text style={styles.clearBtnText}>Wipe All Memory</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10 },
  tabActive: { backgroundColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 20, paddingBottom: 100 },
  card: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardLabel: { color: '#60a5fa', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  cardTime: { color: '#666', fontSize: 11 },
  cardText: { color: '#e0e0e0', fontSize: 15, lineHeight: 22 },
  questionText: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  keywords: { color: '#666', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 },
  clearBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  clearBtnText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
});