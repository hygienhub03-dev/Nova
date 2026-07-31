import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Alert,
  PermissionsAndroid, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { recognizeSong, ShazamResult } from '../modules/ShazamModule';
import * as Haptics from 'expo-haptics';

export default function ShazamScreen() {
  const navigation = useNavigation();
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [result, setResult] = useState<ShazamResult | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Nova Audio Permission',
          message: 'Nova needs microphone access to recognize songs.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startRecording = async () => {
    try {
      setRecordError(null);
      setResult(null);
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        setRecordError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      durationRef.current = 0;
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setRecordingDuration(durationRef.current);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error: any) {
      setRecordError(`Failed to start recording: ${error.message}`);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsRecording(false);
      setIsRecognizing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (uri) {
        const shazamResult = await recognizeSong(uri);
        setResult(shazamResult);
      }

      setIsRecognizing(false);
    } catch (error: any) {
      setIsRecognizing(false);
      setRecordError(`Recognition failed: ${error.message}`);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetAndListen = () => {
    setResult(null);
    setRecordError(null);
    startRecording();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.gradient}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Shazam</Text>
          <View style={styles.topBarRight} />
        </View>

        <View style={styles.content}>
          {!isRecording && !isRecognizing && !result && (
            <TouchableOpacity style={styles.listenButton} onPress={resetAndListen}>
              <View style={styles.listenButtonInner}>
                <Text style={styles.listenButtonIcon}>🎵</Text>
                <Text style={styles.listenButtonText}>Tap to Listen</Text>
                <Text style={styles.listenButtonSub}>Identify any song</Text>
              </View>
            </TouchableOpacity>
          )}

          {isRecording && (
            <View style={styles.recordingContainer}>
              <View style={[styles.recordingDot, styles.recordingDotActive]} />
              <Text style={styles.recordingText}>Listening...</Text>
              <Text style={styles.recordingTimer}>{formatDuration(recordingDuration)}</Text>
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <View style={styles.stopButtonInner} />
              </TouchableOpacity>
            </View>
          )}

          {isRecognizing && (
            <View style={styles.recognizingContainer}>
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text style={styles.recognizingText}>Identifying song...</Text>
            </View>
          )}

          {result && result.success && (
            <View style={styles.resultCard}>
              <Text style={styles.resultIcon}>🎶</Text>
              <Text style={styles.resultTitle}>{result.title}</Text>
              <Text style={styles.resultArtist}>{result.artist}</Text>
              {result.album && result.album !== 'Unknown' && (
                <Text style={styles.resultAlbum}>{result.album}</Text>
              )}
              {result.genre && (
                <Text style={styles.resultGenre}>{result.genre}</Text>
              )}
              {result.coverUrl && (
                <View style={styles.coverPlaceholder}>
                  <Text style={styles.coverText}>Cover Art</Text>
                </View>
              )}
              <TouchableOpacity style={styles.listenAgainButton} onPress={resetAndListen}>
                <Text style={styles.listenAgainButtonText}>Listen Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {result && !result.success && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>
                {result.error || 'Could not identify this song. Try again.'}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={resetAndListen}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {recordError && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{recordError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={resetAndListen}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8, width: '100%' },
  backBtn: { padding: 8, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { color: '#fff', fontSize: 22 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  topBarRight: { width: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 40 },
  listenButton: { width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(96, 165, 250, 0.15)', borderWidth: 2, borderColor: 'rgba(96, 165, 250, 0.3)', alignItems: 'center', justifyContent: 'center' },
  listenButtonInner: { alignItems: 'center' },
  listenButtonIcon: { fontSize: 64, marginBottom: 8 },
  listenButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  listenButtonSub: { color: '#888', fontSize: 13, marginTop: 4 },
  recordingContainer: { alignItems: 'center' },
  recordingDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#333', marginBottom: 16 },
  recordingDotActive: { backgroundColor: '#ef4444', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 10 },
  recordingText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  recordingTimer: { color: '#888', fontSize: 14, marginTop: 8 },
  stopButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 30, borderWidth: 2, borderColor: 'rgba(239, 68, 68, 0.4)' },
  stopButtonInner: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444' },
  recognizingContainer: { alignItems: 'center', paddingTop: 40 },
  recognizingText: { color: '#888', fontSize: 16, marginTop: 16 },
  resultCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultIcon: { fontSize: 48, marginBottom: 12 },
  resultTitle: { color: '#fff', fontSize: 22, fontWeight: '600', textAlign: 'center' },
  resultArtist: { color: '#60a5fa', fontSize: 16, marginTop: 4 },
  resultAlbum: { color: '#aaa', fontSize: 13, marginTop: 8 },
  resultGenre: { color: '#888', fontSize: 12, marginTop: 4 },
  coverPlaceholder: { width: 160, height: 160, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  coverText: { color: '#555', fontSize: 12 },
  listenAgainButton: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(96, 165, 250, 0.15)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.3)' },
  listenAgainButtonText: { color: '#60a5fa', fontSize: 14, fontWeight: '600' },
  errorCard: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 16, padding: 20, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 20 },
  retryButtonText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
});