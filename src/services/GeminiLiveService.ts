import WebSocket from 'ws';

interface GeminiLiveMessage {
  setup?: {
    model: string;
    generation_config?: Record<string, any>;
    system_instruction?: { parts: { text: string }[] };
    tools?: any[];
    tool_config?: any;
  };
  setupComplete?: boolean;
  realtime_input?: {
    media_chunks?: { data: string; mime_type: string }[];
    text?: string;
    audio?: { data: string; mime_type: string };
  };
  server_content?: {
    model_turn?: { parts?: { text?: string; inline_data?: { data: string; mime_type: string } }[] };
    turn_complete?: boolean;
    interrupted?: boolean;
  };
}

type GeminiEventHandler = (data: any) => void;

export class GeminiLiveService {
  private ws: WebSocket | null = null;
  private apiKey: string = '';
  private model: string = 'gemini-2.5-flash-native-audio-latest';
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private eventHandlers: Map<string, GeminiEventHandler[]> = new Map();
  private onAudioData: ((data: Buffer) => void) | null = null;
  private onInterrupted: (() => void) | null = null;
  private onTurnComplete: (() => void) | null = null;
  private onTextReceived: ((text: string) => void) | null = null;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  setModel(model: string): void {
    this.model = model;
  }

  setCallbacks(callbacks: {
    onAudioData?: (data: Buffer) => void;
    onInterrupted?: () => void;
    onTurnComplete?: () => void;
    onTextReceived?: (text: string) => void;
  }): void {
    this.onAudioData = callbacks.onAudioData || null;
    this.onInterrupted = callbacks.onInterrupted || null;
    this.onTurnComplete = callbacks.onTurnComplete || null;
    this.onTextReceived = callbacks.onTextReceived || null;
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not set');
    }

    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.apiKey}`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log('Gemini Live WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          const setupMsg: GeminiLiveMessage = {
            setup: {
              model: this.model,
              generation_config: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                topP: 0.9,
                topK: 40,
              },
              system_instruction: {
                parts: [{ text: this.getSystemPrompt() }],
              },
            },
          };

          this.ws?.send(JSON.stringify(setupMsg));
          resolve();
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
          this.handleMessage(data);
        });

        this.ws.on('error', (error: Error) => {
          console.error('Gemini Live error:', error.message);
          this.isConnected = false;
        });

        this.ws.on('close', (code: number) => {
          console.log(`Gemini Live closed: ${code}`);
          this.isConnected = false;

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
            setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private getSystemPrompt(): string {
    return `You are Nova, an AI assistant for Android. You help users control their device, search the web, and answer questions. Be concise and natural. When the user asks to control a device, respond with a JSON action like {"action":"toggle_flashlight","params":{"state":"on"}} or {"action":"set_brightness","params":{"value":0.5}}. When no action is needed, respond with normal text.`;
  }

  private handleMessage(raw: WebSocket.RawData): void {
    try {
      const msg: GeminiLiveMessage = JSON.parse(raw.toString());

      if (msg.setupComplete) {
        this.emitEvent('connected', msg);
        return;
      }

      const serverContent = msg.server_content;
      if (!serverContent) return;

      if (serverContent.interrupted) {
        this.emitEvent('interrupted', msg);
        if (this.onInterrupted) this.onInterrupted();
        return;
      }

      if (serverContent.turn_complete) {
        this.emitEvent('turnComplete', msg);
        if (this.onTurnComplete) this.onTurnComplete();
        return;
      }

      const modelTurn = serverContent.model_turn;
      if (modelTurn?.parts) {
        modelTurn.parts.forEach((part) => {
          if (part.text) {
            this.emitEvent('text', { text: part.text });
            if (this.onTextReceived) this.onTextReceived(part.text);
          }
          if (part.inline_data) {
            const buffer = Buffer.from(part.inline_data.data, 'base64');
            this.emitEvent('audio', { data: buffer });
            if (this.onAudioData) this.onAudioData(buffer);
          }
        });
      }
    } catch (error) {
      console.error('Gemini message parse error:', error);
    }
  }

  sendText(text: string): void {
    if (!this.isConnected || !this.ws) return;
    const msg: GeminiLiveMessage = { realtime_input: { text } };
    this.ws.send(JSON.stringify(msg));
  }

  sendAudio(base64Data: string, mimeType: string = 'audio/pcm;rate=16000'): void {
    if (!this.isConnected || !this.ws) return;
    const msg: GeminiLiveMessage = {
      realtime_input: { audio: { data: base64Data, mime_type: mimeType } },
    };
    this.ws.send(JSON.stringify(msg));
  }

  sendAudioBuffer(buffer: Buffer): void {
    this.sendAudio(buffer.toString('base64'));
  }

  sendAudioChunk(pcmData: Int16Array): void {
    this.sendAudioBuffer(Buffer.from(pcmData.buffer));
  }

  endSession(): void {
    if (this.ws) {
      this.ws.close(1000, 'Session ended');
      this.ws = null;
      this.isConnected = false;
    }
  }

  getSessionState(): { connected: boolean; model: string } {
    return { connected: this.isConnected, model: this.model };
  }

  private emitEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((h) => h(data));
  }

  on(event: string, handler: GeminiEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  off(event: string, handler: GeminiEventHandler): void {
    const handlers = this.eventHandlers.get(event) || [];
    this.eventHandlers.set(event, handlers.filter((h) => h !== handler));
  }
}