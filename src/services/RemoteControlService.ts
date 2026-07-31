import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

interface RemoteCommand {
  type: 'mouse_move' | 'mouse_click' | 'mouse_scroll' | 'key_press' | 'key_release' | 'key_combination' | 'touch_tap' | 'touch_drag' | 'screenshot_request' | 'screen_stream_request' | 'clipboard_send';
  params: Record<string, any>;
  timestamp: number;
}

interface MouseMoveParams {
  deltaX: number;
  deltaY: number;
  screenWidth: number;
  screenHeight: number;
}

interface MouseClickParams {
  x: number;
  y: number;
  button: 'left' | 'right' | 'middle';
  action: 'down' | 'up' | 'click';
}

interface KeyParams {
  key: string;
  keyCode: number;
}

interface ClipboardParams {
  text: string;
}

class RemoteControlService extends EventEmitter {
  private baseUrl: string = '';
  private connected: boolean = false;
  private wsConnection: any = null;
  private messageQueue: RemoteCommand[] = [];
  private sessionId: string = '';

  async connect(pcIp: string, port: number = 8765): Promise<boolean> {
    this.baseUrl = `http://${pcIp}:${port}`;

    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      if (response.status === 200) {
        this.connected = true;
        this.sessionId = response.data.sessionId || 'default';
        this.emit('connected', { ip: pcIp, port });
        await AsyncStorage.setItem('remote_pc_url', this.baseUrl);
        await this.flushQueue();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    if (this.wsConnection) {
      try { this.wsConnection.close(); } catch {}
      this.wsConnection = null;
    }
    this.sessionId = '';
    this.baseUrl = '';
    await AsyncStorage.removeItem('remote_pc_url');
    this.emit('disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async moveMouse(deltaX: number, deltaY: number, screenWidth: number = 1920, screenHeight: number = 1080): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'mouse_move',
      params: { deltaX, deltaY, screenWidth, screenHeight },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async clickMouse(x: number, y: number, button: 'left' | 'right' | 'middle' = 'left', action: 'down' | 'up' | 'click' = 'click'): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'mouse_click',
      params: { x, y, button, action },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async scrollMouse(deltaY: number, x?: number, y?: number): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'mouse_scroll',
      params: { deltaY, x: x || 0, y: y || 0 },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async pressKey(key: string, keyCode: number): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'key_press',
      params: { key, keyCode },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async releaseKey(key: string, keyCode: number): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'key_release',
      params: { key, keyCode },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async sendKeyCombination(keys: string[]): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'key_combination',
      params: { keys },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async sendClipboardText(text: string): Promise<boolean> {
    const cmd: RemoteCommand = {
      type: 'clipboard_send',
      params: { text },
      timestamp: Date.now(),
    };
    return this.sendCommand(cmd);
  }

  async requestScreenshot(): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/screenshot`, {
        timeout: 5000,
        responseType: 'text',
      });
      if (response.data && response.data.image) {
        return response.data.image;
      }
      return null;
    } catch {
      return null;
    }
  }

  async requestScreenStream(): Promise<string | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/stream`, {
        timeout: 10000,
        responseType: 'text',
      });
      if (response.data && response.data.streamUrl) {
        return response.data.streamUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async sendCommand(cmd: RemoteCommand): Promise<boolean> {
    if (!this.connected || !this.baseUrl) {
      this.messageQueue.push(cmd);
      return false;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/command`,
        cmd,
        { timeout: 5000 }
      );

      if (response.status === 200) {
        this.emit('commandExecuted', { type: cmd.type, success: true });
        return true;
      }
      return false;
    } catch (error) {
      this.emit('commandFailed', { type: cmd.type, error });
      return false;
    }
  }

  private async flushQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.connected) {
      const cmd = this.messageQueue.shift();
      if (cmd) {
        await this.sendCommand(cmd);
      }
    }
  }
}

export const remoteControl = new RemoteControlService();