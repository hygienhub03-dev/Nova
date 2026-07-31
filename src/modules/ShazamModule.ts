import { NativeModules, Platform } from 'react-native';

const { ShazamModule } = NativeModules;

export interface ShazamResult {
  success: boolean;
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
  genre?: string;
  releaseDate?: string;
  shazamUrl?: string;
  error?: string;
}

export async function recognizeSong(audioPath: string): Promise<ShazamResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Shazam recognition is only available on Android' };
  }
  if (!audioPath) {
    return { success: false, error: 'No audio file path provided' };
  }
  try {
    const result = await ShazamModule.recognizeSong(audioPath);
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return parsed;
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
}