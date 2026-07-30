import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { OPENROUTER_API_KEY } from '@env';
import { MemoryEngine } from './MemoryEngine';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const SYSTEM_PROMPT = `You are a helpful Android assistant named Nova. You can control device settings, search the web, and answer questions. When the user asks to control the device or search, you MUST respond ONLY with a JSON object in this format: {"action": "action_name", "params": {"key": "value"}}

Available actions:
- "search_web": params: {"query": "string"}
- "set_brightness": params: {"value": number (0 to 1)}
- "set_volume": params: {"type": "media|ring|alarm", "value": number (0 to 1)}
- "toggle_flashlight": params: {"state": "on|off"}
- "open_settings": params: {"screen": "wifi|bluetooth|location|display|apps"}
- "speak_text": params: {"text": "string"}

If no action is needed, respond with: {"action": "reply", "content": "your text response"} Do not include markdown formatting or backticks in your JSON response.`;

export class AssistantEngine {
  private static cache = new Map<string, string>();

  static async isOffline(): Promise<boolean> {
    const state = await Network.getNetworkStateAsync();
    return !state.isConnected;
  }

  static async getCachedResponse(prompt: string): Promise<string | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${prompt}`);
      return cached;
    } catch { return null; }
  }

  static async cacheResponse(prompt: string, response: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`cache_${prompt}`, response);
    } catch {}
  }

  static async processQuery(userPrompt: string): Promise<{ action: string; data: any }> {
    const isOffline = await this.isOffline();

    if (isOffline) {
      const cached = await this.getCachedResponse(userPrompt);
      if (cached) {
        return { action: 'reply', data: { content: `[Offline Mode] ${cached}` } };
      }
      return { action: 'reply', data: { content: "I'm offline and couldn't find this in my cache." } };
    }

    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nova-assistant.app',
          'X-Title': 'Nova Android Assistant',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
        }),
      });

      const data = await response.json();
      let aiText = data.choices[0]?.message?.content || "I couldn't process that.";

      aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      await this.cacheResponse(userPrompt, aiText);
      this.extractAndSaveLearnings(userPrompt, aiText);

      const parsed = this.parseJSON(aiText);
      if (parsed && parsed.action) {
        return { action: parsed.action, data: parsed.params || parsed };
      }
      return { action: 'reply', data: { content: aiText } };

    } catch (error) {
      const cached = await this.getCachedResponse(userPrompt);
      if (cached) return { action: 'reply', data: { content: `[Network Error] ${cached}` } };
      return { action: 'reply', data: { content: "Network error and no cache available." } };
    }
  }

  static parseJSON(text: string): any {
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch { return null; }
    }
    return null;
  }

  private static extractAndSaveLearnings(question: string, answer: string) {
    const factPatterns = [
      /i am ([a-z0-9\s\-]+)/i,
      /my name is ([a-z0-9\s\-]+)/i,
      /i (?:like|love|prefer|hate) ([a-z0-9\s\-]+)/i,
      /i (?:live|work) in ([a-z0-9\s\-]+)/i
    ];

    const combinedText = `${question} ${answer}`;

    factPatterns.forEach(pattern => {
      const match = combinedText.match(pattern);
      if (match) {
        MemoryEngine.saveFact('user_preference', match[0]);
      }
    });

    const keywords = answer.split(' ').filter((w: string) => w.length > 4).slice(0, 3);
    MemoryEngine.saveLearnedQA(question, answer.substring(0, 150), keywords);
  }

  static async webSearch(query: string): Promise<string> {
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.AbstractText) return data.AbstractText;
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        return data.RelatedTopics[0].Text;
      }
      return `I searched for "${query}" but didn't find a direct summary.`;
    } catch {
      return "Web search failed. Please check your connection.";
    }
  }
}