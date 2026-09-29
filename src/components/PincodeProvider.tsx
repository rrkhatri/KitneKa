'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import { normalisePincode } from '@/lib/pincode/resolve';

const STORAGE_KEY = 'kitneka:pincode';

type PincodeContextValue = {
  pincode: string;
  setPincode: (value: string) => void;
};

const PincodeContext = createContext<PincodeContextValue>({
  pincode: '',
  setPincode: () => {},
});

// ── A minimal external store over localStorage ───────────────────────────────
// Reading localStorage in an effect and mirroring it into state causes a
// cascading second render on every page load. useSyncExternalStore is the
// purpose-built primitive for exactly this: it is SSR-safe without a
// hydration mismatch, and it subscribes to cross-tab changes for free.

const listeners = new Set<() => void>();

function readPincode(): string {
  try {
    return normalisePincode(window.localStorage.getItem(STORAGE_KEY) ?? '');
  } catch {
    // Private browsing or blocked storage: the app still works, it just does
    // not remember the pincode between visits.
    return '';
  }
}

function writePincode(value: string) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  for (const listener of listeners) listener();
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  // `storage` only fires in OTHER tabs; same-tab updates are emitted directly
  // by writePincode above.
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

/** Server render and first client render both see no stored pincode. */
const getServerSnapshot = () => '';

/**
 * The pincode is a client-side preference, not an account setting: it lives in
 * localStorage and is applied to the URL by the search form, which keeps the
 * server render correct on first paint.
 */
export function PincodeProvider({ children }: { children: React.ReactNode }) {
  const pincode = useSyncExternalStore(subscribe, readPincode, getServerSnapshot);

  const setPincode = useCallback((value: string) => {
    writePincode(normalisePincode(value));
  }, []);

  const value = useMemo(() => ({ pincode, setPincode }), [pincode, setPincode]);

  return <PincodeContext.Provider value={value}>{children}</PincodeContext.Provider>;
}

export function usePincode(): PincodeContextValue {
  return useContext(PincodeContext);
}
