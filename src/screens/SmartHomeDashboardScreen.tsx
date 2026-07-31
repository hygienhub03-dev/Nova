import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SmartHomeDeviceManager, SmartDevice } from '../services/SmartHomeDeviceManager';
import * as Haptics from 'expo-haptics';

export default function SmartHomeDashboardScreen({ navigation }: any) {
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [deviceStates, setDeviceStates] = useState<any[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setDevices(SmartHomeDeviceManager.getDevices());
    setScenes(SmartHomeDeviceManager.getScenes());
    setDeviceStates(SmartHomeDeviceManager.getDeviceStates());
  };

  const toggleDevice = async (deviceId: string, currentState: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = currentState === 'on' ? 'off' : 'on';
    try {
      await SmartHomeDeviceManager.sendDeviceCommand(deviceId, newState);
      SmartHomeDeviceManager.updateDeviceState(deviceId, newState, newState);
      refreshData();
    } catch {
      // Command queued for when PC is available
      SmartHomeDeviceManager.updateDeviceState(deviceId, newState, newState);
      refreshData();
    }
  };

  const runScene = async (sceneId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await SmartHomeDeviceManager.executeScene(sceneId);
    refreshData();
  };

  const discoverDevices = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await SmartHomeDeviceManager.discoverDevices();
    refreshData();
  };

  const renderDevice = ({ item }: { item: SmartDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceIcon}>
        <Text style={styles.deviceIconText}>
          {item.type === 'light' ? '💡' : item.type === 'ac' ? '❄️' : item.type === 'plug' ? '🔌' : item.type === 'lock' ? '🔐' : item.type === 'tv' ? '📺' : item.type === 'camera' ? '📷' : item.type === 'speaker' ? '🔊' : item.type === 'curtain' ? '🪟' : '📱'}
        </Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceType}>{item.type.toUpperCase()} • {item.brand}</Text>
        <Text style={styles.deviceIp}>{item.ip_address}</Text>
      </View>
      <TouchableOpacity
        style={[styles.toggleBtn, item.status === 'online' ? styles.toggleOn : styles.toggleOff]}
        onPress={() => toggleDevice(item.device_id, item.status)}
      >
        <Text style={styles.toggleText}>{item.status === 'online' ? 'ON' : 'OFF'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScene = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.sceneCard} onPress={() => runScene(item.id)}>
      <Text style={styles.sceneName}>{item.name}</Text>
      <Text style={styles.sceneActions}>
        {JSON.parse(item.actions || '[]').length} actions
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <StatusBar hidden />
      <View style={styles.header}>
        <Text style={styles.title}>Smart Home</Text>
        <Text style={styles.subtitle}>Xiaomi ecosystem + custom devices</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Devices</Text>
        <TouchableOpacity onPress={discoverDevices}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.device_id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No devices found. Tap Refresh to discover.</Text>
        }
      />

      {scenes.length > 0 && (
        <>
          <Text style={styles.sceneHeader}>Scenes</Text>
          <FlatList
            data={scenes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderScene}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sceneList}
          />
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  refreshText: { color: '#60a5fa', fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  deviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 14, marginBottom: 10 },
  deviceIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  deviceIconText: { fontSize: 24 },
  deviceInfo: { flex: 1, marginLeft: 12 },
  deviceName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deviceType: { color: '#888', fontSize: 11, marginTop: 2 },
  deviceIp: { color: '#555', fontSize: 10, marginTop: 1, fontFamily: 'monospace' },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16 },
  toggleOn: { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
  toggleOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
  toggleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sceneHeader: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 20, marginTop: 12, marginBottom: 8 },
  sceneList: { paddingLeft: 20, paddingBottom: 20 },
  sceneCard: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 14, marginRight: 12, width: 160 },
  sceneName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sceneActions: { color: '#888', fontSize: 11, marginTop: 4 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 30, fontSize: 14 },
});