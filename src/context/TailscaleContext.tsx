import React, { createContext, useContext, useState, useEffect } from 'react';
import { TailscalePeer, ConnectionInfo } from '../services/TailscaleService';
import { TailscaleService } from '../services/TailscaleService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TailscaleContextType {
  isConnected: boolean;
  peers: TailscalePeer[];
  currentPeer: TailscalePeer | null;
  tailscaleIp: string | null;
  connecting: boolean;
  discoveryError: string | null;
  startDiscovery: () => Promise<void>;
  connectToPeer: (peer: TailscalePeer, port?: number) => Promise<boolean>;
  disconnect: () => Promise<void>;
  getConnectionInfo: (peer: TailscalePeer, port?: number) => ConnectionInfo;
}

const TailscaleContext = createContext<TailscaleContextType>({
  isConnected: false,
  peers: [],
  currentPeer: null,
  tailscaleIp: null,
  connecting: false,
  discoveryError: null,
  startDiscovery: async () => {},
  connectToPeer: async () => false,
  disconnect: async () => {},
  getConnectionInfo: () => ({ tailscaleIp: '', port: 8765, peerName: '', qrData: '' }),
});

export function TailscaleProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<TailscalePeer[]>([]);
  const [currentPeer, setCurrentPeer] = useState<TailscalePeer | null>(null);
  const [tailscaleIp, setTailscaleIp] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);

  useEffect(() => {
    loadSavedConnection();
    startDiscovery();
  }, []);

  const loadSavedConnection = async () => {
    try {
      const savedIp = await AsyncStorage.getItem('connected_pc_ip');
      const savedName = await AsyncStorage.getItem('connected_pc_name');
      if (savedIp) {
        setCurrentPeer({
          id: 'saved',
          name: savedName || 'Saved PC',
          ip: savedIp,
          hostname: savedName || 'Unknown',
          online: true,
          os: 'Windows',
          ipv4: savedIp,
          ipv6: '',
          lastSeen: Date.now(),
        });
        setIsConnected(true);
      }
    } catch {}
  };

  const startDiscovery = async () => {
    try {
      setDiscoveryError(null);
      const discovered = await TailscaleService.discoverPeers();
      setPeers(discovered);
      const localIp = await TailscaleService.getLocalTailscaleIp();
      if (localIp) setTailscaleIp(localIp);
    } catch (e) {
      setDiscoveryError('Failed to discover peers');
    }
  };

  const connectToPeer = async (peer: TailscalePeer, port: number = 8765): Promise<boolean> => {
    setConnecting(true);
    try {
      const success = await TailscaleService.connectToPeer(peer, port);
      if (success) {
        setCurrentPeer(peer);
        setIsConnected(true);
      }
      setConnecting(false);
      return success;
    } catch {
      setConnecting(false);
      setDiscoveryError('Connection failed');
      return false;
    }
  };

  const disconnect = async () => {
    await TailscaleService.disconnect();
    setCurrentPeer(null);
    setIsConnected(false);
  };

  const getConnectionInfo = (peer: TailscalePeer, port: number = 8765): ConnectionInfo => {
    return TailscaleService.getConnectionInfo(peer, port);
  };

  return (
    <TailscaleContext.Provider
      value={{
        isConnected,
        peers,
        currentPeer,
        tailscaleIp,
        connecting,
        discoveryError,
        startDiscovery,
        connectToPeer,
        disconnect,
        getConnectionInfo,
      }}
    >
      {children}
    </TailscaleContext.Provider>
  );
}

export function useTailscale() {
  const context = useContext(TailscaleContext);
  if (!context) {
    throw new Error('useTailscale must be used within TailscaleProvider');
  }
  return context;
}