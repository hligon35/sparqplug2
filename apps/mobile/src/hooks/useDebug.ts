import { useDebugContext } from '../providers/DebugProvider';

// useDebug(): hook any component can call to access debug mode, toggles, and logs.
export function useDebug() {
  return useDebugContext();
}
