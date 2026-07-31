# Nova - AI Companion Android App

A personalized AI assistant for Android that combines on-device LLM inference with cloud-based AI responses using a Recursive Learning architecture, plus **PC remote control via Tailscale**.

## Features

- **Dual AI Modes** - Cloud (OpenRouter/GPT-4o-mini) and Offline (Qwen 2.5 0.5B)
- **Recursive Learning** - Local SQLite memory that gets smarter over time
- **Voice Commands** - Speech-to-text input with animated orb feedback
- **Device Control** - Brightness, volume, flashlight, settings via Android Intents
- **Text-to-Speech** - Nova speaks responses aloud
- **Offline Caching** - Cached AI responses for offline use
- **3GB RAM Optimized** - Built for low-end devices like Redmi A3x

## PC Remote Control

Control your PC from your phone via Tailscale mesh VPN:

- **QR Code Connection** - Scan QR code to establish Tailscale connection
- **Peer Discovery** - Automatically finds Tailscale-connected PCs
- **Mouse & Keyboard** - Full remote input control (move, click, scroll, type)
- **Screenshot Streaming** - View PC screen on your phone
- **System Commands** - Shutdown, restart, lock, sleep your PC

## Project Structure

```
nova-android/
├── App.tsx                    # Entry point with navigation
├── app.json                   # Expo config & Android permissions
├── babel.config.js            # Babel config with dotenv
├── metro.config.js            # Metro bundler config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── .env / .env.example        # API keys (create from .env.example)
├── pc-server/                 # PC-side remote control server
│   ├── PCController.py        # Python HTTP server for commands
│   ├── PCController.bat       # Windows launcher with Tailscale setup
│   ├── start_server.bat       # Quick start script
│   └── requirements.txt       # Python dependencies (Pillow)
└── src/
    ├── components/
    │   ├── Orb.tsx            # Animated AI presence orb
    │   ├── MessageBubble.tsx  # Chat message renderer
    │   ├── VoiceButton.tsx    # Microphone with pulse animation
    │   └── QrCodeGenerator.tsx # QR code for PC connection
    ├── context/
    │   └── TailscaleContext.tsx # Tailscale state management
    ├── navigation/
    │   └── RootNavigator.tsx  # Stack navigation setup
    ├── screens/
    │   ├── HomeScreen.tsx     # Main chat interface
    │   ├── MemoryManagerScreen.tsx  # AI memory viewer
    │   ├── SettingsScreen.tsx    # App configuration
    │   └── RemoteControlScreen.tsx  # PC remote control UI
    └── services/
        ├── AssistantEngine.ts # AI query processing & learning
        ├── MemoryEngine.ts    # SQLite local memory database
        ├── DeviceController.ts  # Android device intents
        ├── TailscaleService.ts  # Tailscale peer discovery & connection
        └── RemoteControlService.ts  # PC remote command communication
```

## Setup

```bash
# Install dependencies
npm install

# Install EAS CLI for building
npm install -g eas-cli

# Prebuild native project
npx expo prebuild

# Run on Android
npx expo run:android
```

## Key Dependencies

- **Expo** - Cross-platform app framework
- **React Navigation** - Screen navigation
- **React Native Reanimated** - 60fps animations
- **react-native-qrcode-svg** - QR code generation for PC connection
- **react-native-paper** - UI component library
- **ws** - WebSocket client for Gemini Live API
- **expo-orb** - Animated AI presence orb (Jetpack Compose on Android)
- **expo-speech** - Text-to-speech
- **@react-native-voice/voice** - Speech recognition
- **react-native-markdown-display** - Rich AI message rendering
- **expo-sqlite** - Lightweight local memory database
- **Gemini Live API** - Google's real-time AI with native audio support, voice interruption, and proactive audio

## 3GB RAM Device Notes

For low-end devices like Redmi A3x:

1. Turn OFF Memory Extension in device settings
2. Use Qwen 2.5 0.5B Q4_K_M quantized model
3. Set contextSize to 512 tokens max
4. n_threads set to 2 to prevent UI freezing
5. Heavy DB queries use InteractionManager.runAfterInteractions()
6. LLM context is unloaded during voice input to free RAM

## Configuration

### API Keys (Expo EAS Secrets)

Nova uses **EAS secrets** for production builds and `.env` for development:

```bash
# 1. Copy .env.example and add your keys
cp .env.example .env
# Add GEMINI_API_KEY and TAILSCALE_ENABLED=ture

# 2. For production builds, store secrets via EAS
eas secret:create GEMINI_API_KEY --target android
eas secret:create GEMINI_MODEL --target android

# 3. Add them to app.json extra field for build-time injection
```

### How API keys work in Nova

- **Development**: Keys are read from `.env` via `@env`
- **Production (EAS Build)**: Keys are injected via `app.json` `extra` field and accessed at runtime through `Constants.expoConfig?.extra`
- **Runtime storage**: Sensitive keys are stored encrypted via `expo-secure-store`

### Gemini Live API

Nova uses Google's **Gemini Live API** for real-time AI communication:
- Bidirectional WebSocket streaming
- Native audio (input: PCM 16-bit 16kHz, output: PCM 16-bit 24kHz)
- Voice interruption (AI stops when you speak)
- Proactive audio (AI can initiate conversation)

Get a Gemini API key at https://aistudio.google.com/

Nova uses Google's **Gemini Live API** for real-time AI communication via WebSockets. Key features:

- **Native Audio** — Input PCM 16-bit 16kHz, Output PCM 16-bit 24kHz
- **Voice Interruption** — AI stops speaking when you start talking (bidirectional stream)
- **Proactive Audio** — AI can initiate conversation without a direct user prompt
- **On-Device Context** — Gemini model leverages on-device data through Tailscale connection

### PC Server Setup with Gemini

1. Get a Gemini API key from https://aistudio.google.com/
2. Add `GEMINI_API_KEY=your-key-here` to `.env`
3. Run the PC controller: `cd pc-server && python PCController.py`
4. The PC controller bridges Tailscale connections to Gemini Live API

The PC server forwards audio streams and commands between your phone and Gemini, maintaining real-time bidirectional communication.