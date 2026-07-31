import { Composio } from "@composio/core";
// @ts-ignore - types may not be available for @composio/openai-agents
import { OpenAIAgentsProvider } from "@composio/openai-agents";

const COMPOSIO_API_KEY =
  process.env.COMPOSIO_API_KEY ||
  "";

const USER_ID = "nova_android_user";

let _composio: Composio | null = null;
let _session: any = null;
let _tools: any[] | null = null;

export class ComposioService {
  static async initialize(): Promise<void> {
    if (_composio) return;

    _composio = new Composio({
      apiKey: COMPOSIO_API_KEY,
      provider: new OpenAIAgentsProvider(),
    });

    _session = await _composio.create(USER_ID);
    _tools = await _session.tools();
  }

  static async getTools(): Promise<any[]> {
    if (!_tools) {
      await ComposioService.initialize();
    }
    return _tools || [];
  }

  static async getComposio(): Promise<Composio> {
    if (!_composio) {
      await ComposioService.initialize();
    }
    return _composio!;
  }

  static async getSession(): Promise<any> {
    if (!_session) {
      await ComposioService.initialize();
    }
    return _session;
  }

  static async runAgentTask(agent: any, task: string): Promise<any> {
    await ComposioService.initialize();
    // @ts-ignore - dynamic import for @openai/agents
    const agentsModule = await import("@openai/agents");
    const run = agentsModule.run;
    const result = await run(agent, task);
    return result;
  }

  static isInitialized(): boolean {
    return _composio !== null && _session !== null;
  }
}