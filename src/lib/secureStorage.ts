import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 1800;
const META_SUFFIX = '__meta';

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;
    try {
      const rawMeta = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`);
      if (!rawMeta) return SecureStore.getItemAsync(key);
      const chunkCount = Number(rawMeta);
      if (!Number.isInteger(chunkCount) || chunkCount < 1) return null;
      const chunks = await Promise.all(Array.from({ length: chunkCount }, (_, index) => SecureStore.getItemAsync(`${key}__${index}`)));
      return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join('') : null;
    } catch { return null; }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { getWebStorage()?.setItem(key, value); return; }
    await removeNativeValue(key);
    const chunks = splitValue(value);
    try {
      if (chunks.length === 1) { await SecureStore.setItemAsync(key, value); return; }
      await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}__${index}`, chunk)));
      await SecureStore.setItemAsync(`${key}${META_SUFFIX}`, String(chunks.length));
    } catch (error) {
      await Promise.all(chunks.map((_, index) => SecureStore.deleteItemAsync(`${key}__${index}`).catch(() => undefined)));
      await removeNativeValue(key);
      throw new Error('Secure session storage is unavailable or full.', { cause: error });
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { getWebStorage()?.removeItem(key); return; }
    await removeNativeValue(key);
  },
};

async function removeNativeValue(key: string) {
  const rawMeta = await SecureStore.getItemAsync(`${key}${META_SUFFIX}`).catch(() => null);
  const chunkCount = Number(rawMeta);
  if (Number.isInteger(chunkCount) && chunkCount > 0) {
    await Promise.all(Array.from({ length: chunkCount }, (_, index) => SecureStore.deleteItemAsync(`${key}__${index}`).catch(() => undefined)));
  }
  await Promise.all([SecureStore.deleteItemAsync(key).catch(() => undefined), SecureStore.deleteItemAsync(`${key}${META_SUFFIX}`).catch(() => undefined)]);
}

function splitValue(value: string) { const chunks: string[] = []; for (let index = 0; index < value.length; index += CHUNK_SIZE) chunks.push(value.slice(index, index + CHUNK_SIZE)); return chunks.length ? chunks : ['']; }
function getWebStorage() { try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; } }
