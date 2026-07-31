import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import SvgUri from 'react-native-svg-uri';
import * as QrCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useTailscale } from '../context/TailscaleContext';

interface QrCodeGeneratorProps {
  visible: boolean;
  onClose: () => void;
  connectionInfo: string;
  peerName: string;
}

export default function QrCodeGenerator({ visible, onClose, connectionInfo, peerName }: QrCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const { tailscaleIp } = useTailscale();

  const handleCopy = async () => {
    await Clipboard.setString(connectionInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({
      message: `Connect to ${peerName} via Tailscale: ${connectionInfo}`,
      title: `Nova Remote - ${peerName}`,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Connect to {peerName}</Text>
          <Text style={styles.subtitle}>Scan this QR code from your PC browser</Text>

          <View style={styles.qrContainer}>
            <QrCode
              value={connectionInfo}
              size={220}
              color="#000000"
              backgroundColor="#ffffff"
              logo={{ uri: 'https://nova-assistant.app/favicon.png' }}
              logoSize={40}
            />
          </View>

          <Text style={styles.connectionText}>{connectionInfo}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCopy}>
              <Text style={styles.actionBtnText}>{copied ? 'Copied' : 'Copy Address'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: { color: '#000', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: '#666', fontSize: 13, marginBottom: 20 },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  connectionText: { color: '#333', fontSize: 14, fontFamily: 'monospace', marginBottom: 16, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtn: { backgroundColor: '#3b82f6', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  closeBtn: { paddingVertical: 10, paddingHorizontal: 30 },
  closeBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
});