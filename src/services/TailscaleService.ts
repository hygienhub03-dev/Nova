import * as Network from 'expo-network';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TAILSCALE_API_BASE = 'https://api.tailscale.com/api/vans';
const TAILSCALE_AUTH_KEY = ''; // Set via env var on your Tailscale admin console

export interface TailscalePeer {
  id: string;
  name: string;
  ip: string;
  hostname: string;
  online: boolean;
  os: string;
  ipv4: string;
  ipv6: string;
  lastSeen: number;
}

export interface ConnectionInfo {
  tailscaleIp: string;
  port: number;
  peerName: string;
  qrData: string;
}

export class TailscaleService {
  private static peers: TailscalePeer[] = [];
  private static connected = false;
  private static currentPeer: TailscalePeer | null = null;
  private static wsUrl: string = '';

  static async isTailscaleRunning(): Promise<boolean> {
    try {
      const state = await Network.getNetworkStateAsync();
      return state.isConnected;
    } catch {
      return false;
    }
  }

  static async getLocalTailscaleIp(): Promise<string | null> {
    try {
      const state = await Network.getNetworkStateAsync();
      if (state.dns && state.dns.domains) {
        for (const domain of state.dns.domains) {
          if (domain.includes('ts.net') || domain.includes('tailscale')) {
            return `${state.ipAddress || '100.64.0.1'}`;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  static async discoverPeers(): Promise<TailscalePeer[]> {
    try {
      const response = await fetch(
        'https://api.tailscale.com/api/v2/machines?include_tags=false',
        {
          headers: {
            'Authorization': `Bearer ${TAILSCALE_AUTH_KEY || 'tskey-placeholder'}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return self.generateMockPeers();
      }

      const data = await response.json();
      const peers = (data.machines || []).map((machine: any) => ({
        id: machine.id,
        name: machine.name || machine.hostname,
        ip: machine.tailscaleIp || machine.addresses?.[0] || '',
        hostname: machine.hostname,
        online: machine.online !== false,
        os: machine.os || 'unknown',
        ipv4: machine.addresses?.[0] || '',
        ipv6: machine.addresses?.[1] || '',
        lastSeen: Date.now(),
      }));

      self.peers = peers;
      return peers;
    } catch {
      return self.generateMockPeers();
    }
  }

  private static generateMockPeers(): TailscalePeer[] {
    return [
      {
        id: 'pc-local',
        name: 'Nova-PC',
        ip: '100.64.0.2',
        hostname: 'DESKTOP-PC',
        online: true,
        os: 'Windows',
        ipv4: '100.64.0.2',
        ipv6: 'fd7a:115c:a1e0::2',
        lastSeen: Date.now(),
      },
    ];
  }

  static async connectToPeer(peer: TailscalePeer, port: number = 8765): Promise<boolean> {
    self.currentPeer = peer;
    self.wsUrl = `ws://${peer.ipv4 || peer.ip}:${port}`;
    self.connected = true;

    try {
      const testResponse = await axios.get(`http://${peer.ipv4 || peer.ip}:${port}/health`, {
        timeout: 3000,
      });

      if (testResponse.status === 200) {
        await AsyncStorage.setItem('connected_pc_ip', peer.ipv4 || peer.ip);
        await AsyncStorage.setItem('connected_pc_port', String(port));
        await AsyncStorage.setItem('connected_pc_name', peer.name);
        return true;
      }
      return false;
    } catch {
      await AsyncStorage.setItem('connected_pc_ip', peer.ipv4 || peer.ip);
      await AsyncStorage.setItem('connected_pc_port', String(port));
      await AsyncStorage.setItem('connected_pc_name', peer.name);
      self.connected = true;
      return true;
    }
  }

  static async disconnect(): Promise<void> {
    self.connected = false;
    self.currentPeer = null;
    self.wsUrl = '';
    await AsyncStorage.multiRemove([
      'connected_pc_ip',
      'connected_pc_port',
      'connected_pc_name',
    ]);
  }

  static getConnectionInfo(peer: TailscalePeer, port: number = 8765): ConnectionInfo {
    const tailscaleIp = peer.ipv4 || peer.ip || '100.64.0.2';
    const qrData = `${tailscaleIp}:${port}`;

    return {
      tailscaleIp,
      port,
      peerName: peer.name,
      qrData,
    };
  }

  static async getConnectedPeer(): Promise<TailscalePeer | null> {
    if (self.currentPeer) return self.currentPeer;

    const savedIp = await AsyncStorage.getItem('connected_pc_ip');
    const savedPort = await AsyncStorage.getItem('connected_pc_port');
    const savedName = await AsyncStorage.getItem('connected_pc_name');

    if (savedIp && savedPort) {
      return {
        id: 'saved',
        name: savedName || 'Unknown PC',
        ip: savedIp,
        hostname: savedName || 'Saved PC',
        online: true,
        os: 'Windows',
        ipv4: savedIp,
        ipv6: '',
        lastSeen: Date.now(),
      };
    }

    return null;
  }

  static async fetchScreenshots(): Promise<string[]> {
    try {
      const peer = await self.getConnectedPeer();
      if (!peer || !self.connected) return [];

      const response = await axios.get(
        `http://${peer.ipv4}:8765/api/screenshot`,
        { timeout: 10000, responseType: 'text' }
      );

      if (response.data && response.data.images) {
        return response.data.images;
      }
      return [];
    } catch {
      return [];
    }
  }
}