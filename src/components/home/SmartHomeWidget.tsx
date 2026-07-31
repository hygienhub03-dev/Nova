import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SmartHomeDeviceManager } from '../../services/SmartHomeDeviceManager';

export default function SmartHomeWidget() {
  const devices = SmartHomeDeviceManager.getDevices().slice(0, 4);

  if (devices.length === 0) return null;

  return (
    <View style={styles.widget}>
      <Text style={styles.widgetTitle}>🏠 Smart Home</Text>
      {devices.map((device) => (
        <View key={device.device_id} style={styles.widgetDevice}>
          <Text style={styles.widgetDeviceIcon}>
            {device.type === 'light' ? '💡' : device.type === 'ac' ? '❄️' : device.type === 'plug' ? '🔌' : '📱'}
          </Text>
          <Text style={styles.widgetDeviceName}>{device.name}</Text>
          <Text style={[styles.widgetDeviceStatus, device.status === 'online' ? styles.statusOnline : styles.statusOffline]}>
            {device.status === 'online' ? '●' : '○'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  widget: { marginHorizontal: 16, marginBottom: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14 },
  widgetTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  widgetDevice: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  widgetDeviceIcon: { fontSize: 18, marginRight: 8 },
  widgetDeviceName: { color: '#ccc', fontSize: 13, flex: 1 },
  widgetDeviceStatus: { fontSize: 10 },
  statusOnline: { color: '#22c55e' },
  statusOffline: { color: '#ef4444' },
});