import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PrivacySecurityService, Permission, EndpointSecurity } from '../services/PrivacySecurityService';
import * as Haptics from 'expo-haptics';

export default function SecurityScreen({ navigation }: any) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointSecurity[]>([]);
  const [privacyScore, setPrivacyScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const perms = await PrivacySecurityService.getPermissions();
    setPermissions(perms);
    const eps = await PrivacySecurityService.getEndpointSecurity();
    setEndpoints(eps);
    setPrivacyScore(await PrivacySecurityService.getPrivacyScore());
  };

  const togglePermission = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const perm = permissions.find((p) => p.id === id);
    if (perm) {
      await PrivacySecurityService.updatePermission(id, !perm.granted);
      loadData();
    }
  };

  const renderPermission = ({ item }: { item: Permission }) => (
    <View style={styles.permCard}>
      <View style={styles.permInfo}>
        <Text style={styles.permName}>{item.name}</Text>
        <Text style={styles.permDesc}>{item.description}</Text>
        <Text style={styles.permCategory}>{item.category.toUpperCase()}</Text>
      </View>
      <View style={[styles.statusBadge, item.granted ? styles.permGranted : styles.permDenied]}>
        <Text style={styles.statusBadgeText}>{item.granted ? 'GRANTED' : 'DENIED'}</Text>
      </View>
      <TouchableOpacity style={styles.toggle} onPress={() => togglePermission(item.id)}>
        <View style={[styles.toggleTrack, item.granted && styles.toggleTrackActive]}>
          <View style={[styles.toggleThumb, item.granted && styles.toggleThumbActive]} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderEndpoint = ({ item }: { item: EndpointSecurity }) => (
    <View style={styles.endpointCard}>
      <Text style={styles.endpointUrl}>{item.url}</Text>
      <View style={styles.endpointMeta}>
        <Text style={styles.endpointProtocol}>{item.protocol}</Text>
        <View style={[styles.endpointStatus, item.encrypted ? styles.epSecure : styles.epInsecure]}>
          <Text style={styles.epStatusText}>{item.encrypted ? '🔒 Encrypted' : '⚠️ Unencrypted'}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#000', '#0a1628', '#1e3a5f']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Security & Permissions</Text>
        <Text style={styles.subtitle}>MITEE 3.0 data permission system</Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Overall Privacy Score</Text>
        <Text style={[styles.scoreValue, privacyScore >= 80 && styles.scoreHigh]}>{privacyScore}/100</Text>
      </View>

      <Text style={styles.sectionTitle}>Permissions</Text>
      <FlatList data={permissions} keyExtractor={(item) => item.id} renderItem={renderPermission} contentContainerStyle={styles.list} />

      <Text style={styles.sectionTitle}>Endpoints</Text>
      <FlatList data={endpoints} keyExtractor={(item, i) => i.toString()} renderItem={renderEndpoint} contentContainerStyle={styles.list} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 13, marginTop: 4 },
  scoreCard: { margin: 20, padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, alignItems: 'center' },
  scoreLabel: { color: '#888', fontSize: 13 },
  scoreValue: { color: '#ef4444', fontSize: 36, fontWeight: 'bold' },
  scoreHigh: { color: '#22c55e' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 20, marginTop: 12, marginBottom: 8 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  permCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', padding: 14, borderRadius: 12, marginBottom: 8 },
  permInfo: { flex: 1 },
  permName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  permDesc: { color: '#888', fontSize: 11, marginTop: 2 },
  permCategory: { color: '#555', fontSize: 10, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  permGranted: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  permDenied: { backgroundColor: 'rgba(255,255,255,0.1)' },
  statusBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  toggle: { padding: 4 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingLeft: 2 },
  toggleTrackActive: { backgroundColor: '#3b82f6' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbActive: { marginLeft: 20 },
  endpointCard: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 10, marginBottom: 6 },
  endpointUrl: { color: '#e0e0e0', fontSize: 12, fontFamily: 'monospace' },
  endpointMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  endpointProtocol: { color: '#888', fontSize: 10 },
  endpointStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  epSecure: { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  epInsecure: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  epStatusText: { color: '#fff', fontSize: 9 },
});