import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import Constants from 'expo-constants';
import { MemoryEngine } from './MemoryEngine';
import { HabitEngine } from './HabitEngine';
import { GeminiLiveService } from './GeminiLiveService';
import { ComposioService } from './ComposioService';

const DUCKDUCKGO_API =
  'https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1';

const getGeminiApiKey = (): string => {
  return (
    (Constants.expoConfig?.extra as any)?.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    ''
  );
};

const getGeminiModel = (): string => {
  return (
    (Constants.expoConfig?.extra as any)?.GEMINI_MODEL ||
    process.env.GEMINI_MODEL ||
    'gemini-2.5-flash-native-audio-latest'
  );
};

const SYSTEM_PROMPT = `You are Nova, a helpful Android AI assistant. You can control device settings, search the web, and execute tasks using Composio tools.

When the user asks to control a device or search, respond ONLY with a JSON object:
{"action": "action_name", "params": {"key": "value"}}

Available actions:
- search_web: params: {"query": "string"}
- set_brightness: params: {"value": number (0 to 1)}
- set_volume: params: {"type": "media|ring|alarm", "value": number (0 to 1)}
- toggle_flashlight: params: {"state": "on|off"}
- open_settings: params: {"screen": "wifi|bluetooth|location|display|apps"}
- speak_text: params: {"text": "string"}
- open_web: params: {"url": "string"}
- composio_execute: params: {"tool": "tool_name", "params": {}}

If no action is needed, respond with normal text. Do not include markdown formatting or backticks in JSON responses.`;

export class AssistantEngine {
  private static geminiService = new GeminiLiveService();
  private static cache = new Map<string, string>();

  static async isOffline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return !state.isConnected;
  }

  static async getCachedResponse(prompt: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${prompt}`);
      return cached;
    } catch {
      return null;
    }
  }

  static async cacheResponse(prompt: string, response: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${prompt}`, response);
    } catch {}
  }

  static setApiKey(key: string): void {
    AssistantEngine.geminiService.setApiKey(key);
  }

  static async connectGemini(): Promise<void> {
    AssistantEngine.geminiService.setApiKey(getGeminiApiKey());
    AssistantEngine.geminiService.setModel(getGeminiModel());
    await AssistantEngine.geminiService.connect();
  }

  static disconnectGemini(): void {
    AssistantEngine.geminiService.endSession();
  }

  static setupGeminiCallbacks(callbacks: {
    onAudioData?: (data: Buffer) => void;
    onInterrupted?: () => void;
    onTurnComplete?: () => void;
    onTextReceived?: (text: string) => void;
  }): void {
    AssistantEngine.geminiService.setCallbacks(callbacks);
  }

  static sendGeminiText(text: string): void {
    AssistantEngine.geminiService.sendText(text);
  }

  static sendGeminiAudio(base64Data: string): void {
    AssistantEngine.geminiService.sendAudio(base64Data);
  }

  static getGeminiState(): { connected: boolean; model: string } {
    return AssistantEngine.geminiService.getSessionState();
  }

  static async processQuery(userPrompt: string): Promise<{ action: string; data: any }> {
    const isOffline = await this.isOffline();

    if (isOffline) {
      const cached = await this.getCachedResponse(userPrompt);
      if (cached) {
        return { action: 'reply', data: { content: `[Offline Mode] ${cached}` } };
      }
      return {
        action: 'reply',
        data: { content: "I'm offline and couldn't find this in my cache." },
      };
    }

    try {
      const response = await this.callGeminiLive(userPrompt);

      if (response.action) {
        return { action: response.action, data: response.params || response };
      }

      await this.cacheResponse(userPrompt, response.text);
      this.extractAndSaveLearnings(userPrompt, response.text);

      return { action: 'reply', data: { content: response.text } };
    } catch (error) {
      const cached = await this.getCachedResponse(userPrompt);
      if (cached) {
        return {
          action: 'reply',
          data: { content: `[Network Error] ${cached}` },
        };
      }
      return {
        action: 'reply',
        data: { content: 'Network error and no cache available.' },
      };
    }
  }

  private static async callGeminiLive(userPrompt: string): Promise<{ action?: string; params?: any; text: string }> {
    return new Promise((resolve, reject) => {
      let fullText = '';
      let actionResult: { action?: string; params?: any } | null = null;

      const service = AssistantEngine.geminiService;
      service.setCallbacks({
        onTextReceived: (text) => {
          fullText += text;
          const parsed = this.parseJSON(text);
          if (parsed && parsed.action) {
            actionResult = parsed;
          }
        },
        onTurnComplete: () => {
          if (actionResult) {
            resolve(actionResult);
          } else {
            resolve({ text: fullText.trim() });
          }
        },
      });

      if (!service.getSessionState().connected) {
        service.connect().then(() => {
          service.sendText(userPrompt);
        }).catch(reject);
      } else {
        service.sendText(userPrompt);
      }

      setTimeout(() => {
        if (actionResult) {
          resolve(actionResult);
        } else if (fullText.trim()) {
          resolve({ text: fullText.trim() });
        } else {
          reject(new Error('Gemini response timeout'));
        }
      }, 15000);
    });
  }

  static parseJSON(text: string): { action: string; params?: any } | null {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }

  private static extractAndSaveLearnings(question: string, answer: string): void {
    const factPatterns = [
      /i am ([a-z0-9\s\-]+)/i,
      /my name is ([a-z0-9\s\-]+)/i,
      /i (?:like|love|prefer|hate) ([a-z0-9\s\-]+)/i,
      /i (?:live|work) in ([a-z0-9\s\-]+)/i,
    ];

    const combinedText = `${question} ${answer}`;

    factPatterns.forEach((pattern) => {
      const match = combinedText.match(pattern);
      if (match) {
        MemoryEngine.saveFact('user_preference', match[0]);
      }
    });

    const keywords = answer
      .split(' ')
      .filter((w) => w.length > 4)
      .slice(0, 3);
    MemoryEngine.saveLearnedQA(question, answer.substring(0, 150), keywords);
  }

  static async webSearch(query: string): Promise<string> {
    try {
      const url = DUCKDUCKGO_API.replace('{query}', encodeURIComponent(query));
      const res = await fetch(url);
      const data = await res.json();

      if (data.AbstractText) return data.AbstractText;
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        return data.RelatedTopics[0].Text;
      }
      return `I searched for "${query}" but didn't find a direct summary.`;
    } catch {
      return 'Web search failed. Please check your connection.';
    }
  }

  static async composioExecute(tool: string, params: Record<string, any>): Promise<string> {
    try {
      await ComposioService.initialize();
      // @ts-ignore - dynamic import for @openai/agents
      const agentsModule = await import('@openai/agents');
      const Agent = agentsModule.Agent;
      const run = agentsModule.run;
      const tools = await ComposioService.getTools();
      const agent = new Agent({
        name: 'Composio Executor',
        model: 'gpt-4.1',
        instructions: 'You are a tool executor. Use the provided Composio tools to complete tasks.',
        tools,
      });
      const task = `Execute the "${tool}" action with parameters: ${JSON.stringify(params)}`;
      const result = await run(agent, task);
      if (result.finalOutput) {
        return String(result.finalOutput);
      }
      return 'Composio task completed with no output.';
    } catch (error) {
      return `Composio execution failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}