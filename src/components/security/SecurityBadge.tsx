import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SecurityBadgeProps {
  encrypted: boolean;
  endpoint: string;
}

export default function SecurityBadge({ encrypted, endpoint }: SecurityBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>{encrypted ? '🔒' : '⚠️'}</Text>
      <View style={styles.info}>
        <Text style={styles.endpoint}>{endpoint}</Text>
        <Text style={styles.status}>{encrypted ? 'TLS 1.3 Encrypted' : 'Unencrypted HTTP'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 6 },
  icon: { fontSize: 18, marginRight: 10 },
  info: { flex: 1 },
  endpoint: { color: '#e0e0e0', fontSize: 13, fontFamily: 'monospace' },
  status: { color: '#888', fontSize: 10, marginTop: 2 },
});