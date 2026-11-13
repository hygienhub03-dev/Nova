import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - expo-crypto types may not be available
import * as Crypto from 'expo-crypto';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'camera' | 'microphone' | 'location' | 'contacts' | 'storage' | 'memory' | 'device_control' | 'network';
  granted: boolean;
  encrypted: boolean;
  lastReviewed: number;
}

export interface EndpointSecurity {
  url: string;
  encrypted: boolean;
  protocol: string;
  lastChecked: number;
  status: 'secure' | 'insecure' | 'unknown';
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  encrypted: boolean;
  created_at: number;
  can_export: boolean;
  can_delete: boolean;
}

export class PrivacySecurityService {

  private static defaultPermissions: Permission[] = [
    { id: 'CAMERA', name: 'Camera Access', description: 'Allow Nova to access camera for flashlight control', category: 'camera', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'MICROPHONE', name: 'Microphone Access', description: 'Allow Nova to process voice commands', category: 'microphone', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'LOCATION', name: 'Location Access', description: 'Allow Nova to use location for automated routines', category: 'location', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'STORAGE', name: 'Storage Access', description: 'Allow Nova to save and read files', category: 'storage', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'MEMORY', name: 'Memory Access', description: 'Allow Nova to read and write learning memories', category: 'memory', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'DEVICE_CONTROL', name: 'Device Control', description: 'Allow Nova to control phone settings and devices', category: 'device_control', granted: false, encrypted: true, lastReviewed: Date.now() },
    { id: 'NETWORK', name: 'Network Access', description: 'Allow Nova to make network requests to OpenRouter and smart home devices', category: 'network', granted: false, encrypted: true, lastReviewed: Date.now() },
  ];

  static async getPermissions(): Promise<Permission[]> {
    try {
      const saved = await AsyncStorage.getItem('nova_permissions');
      if (saved) {
        const savedPerms = JSON.parse(saved);
        return PrivacySecurityService.defaultPermissions.map((p) => {
          const saved = savedPerms.find((sp: any) => sp.id === p.id);
          return saved ? { ...p, granted: saved.granted } : p;
        });
      }
    } catch {}
    return PrivacySecurityService.defaultPermissions;
  }

  static async updatePermission(id: string, granted: boolean): Promise<void> {
    const perms = await this.getPermissions();
    const updated = perms.map((p) => (p.id === id ? { ...p, granted, lastReviewed: Date.now() } : p));
    await AsyncStorage.setItem('nova_permissions', JSON.stringify(updated));
  }

  static async getEndpointSecurity(): Promise<EndpointSecurity[]> {
    const endpoints = [
      { url: 'https://openrouter.ai/api/v1', protocol: 'HTTPS', encrypted: true },
      { url: 'https://api.tailscale.com/api/v2', protocol: 'HTTPS', encrypted: true },
      { url: 'https://api.duckduckgo.com', protocol: 'HTTPS', encrypted: true },
      { url: 'http://pc.local:8765', protocol: 'HTTP', encrypted: false },
      { url: 'ws://pc.local:8765', protocol: 'WebSocket', encrypted: false },
    ];

    return endpoints.map((ep) => ({
      ...ep,
      lastChecked: Date.now(),
      status: ep.encrypted ? ('secure' as const) : ('insecure' as const),
    }));
  }

  static async exportMemory(): Promise<string> {
    const { MemoryEngine } = await import('./MemoryEngine');
    const facts = MemoryEngine.getAllFacts();
    const qaPairs = MemoryEngine.getAllLearnedQA();
    const habits = await import('./HabitEngine');
    const habitData = habits.HabitEngine.getAllHabits();
    const routines = habits.HabitEngine.getRoutineLog(100);

    const exportData = {
      exported_at: Date.now(),
      version: '1.0',
      facts,
      qa_pairs: qaPairs,
      habits: habitData,
      routine_log: routines,
    };

    return JSON.stringify(exportData, null, 2);
  }

  static async clearMemory(): Promise<void> {
    const { MemoryEngine } = await import('./MemoryEngine');
    MemoryEngine.clearAll();
    await AsyncStorage.multiRemove(['nova_permissions', 'connected_pc_ip', 'connected_pc_port']);
  }

  static async getPrivacyScore(): Promise<number> {
    const perms = await this.getPermissions();
    const grantedCount = perms.filter((p) => p.granted).length;
    const encryptedCount = perms.filter((p) => p.encrypted).length;
    const endpointSecurity = await this.getEndpointSecurity();
    const secureEndpoints = endpointSecurity.filter((e) => e.encrypted).length;

    const permScore = (grantedCount / Math.max(1, perms.length)) * 40;
    const encryptionScore = (encryptedCount / Math.max(1, perms.length)) * 30;
    const endpointScore = (secureEndpoints / Math.max(1, endpointSecurity.length)) * 30;

    return Math.round(permScore + encryptionScore + endpointScore);
  }

  static async isEndpointSecure(url: string): Promise<boolean> {
    return url.startsWith('https://') || url.startsWith('wss://');
  }
}