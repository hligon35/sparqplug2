import { useEffect, useRef } from 'react';
import { useDebug } from './useDebug';
import { debugLog } from '../debug/debugStore';

// useRenderTrace(): lightweight render tracing with basic slow/re-render warnings.
export function useRenderTrace(name: string) {
  const debug = useDebug();
  const renderCount = useRef(0);
  const lastRenderAt = useRef<number | null>(null);

  renderCount.current += 1;

  if (debug?.enabled && debug.toggles.traceRenders) {
    const now = Date.now();
    const delta = lastRenderAt.current ? now - lastRenderAt.current : null;
    lastRenderAt.current = now;

    debugLog('log', 'render', `${name} render #${renderCount.current}`, { deltaMs: delta });

    if (renderCount.current >= 10 && delta !== null && delta < 200) {
      debugLog('warn', 'render', `${name} is re-rendering frequently`, {
        renderCount: renderCount.current,
        lastDeltaMs: delta
      });
    }
  }

  useEffect(() => {
    return () => {
      if (debug?.enabled && debug.toggles.traceRenders) {
        debugLog('log', 'render', `${name} unmounted`, { renders: renderCount.current });
      }
    };
  }, [debug?.enabled, debug?.toggles.traceRenders, name]);
}
