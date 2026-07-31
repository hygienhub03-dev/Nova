import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
  PanResponder, Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTailscale } from '../context/TailscaleContext';
import { remoteControl } from '../services/RemoteControlService';
import * as Haptics from 'expo-haptics';
import QrCodeGenerator from '../components/QrCodeGenerator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PC_SCREEN_WIDTH = 1920;
const PC_SCREEN_HEIGHT = 1080;

export default function RemoteControlScreen() {
  const { isConnected, currentPeer, connectToPeer, disconnect, startDiscovery, peers, getConnectionInfo } = useTailscale();
  const [showQr, setShowQr] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [mousePos, setMousePos] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });
  const [cursorVisible] = useState(true);
  const [lastMove, setLastMove] = useState(Date.now());
  const panResponder = useRef<any>(null);
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const cursorScale = useRef(new Animated.Value(1)).current;
  const hideCursorTimeout = useRef<any>(null);

  useEffect(() => {
    setupPanResponder();
    return () => {
      if (hideCursorTimeout.current) clearTimeout(hideCursorTimeout.current);
    };
  }, []);

  const setupPanResponder = () => {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: any, gestureState: any) => {
        handleMouseDown(gestureState);
      },
      onPanResponderMove: (evt: any, gestureState: any) => {
        handleMouseMove(gestureState);
      },
      onPanResponderRelease: (evt: any, gestureState: any) => {
        handleMouseUp(gestureState);
      },
      onPanResponderTerminate: () => {
        handleMouseUp({ dx: 0, dy: 0, vx: 0, vy: 0 });
      },
    });
  };

  const handleMouseMove = async (gesture: any) => {
    const now = Date.now();
    if (now - lastMove < 16) return;
    setLastMove(now);

    const newX = Math.max(0, Math.min(SCREEN_WIDTH, mousePos.x + gesture.dx));
    const newY = Math.max(0, Math.min(SCREEN_HEIGHT, mousePos.y + gesture.dy));
    setMousePos({ x: newX, y: newY });

    if (isConnected && currentPeer) {
      const deltaX = (gesture.dx / SCREEN_WIDTH) * PC_SCREEN_WIDTH;
      const deltaY = (gesture.dy / SCREEN_HEIGHT) * PC_SCREEN_HEIGHT;
      await remoteControl.moveMouse(deltaX, deltaY, PC_SCREEN_WIDTH, PC_SCREEN_HEIGHT);
    }

    showCursor();
  };

  const handleMouseDown = async (gesture: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    cursorScale.setValue(0.8);
    Animated.spring(cursorScale, { toValue: 1, friction: 5, useNativeDriver: true }).start();

    if (isConnected && currentPeer) {
      const screenX = (mousePos.x / SCREEN_WIDTH) * PC_SCREEN_WIDTH;
      const screenY = (mousePos.y / SCREEN_HEIGHT) * PC_SCREEN_HEIGHT;
      await remoteControl.clickMouse(screenX, screenY, 'left', 'down');
    }

    showCursor();
  };

  const handleMouseUp = async (gesture: any) => {
    if (isConnected && currentPeer) {
      const screenX = (mousePos.x / SCREEN_WIDTH) * PC_SCREEN_WIDTH;
      const screenY = (mousePos.y / SCREEN_HEIGHT) * PC_SCREEN_HEIGHT;
      await remoteControl.clickMouse(screenX, screenY, 'left', 'up');
    }
    scheduleCursorHide();
  };

  const showCursor = () => {
    if (hideCursorTimeout.current) clearTimeout(hideCursorTimeout.current);
    Animated.timing(cursorOpacity, { toValue: 1, duration: 100, useNativeDriver: true }).start();
  };

  const scheduleCursorHide = () => {
    hideCursorTimeout.current = setTimeout(() => {
      Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, 3000);
  };

  const connectToCurrentPeer = async () => {
    if (!currentPeer) {
      Alert.alert('No Peer', 'Discover peers first by pulling down or checking the Tailscale status.');
      return;
    }
    setConnectionStatus('connecting');
    const success = await connectToPeer(currentPeer);
    setConnectionStatus(success ? 'connected' : 'disconnected');
  };

  const getQrData = () => {
    if (!currentPeer) return '';
    const info = getConnectionInfo(currentPeer);
    return info.qrData;
  };

  const renderPeerList = () => {
    if (peers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No Tailscale peers found</Text>
          <Text style={styles.emptySubtext}>Make sure Tailscale is running on both devices</Text>
        </View>
      );
    }

    return peers.map((peer, index) => (
      <TouchableOpacity
        key={peer.id}
        style={[
          styles.peerCard,
          currentPeer?.id === peer.id && styles.peerCardActive,
        ]}
        onPress={() => {}}
      >
        <View style={styles.peerInfo}>
          <Text style={styles.peerName}>{peer.name}</Text>
          <Text style={styles.peerIp}>{peer.ipv4 || peer.ip}</Text>
          <Text style={styles.peerOs}>{peer.os} {peer.online ? '●' : '○'}</Text>
        </View>
        <View style={[styles.statusDot, peer.online ? styles.statusOnline : styles.statusOffline]} />
      </TouchableOpacity>
    ));
  };

  const renderControlPad = () => {
    if (!isConnected) return null;

    return (
      <View style={styles.controlPad}>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await remoteControl.pressKey('ArrowUp', 38);
          }}>
            <Text style={styles.controlBtnText}>▲</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await remoteControl.pressKey('ArrowLeft', 37);
          }}>
            <Text style={styles.controlBtnText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await remoteControl.pressKey('Enter', 13);
          }}>
            <Text style={styles.controlBtnText}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await remoteControl.pressKey('ArrowRight', 39);
          }}>
            <Text style={styles.controlBtnText}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.controlRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await remoteControl.pressKey('ArrowDown', 40);
          }}>
            <Text style={styles.controlBtnText}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={[styles.controlBtn, styles.ctrlBtnWide]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await remoteControl.pressKey('ControlLeft', 17);
              setTimeout(() => remoteControl.releaseKey('ControlLeft', 17), 100);
            }}
          >
            <Text style={styles.ctrlBtnText}>Ctrl</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.ctrlBtnWide]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await remoteControl.pressKey('AltLeft', 18);
              setTimeout(() => remoteControl.releaseKey('AltLeft', 18), 100);
            }}
          >
            <Text style={styles.ctrlBtnText}>Alt</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlRow}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await remoteControl.scrollMouse(-3);
            }}
          >
            <Text style={styles.controlBtnText}>⊕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await remoteControl.scrollMouse(3);
            }}
          >
            <Text style={styles.controlBtnText}>⊖</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.rightClickBtn]}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (currentPeer) {
                const info = getConnectionInfo(currentPeer);
                setShowQr(true);
              }
            }}
          >
            <Text style={styles.rightClickText}>RClick</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LinearGradient colors={['#000', '#0a1628']} style={styles.gradient}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nova Remote</Text>
          <View style={[styles.statusBadge, isConnected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected]}>
            <Text style={styles.statusBadgeText}>
              {isConnected ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Peer Discovery */}
        {!isConnected && (
          <View style={styles.discoverySection}>
            <Text style={styles.sectionTitle}>Available Peers (Tailscale)</Text>
            {renderPeerList()}
            <TouchableOpacity style={styles.discoverBtn} onPress={startDiscovery}>
              <Text style={styles.discoverBtnText}>Refresh Peers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connection Info */}
        {currentPeer && (
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionLabel}>Connected to: {currentPeer.name}</Text>
            <Text style={styles.connectionIp}>{currentPeer.ipv4 || 'Tailscale IP'}</Text>
          </View>
        )}

        {/* Remote Screen Area */}
        <View style={styles.screenArea} {...panResponder.current?.panHandlers}>
          {/* Simulated PC Screen */}
          <View style={styles.pcScreen}>
            <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.pcScreenBg}>
              {isConnected ? (
                <View style={styles.pcScreenContent}>
                  <Text style={styles.pcScreenText}>PC Screen Live</Text>
                  <Text style={styles.pcScreenSubtext}>Connected via Tailscale</Text>
                </View>
              ) : (
                <View style={styles.pcScreenPlaceholder}>
                  <Text style={styles.placeholderText}>Connect to a PC to see its screen</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Cursor */}
          <Animated.View
            style={[
              styles.cursor,
              {
                left: mousePos.x - 12,
                top: mousePos.y - 12,
                opacity: cursorOpacity,
                transform: [{ scale: cursorScale }],
              },
            ]}
          >
            <View style={styles.cursorDot} />
            <View style={styles.cursorRing} />
          </Animated.View>
        </View>

        {/* Remote Control Pad */}
        {renderControlPad()}

        {/* Action Buttons */}
        <View style={styles.actionBar}>
          {isConnected ? (
            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={async () => {
                await disconnect();
                setConnectionStatus('disconnected');
              }}
            >
              <Text style={styles.disconnectBtnText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.connectBtn, !currentPeer && styles.connectBtnDisabled]}
              onPress={connectToCurrentPeer}
              disabled={!currentPeer}
            >
              <Text style={styles.connectBtnText}>Connect to PC</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => setShowQr(true)}
          >
            <Text style={styles.qrBtnText}>QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* QR Modal */}
        <QrCodeGenerator
          visible={showQr}
          onClose={() => setShowQr(false)}
          connectionInfo={getQrData()}
          peerName={currentPeer?.name || 'PC'}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeConnected: { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
  statusBadgeDisconnected: { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  discoverySection: { paddingHorizontal: 20, marginBottom: 10 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  peerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  peerCardActive: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
  peerInfo: { flex: 1 },
  peerName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  peerIp: { color: '#888', fontSize: 12, marginTop: 2 },
  peerOs: { color: '#666', fontSize: 11, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOnline: { backgroundColor: '#22c55e' },
  statusOffline: { backgroundColor: '#ef4444' },
  discoverBtn: { backgroundColor: 'rgba(59, 130, 246, 0.3)', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  discoverBtnText: { color: '#60a5fa', fontWeight: '600', fontSize: 14 },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 14 },
  emptySubtext: { color: '#444', fontSize: 12, marginTop: 4 },
  connectionInfo: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20, borderRadius: 8, marginBottom: 10 },
  connectionLabel: { color: '#ccc', fontSize: 13 },
  connectionIp: { color: '#60a5fa', fontSize: 12, fontFamily: 'monospace', marginTop: 2 },
  screenArea: { flex: 1, marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pcScreen: { flex: 1, backgroundColor: '#000' },
  pcScreenBg: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pcScreenContent: { alignItems: 'center' },
  pcScreenText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  pcScreenSubtext: { color: '#888', fontSize: 13, marginTop: 8 },
  pcScreenPlaceholder: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  placeholderText: { color: '#555', fontSize: 14 },
  cursor: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  cursorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#000' },
  cursorRing: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  controlPad: { paddingHorizontal: 20, paddingVertical: 12 },
  controlRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  controlBtnText: { color: '#fff', fontSize: 18 },
  ctrlBtnWide: { width: 70, borderRadius: 12 },
  ctrlBtnText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  rightClickBtn: { borderColor: 'rgba(255,255,255,0.3)' },
  rightClickText: { color: '#ccc', fontSize: 11, fontWeight: '600' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  connectBtn: { backgroundColor: '#22c55e', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  connectBtnDisabled: { backgroundColor: '#333', opacity: 0.5 },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  disconnectBtn: { backgroundColor: 'rgba(239, 68, 68, 0.3)', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  disconnectBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  qrBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  qrBtnText: { color: '#ccc', fontWeight: '500', fontSize: 14 },
});