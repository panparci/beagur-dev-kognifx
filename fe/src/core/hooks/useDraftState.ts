import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearDraft, draftStorageKey, readDraft, writeDraft } from '../draft/draftStorage';

export function useUnsavedChangesGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);
}

export function useDraftState<T extends object>(
  formKey: string,
  userId: string | undefined,
  emptyState: T,
) {
  const storageKey = useMemo(() => draftStorageKey(userId, formKey), [userId, formKey]);
  const emptyRef = useRef(emptyState);
  emptyRef.current = emptyState;
  const isDirtyRef = useRef(false);

  const [draft, setDraftState] = useState<T>(() => {
    const stored = readDraft<T>(storageKey);
    if (stored?.dirty) {
      isDirtyRef.current = true;
      return stored.data;
    }
    return emptyState;
  });

  const [isDirty, setIsDirty] = useState(() => {
    const stored = readDraft<T>(storageKey);
    return stored?.dirty ?? false;
  });

  useEffect(() => {
    const stored = readDraft<T>(storageKey);
    if (stored?.dirty) {
      setDraftState(stored.data);
      setIsDirty(true);
      isDirtyRef.current = true;
      return;
    }
    // Jangan timpa isian in-memory yang belum sempat terserialisasi ke sessionStorage.
    if (isDirtyRef.current) return;
    setDraftState(emptyRef.current);
    setIsDirty(false);
    isDirtyRef.current = false;
  }, [storageKey]);

  const markDirty = useCallback(
    (next: T) => {
      isDirtyRef.current = true;
      setIsDirty(true);
      writeDraft(storageKey, next);
    },
    [storageKey],
  );

  const patchDraft = useCallback(
    (partial: Partial<T>) => {
      setDraftState((prev) => {
        const next = { ...prev, ...partial };
        markDirty(next);
        return next;
      });
    },
    [markDirty],
  );

  const setDraft = useCallback(
    (value: T | ((prev: T) => T)) => {
      setDraftState((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        markDirty(next);
        return next;
      });
    },
    [markDirty],
  );

  const resetFromServer = useCallback(
    (serverData: T, options?: { force?: boolean }) => {
      if (isDirtyRef.current && !options?.force) return;
      setDraftState(serverData);
      isDirtyRef.current = false;
      setIsDirty(false);
      clearDraft(storageKey);
    },
    [storageKey],
  );

  const commitSuccess = useCallback(() => {
    isDirtyRef.current = false;
    setIsDirty(false);
    clearDraft(storageKey);
  }, [storageKey]);

  const discardDraft = useCallback(
    (fallback?: T) => {
      const next = fallback ?? emptyRef.current;
      setDraftState(next);
      isDirtyRef.current = false;
      setIsDirty(false);
      clearDraft(storageKey);
    },
    [storageKey],
  );

  return useMemo(
    () => ({
      draft,
      setDraft,
      patchDraft,
      resetFromServer,
      commitSuccess,
      discardDraft,
      isDirty,
    }),
    [draft, setDraft, patchDraft, resetFromServer, commitSuccess, discardDraft, isDirty],
  );
}
