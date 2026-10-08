import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;

function subscribe(callback: () => void) {
  const id = setInterval(callback, 15_000);
  return () => clearInterval(id);
}

const getSnapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const getServerSnapshot = () => null;

/** Current time (ms) rounded to the minute; null during SSR so server and client markup match. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
