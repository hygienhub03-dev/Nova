import * as SQLite from 'expo-sqlite';
// @ts-ignore - openDatabaseSync may not be available in this version
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = SQLite.openDatabaseSync('nova_smarthome.db');

db.execSync(`
  CREATE TABLE IF NOT EXISTS smart_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE,
    name TEXT,
    type TEXT,
    brand TEXT,
    model TEXT,
    ip_address TEXT,
    zone TEXT,
    status TEXT,
    capabilities TEXT,
    config TEXT,
    last_seen INTEGER
  );

  CREATE TABLE IF NOT EXISTS scenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    actions TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS device_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    state TEXT,
    value TEXT,
    updated_at INTEGER
  );
`);

export interface SmartDevice {
  device_id: string;
  name: string;
  type: 'light' | 'plug' | 'ac' | 'camera' | 'lock' | 'speaker' | 'tv' | 'curtain' | 'fan' | 'other';
  brand: string;
  model: string;
  ip_address: string;
  zone: string;
  status: 'online' | 'offline' | 'unknown';
  capabilities: string[];
  config: Record<string, any>;
  last_seen?: number;
}

export interface Scene {
  id: number;
  name: string;
  actions: Array<{ deviceId: string; action: string; value?: any }>;
  isActive: boolean;
}

export class SmartHomeDeviceManager {

  static addDevice(device: SmartDevice): number {
    return db.runSync(
      'INSERT INTO smart_devices (device_id, name, type, brand, model, ip_address, zone, status, capabilities, config, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        device.device_id, device.name, device.type, device.brand, device.model,
        device.ip_address, device.zone, device.status,
        JSON.stringify(device.capabilities), JSON.stringify(device.config), Date.now(),
      ]
    );
  }

  static getDevices(): SmartDevice[] {
    const rows = db.getAllSync('SELECT * FROM smart_devices ORDER BY zone, name');
    return rows.map((r: any) => ({
      device_id: r.device_id,
      name: r.name,
      type: r.type,
      brand: r.brand,
      model: r.model,
      ip_address: r.ip_address,
      zone: r.zone,
      status: r.status,
      capabilities: JSON.parse(r.capabilities || '[]'),
      config: JSON.parse(r.config || '{}'),
      last_seen: r.last_seen,
    }));
  }

  static getDevice(deviceId: string): SmartDevice | null {
    const row = db.getFirstSync('SELECT * FROM smart_devices WHERE device_id = ?', [deviceId]);
    if (!row) return null;
    return {
      device_id: row.device_id, name: row.name, type: row.type,
      brand: row.brand, model: row.model, ip_address: row.ip_address,
      zone: row.zone, status: row.status,
      capabilities: JSON.parse(row.capabilities || '[]'),
      config: JSON.parse(row.config || '{}'),
      last_seen: row.last_seen,
    };
  }

  static updateDeviceStatus(deviceId: string, status: string): void {
    db.runSync('UPDATE smart_devices SET status = ?, last_seen = ? WHERE device_id = ?', [status, Date.now(), deviceId]);
  }

  static removeDevice(deviceId: string): void {
    db.runSync('DELETE FROM smart_devices WHERE device_id = ?', [deviceId]);
    db.runSync('DELETE FROM device_states WHERE device_id = ?', [deviceId]);
  }

  static addScene(name: string, actions: Array<{ deviceId: string; action: string; value?: any }>): number {
    return db.runSync(
      'INSERT INTO scenes (name, actions, is_active) VALUES (?, ?, 1)',
      [name, JSON.stringify(actions)]
    );
  }

  static getScenes(): any[] {
    return db.getAllSync('SELECT * FROM scenes WHERE is_active = 1 ORDER BY name');
  }

  static deleteScene(id: number): void {
    db.runSync('DELETE FROM scenes WHERE id = ?', [id]);
  }

  static async executeScene(sceneId: number): Promise<{ success: number; failed: number; results: any[] }> {
    const scene = db.getFirstSync('SELECT * FROM scenes WHERE id = ?', [sceneId]);
    if (!scene) return { success: 0, failed: 0, results: [] };

    const actions = JSON.parse(scene.actions || '[]');
    const results: any[] = [];
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        const result = await this.sendDeviceCommand(action.deviceId, action.action, action.value);
        results.push({ deviceId: action.deviceId, action: action.action, success: true, result });
        success++;
      } catch (e) {
        results.push({ deviceId: action.deviceId, action: action.action, success: false, error: String(e) });
        failed++;
      }
    }

    return { success, failed, results };
  }

  static async sendDeviceCommand(deviceId: string, action: string, value?: any): Promise<any> {
    const device = this.getDevice(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);

    const cmd = {
      device_id: deviceId,
      action,
      value,
      timestamp: Date.now(),
    };

    const storedUrl = await AsyncStorage.getItem('remote_pc_url');
    if (storedUrl) {
      const baseUrl = storedUrl.replace(/^http:\/\//, '').split(':')[0];
      try {
        const response = await axios.post(`http://${baseUrl}:8765/api/smarthome/command`, cmd, { timeout: 5000 });
        return response.data;
      } catch {
        throw new Error('PC controller unreachable');
      }
    }

    return { status: 'queued', command: cmd };
  }

  static async discoverDevices(): Promise<SmartDevice[]> {
    try {
      const storedUrl = await AsyncStorage.getItem('remote_pc_url');
      if (!storedUrl) return [];

      const baseUrl = storedUrl.replace(/^http:\/\//, '');
      const response = await axios.get(`http://${baseUrl}:8765/api/devices`, { timeout: 5000 });
      const devices = response.data.devices || [];

      devices.forEach((d: any) => {
        this.addDevice({
          device_id: d.device_id,
          name: d.name,
          type: d.type,
          brand: d.brand,
          model: d.model,
          ip_address: d.ip_address,
          zone: d.zone || 'default',
          status: 'online',
          capabilities: d.capabilities || [],
          config: d.config || {},
        });
      });

      return this.getDevices();
    } catch {
      return this.getDevices();
    }
  }

  static getDeviceStates(): any[] {
    return db.getAllSync('SELECT * FROM device_states ORDER BY updated_at DESC');
  }

  static updateDeviceState(deviceId: string, state: string, value: string): void {
    db.runSync(
      'INSERT OR REPLACE INTO device_states (device_id, state, value, updated_at) VALUES (?, ?, ?, ?)',
      [deviceId, state, value, Date.now()]
    );
  }
}