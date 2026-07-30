import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, StyleSheet, InteractionManager, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Voice from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import Markdown from 'react-native-markdown-display';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { setOrbActivity } from 'expo-orb';
import { AssistantEngine } from '../services/AssistantEngine';
import { DeviceController } from '../services/DeviceController';
import MessageBubble from '../components/MessageBubble';
import Orb from '../components/Orb';
import VoiceButton from '../components/VoiceButton';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setupVoice();
    checkNetwork();
    return () => {
      Voice.destroy();
      Speech.stop();
    };
  }, []);

  const checkNetwork = async () => {
    const offline = await AssistantEngine.isOffline();
    setIsOffline(offline);
  };

  const setupVoice = () => {
    Voice.onSpeechStart = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setOrbActivity(0.8);
    };

    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0];
      if (text) {
        setInputText('');
        handleSendMessage(text);
      }
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      setOrbActivity(0.1);
      InteractionManager.runAfterInteractions(() => {});
    };

    Voice.onSpeechError = (e) => {
      console.error('Voice error:', e.error);
      setIsListening(false);
      setOrbActivity(0.1);
    };
  };

  const toggleVoice = async () => {
    if (isListening) {
      await Voice.stop();
      setIsListening(false);
    } else {
      try {
        await Voice.start('en-US');
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const userMsg = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);
    setOrbActivity(0.6);

    try {
      const response = await AssistantEngine.processQuery(text);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.content || response.data.text || '',
        action: response.action,
      };

      setMessages(prev => [...prev, aiMsg]);

      if (response.action !== 'reply' && response.action !== 'search_web') {
        await DeviceController.executeAction(response.action, response.data);
      }

      if (ttsEnabled && response.action === 'reply') {
        Speech.speak(aiMsg.content, { rate: 0.95 });
      }

      if (response.action === 'search_web') {
        const searchResult = await AssistantEngine.webSearch(response.data.query);
        const searchMsg = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: searchResult,
          action: 'reply',
        };
        setMessages(prev => [...prev, searchMsg]);
        if (ttsEnabled) {
          Speech.speak(searchResult, { rate: 0.95 });
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'An error occurred.' }]);
    } finally {
      setIsProcessing(false);
      setOrbActivity(0.1);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.gradient}>

        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Offline Mode (Using Local Cache)</Text>
          </View>
        )}

        <View style={styles.orbContainer}>
          <Orb processing={isProcessing} />
        </View>

        <Text style={styles.greeting}>Hello</Text>
        <Text style={styles.mainText}>How can I help you today?</Text>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item, index }) => <MessageBubble item={item} index={index} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputArea}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              placeholderTextColor="#888"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage(inputText)}
              returnKeyType="send"
              multiline
            />
            <VoiceButton isListening={isListening} onPress={toggleVoice} />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isProcessing}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center' },
  offlineBanner: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 12, zIndex: 10, alignItems: 'center' },
  offlineText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  orbContainer: { marginTop: 30, alignItems: 'center', justifyContent: 'center', height: 150 },
  greeting: { color: '#888', fontSize: 16, marginTop: 10 },
  mainText: { color: '#fff', fontSize: 26, fontWeight: '600', textAlign: 'center', marginTop: 8, paddingHorizontal: 30 },
  chatContainer: { padding: 16, paddingBottom: 100, width: '100%' },
  inputArea: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 16, paddingBottom: 30, paddingTop: 10 },
  inputWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 30, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', minHeight: 50 },
  input: { flex: 1, color: '#fff', maxHeight: 100, paddingVertical: 12, fontSize: 16 },
  sendBtn: { padding: 10, marginLeft: 4, opacity: 1 },
  sendBtnDisabled: { opacity: 0.3 },
  sendBtnText: { color: '#60a5fa', fontSize: 24, fontWeight: '600' },
});