import React, { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDebug } from '../../hooks/useDebug';

// DebugHotspot: hidden gesture to toggle debug mode.
// - Native gesture: 7 taps within 1200ms on an invisible top-left hotspot.
export function DebugHotspot() {
  const debug = useDebug();
  const taps = useRef<{ count: number; firstAt: number | null }>({ count: 0, firstAt: null });

  if (!debug) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityLabel="Debug toggle hotspot"
        style={styles.hotspot}
        onPress={() => {
          const now = Date.now();
          if (!taps.current.firstAt || now - taps.current.firstAt > 1200) {
            taps.current = { count: 1, firstAt: now };
            return;
          }

          taps.current.count += 1;
          if (taps.current.count >= 7) {
            taps.current = { count: 0, firstAt: null };
            debug.setEnabled(!debug.enabled);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hotspot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 44,
    height: 44,
    // Invisible but still tappable.
    opacity: 0
  }
});
