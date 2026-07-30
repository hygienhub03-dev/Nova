# Nova - AI Companion Android App

A personalized AI assistant for Android that combines on-device LLM inference with cloud-based AI responses using a Recursive Learning architecture.

## Features

- **Dual AI Modes** - Cloud (OpenRouter/GPT-4o-mini) and Offline (Qwen 2.5 0.5B)
- **Recursive Learning** - Local SQLite memory that gets smarter over time
- **Voice Commands** - Speech-to-text input with animated orb feedback
- **Device Control** - Brightness, volume, flashlight, settings via Android Intents
- **Text-to-Speech** - Nova speaks responses aloud
- **Offline Caching** - Cached AI responses for offline use
- **3GB RAM Optimized** - Built for low-end devices like Redmi A3x

## Project Structure

```
nova-android/
├── App.tsx                    # Entry point with navigation
├── app.json                   # Expo config & Android permissions
├── babel.config.js            # Babel config with dotenv
├── metro.config.js            # Metro bundler config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── .env                       # API keys (create from .env.example)
└── src/
    ├── components/
    │   ├── Orb.tsx            # Animated AI presence orb
    │   ├── MessageBubble.tsx  # Chat message renderer
    │   └── VoiceButton.tsx    # Microphone with pulse animation
    ├── navigation/
    │   └── RootNavigator.tsx  # Stack navigation setup
    ├── screens/
    │   ├── HomeScreen.tsx     # Main chat interface
    │   ├── MemoryManagerScreen.tsx  # AI memory viewer
    │   └── SettingsScreen.tsx    # App configuration
    └── services/
        ├── AssistantEngine.ts # AI query processing & learning
        ├── MemoryEngine.ts    # SQLite local memory database
        └── DeviceController.ts  # Android device intents
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
- **expo-orb** - Animated AI presence orb (Jetpack Compose on Android)
- **expo-speech** - Text-to-speech
- **@react-native-voice/voice** - Speech recognition
- **react-native-markdown-display** - Rich AI message rendering
- **expo-sqlite** - Lightweight local memory database
- **OpenRouter** - Cloud AI API gateway

## 3GB RAM Device Notes

For low-end devices like Redmi A3x:

1. Turn OFF Memory Extension in device settings
2. Use Qwen 2.5 0.5B Q4_K_M quantized model
3. Set contextSize to 512 tokens max
4. n_threads set to 2 to prevent UI freezing
5. Heavy DB queries use InteractionManager.runAfterInteractions()
6. LLM context is unloaded during voice input to free RAM

## Configuration

Copy `.env.example` to `.env` and add your API keys:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```