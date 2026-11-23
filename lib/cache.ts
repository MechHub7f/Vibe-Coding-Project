type Entry = {
  expiresAt: number;
  value: unknown;
};

const store = new Map<string, Entry>();

/**
 * Tiny in-process cache with a TTL. Keeps us from re-hitting a source on every
 * request. This is a cache, not storage: entries expire and are replaced.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }

  const value = await load();
  store.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}
