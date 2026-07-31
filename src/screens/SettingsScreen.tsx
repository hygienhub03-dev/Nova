import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography } from '../theme/design-tokens';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [localModelEnabled, setLocalModelEnabled] = useState(false);
  const [tailscaleEnabled, setTailscaleEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.multiGet([
        'tts_enabled',
        'openrouter_key',
        'model',
        'local_model_enabled',
        'tailscale_enabled',
      ]);
      if (saved[0][1] !== null) setTtsEnabled(saved[0][1] === 'true');
      if (saved[1][1] !== null) setApiKey(saved[1][1]);
      if (saved[2][1] !== null) setModel(saved[2][1]);
      if (saved[3][1] !== null) setLocalModelEnabled(saved[3][1] === 'true');
      if (saved[4][1] !== null) setTailscaleEnabled(saved[4][1] === 'true');
    } catch {}
  };

  const saveSetting = async (key: string, value: string | boolean | number) => {
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch {}
  };

  const toggleTTS = async (val: boolean) => {
    setTtsEnabled(val);
    await saveSetting('tts_enabled', val);
    if (!val) Speech.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear All Cache',
      'This will erase cached AI responses and learned memories.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['ai_conversation', 'ai_cache']);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const testTTS = () => {
    if (ttsEnabled) {
      Speech.speak('Settings saved successfully.', { rate: 0.95 });
    }
  };

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure Nova</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Text-to-Speech</Text>
          <Switch value={ttsEnabled} onValueChange={toggleTTS} trackColor={{ false: '#333', true: '#3b82f6' }} />
        </View>

        <TouchableOpacity style={styles.testBtn} onPress={testTTS}>
          <Text style={styles.testBtnText}>Test Voice</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OpenRouter API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="sk-or-v1-..."
            placeholderTextColor="#555"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => saveSetting('openrouter_key', apiKey)}
          >
            <Text style={styles.saveBtnText}>Save Key</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Model</Text>
          {[
            { label: 'GPT-4o-mini (Recommended)', value: 'openai/gpt-4o-mini' },
            { label: 'GPT-4o', value: 'openai/gpt-4o' },
            { label: 'Llama 3.1 8B', value: 'meta-llama/llama-3.1-8b-instruct' },
          ].map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[styles.modelBtn, model === m.value && styles.modelBtnActive]}
              onPress={() => { setModel(m.value); saveSetting('model', m.value); }}
            >
              <Text style={styles.modelBtnText}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local Model (Qwen 0.5B)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Enable Offline AI</Text>
            <Switch value={localModelEnabled} onValueChange={(val) => { setLocalModelEnabled(val); saveSetting('local_model_enabled', val); }} />
          </View>
          <Text style={styles.hint}>
            {localModelEnabled
              ? 'Local Qwen 0.5B is active. Saves OpenRouter calls for simple queries.'
              : 'All queries go to OpenRouter. Requires internet.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remote Control (PC)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tailscale Remote Control</Text>
            <Switch value={tailscaleEnabled} onValueChange={(val) => { setTailscaleEnabled(val); saveSetting('tailscale_enabled', val); }} />
          </View>
          <Text style={styles.hint}>
            {tailscaleEnabled
              ? 'Remote control enabled. Use QR code or peer discovery to connect to your PC.'
              : 'Remote control disabled. Toggle on to connect to your PC.'}
          </Text>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 10 }]} onPress={() => navigation.navigate('RemoteControl')}>
            <Text style={styles.saveBtnText}>Open Remote Control →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={clearCache}>
            <Text style={styles.dangerBtnText}>Clear All Cache</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 60 },
  title: { color: colors.textPrimary, fontSize: typography.fontSize.xxxl, fontWeight: typography.fontWeight.bold, marginBottom: spacing.xs },
  subtitle: { color: colors.textTertiary, fontSize: typography.fontSize.md, marginBottom: spacing.xxl },
  section: { marginTop: spacing.xxl, padding: spacing.lg, backgroundColor: colors.glass, borderRadius: borderRadius.lg },
  sectionTitle: { color: colors.textPrimary, fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.semibold, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  label: { color: colors.textSecondary, fontSize: typography.fontSize.lg },
  input: { backgroundColor: colors.glass, color: colors.textPrimary, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, fontSize: typography.fontSize.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, borderRadius: borderRadius.md, alignSelf: 'flex-start', marginTop: spacing.sm },
  saveBtnText: { color: colors.textPrimary, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
  modelBtn: { padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.glass, marginBottom: spacing.sm },
  modelBtnActive: { backgroundColor: 'rgba(59, 130, 246, 0.2)', borderWidth: 1, borderColor: colors.primary },
  modelBtnText: { color: colors.textSecondary, fontSize: typography.fontSize.md },
  hint: { color: colors.textMuted, fontSize: typography.fontSize.sm, marginTop: spacing.sm, lineHeight: 18 },
  testBtn: { backgroundColor: 'rgba(255,255,255,0.08)', padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.sm },
  testBtnText: { color: colors.textSecondary, fontWeight: typography.fontWeight.medium, fontSize: typography.fontSize.md },
  dangerBtn: { backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: spacing.lg, borderRadius: borderRadius.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  dangerBtnText: { color: colors.danger, fontWeight: typography.fontWeight.semibold, fontSize: typography.fontSize.md },
});