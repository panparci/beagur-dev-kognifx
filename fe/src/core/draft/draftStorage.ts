const STORAGE_PREFIX = 'bea-draft';

export function draftStorageKey(userId: string | undefined, formKey: string): string {
  return `${STORAGE_PREFIX}:${userId ?? 'anon'}:${formKey}`;
}

export type StoredDraft<T> = {
  data: T;
  dirty: boolean;
  updatedAt: number;
};

export function readDraft<T>(key: string): StoredDraft<T> | null {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft<T>;
  } catch {
    return null;
  }
}

export function writeDraft<T>(key: string, data: T): void {
  try {
    const payload: StoredDraft<T> = { data, dirty: true, updatedAt: Date.now() };
    const serialized = JSON.stringify(payload);
    localStorage.setItem(key, serialized);
    sessionStorage.setItem(key, serialized);
  } catch {
    /* quota exceeded — in-memory draft still works for this session */
  }
}

export function hasDirtyDraft(key: string): boolean {
  return readDraft(key)?.dirty === true;
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function clearAllDraftsForUser(userId: string): void {
  const prefix = `${STORAGE_PREFIX}:${userId}:`;
  const removeKey = (storage: Storage) => {
    for (let i = storage.length - 1; i >= 0; i -= 1) {
      const key = storage.key(i);
      if (key?.startsWith(prefix)) {
        storage.removeItem(key);
      }
    }
  };
  try {
    removeKey(localStorage);
    removeKey(sessionStorage);
  } catch {
    /* ignore */
  }
}
