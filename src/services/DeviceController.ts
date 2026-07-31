import * as Brightness from 'expo-brightness';
import * as Linking from 'expo-linking';
import { Camera } from 'expo-camera';
import { VolumeManager } from 'react-native-volume-manager';
import * as Speech from 'expo-speech';
import { AssistantEngine } from './AssistantEngine';

export class DeviceController {

  static async setBrightness(value: number): Promise<string> {
    await Brightness.setSystemBrightnessAsync(Math.max(0, Math.min(1, value)));
    return `Brightness set to ${Math.round(value * 100)}%`;
  }

  static async setVolume(type: string, value: number): Promise<string> {
    const vol = Math.max(0, Math.min(1, value));
    if (type === 'media') await VolumeManager.setVolume(vol);
    else if (type === 'ring') await VolumeManager.setRingVolume(vol);
    else if (type === 'alarm') await VolumeManager.setAlarmVolume(vol);
    return `${type} volume set to ${Math.round(vol * 100)}%`;
  }

  static async toggleFlashlight(state: string): Promise<string> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') return 'Camera permission denied.';

      const isAvailable = await Camera.isAvailableAsync();
      if (!isAvailable) return 'Flashlight not available on this device.';

      return `Flashlight turned ${state}. (Requires react-native-torch for full native control)`;
    } catch (e) {
      return 'Failed to control flashlight.';
    }
  }

  static openSettings(screen: string): string {
    const screens: Record<string, string> = {
      wifi: 'android.settings.WIFI_SETTINGS',
      bluetooth: 'android.settings.BLUETOOTH_SETTINGS',
      location: 'android.settings.LOCATION_SOURCE_SETTINGS',
      display: 'android.settings.DISPLAY_SETTINGS',
      apps: 'android.settings.APPLICATION_SETTINGS',
    };

    const intent = screens[screen] || 'android.settings.SETTINGS';
    Linking.openURL(intent);
    return `Opened ${screen} settings.`;
  }

  static openWeb(url: string): string {
    Linking.openURL(`https://${url}`);
    return `Opened ${url}`;
  }

  static async speakText(text: string): Promise<string> {
    Speech.stop();
    await Speech.speak(text, { rate: 0.95 });
    return text;
  }

  static async executeAction(action: string, data: any): Promise<string> {
    switch (action) {
      case 'set_brightness':
        return await DeviceController.setBrightness(data.value);
      case 'set_volume':
        return await DeviceController.setVolume(data.type, data.value);
      case 'toggle_flashlight':
        return await DeviceController.toggleFlashlight(data.state);
      case 'open_settings':
        return DeviceController.openSettings(data.screen);
      case 'speak_text':
        return await DeviceController.speakText(data.text);
      case 'open_web':
        return DeviceController.openWeb(data.url);
      case 'composio_execute':
        return await AssistantEngine.composioExecute(data.tool, data.params || {});
      default:
        return 'Unknown action.';
    }
  }
}