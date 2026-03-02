import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Signal } from '../core/store';
import { SignalItem } from '../components/signal-item';
import { MAX_VISIBLE, DEFAULT_DURATION } from '../constants';
import type { SignalOptions, SignalProviderProps, SignalTheme } from '../types';

interface Props extends SignalProviderProps {
  theme?: Partial<SignalTheme>;
}

export const SignalProvider = ({
  children,
  maxVisible = MAX_VISIBLE,
  defaultDuration = DEFAULT_DURATION,
  theme,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [signals, setSignals] = useState<SignalOptions[]>([]);

  useEffect(() => {
    Signal.configure({ maxVisible, defaultDuration });
  }, [maxVisible, defaultDuration]);

  useEffect(() => {
    Signal.setListener(setSignals);
    return () => Signal.removeListener();
  }, []);

  const handleHide = useCallback((id: string) => {
    Signal.hide(id);
  }, []);

  const topSignals = signals.filter((s) => (s.position ?? 'top') === 'top');
  const bottomSignals = signals.filter((s) => s.position === 'bottom');

  return (
    <>
      {children}

      {/* Top stack */}
      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { top: insets.top + 8 }]}
      >
        {topSignals.map((signal, idx) => (
          <SignalItem
            key={signal.id}
            signal={signal}
            index={idx}
            maxVisible={maxVisible}
            theme={theme}
            onHide={() => handleHide(signal.id!)}
          />
        ))}
      </View>

      {/* Bottom stack */}
      <View
        pointerEvents="box-none"
        style={[styles.wrapper, { bottom: insets.bottom + 8 }]}
      >
        {bottomSignals.map((signal, idx) => (
          <SignalItem
            key={signal.id}
            signal={signal}
            index={idx}
            maxVisible={maxVisible}
            theme={theme}
            onHide={() => handleHide(signal.id!)}
          />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    // height: 0 so wrapper doesn't block touches outside the toasts
    height: 0,
    zIndex: 9999,
    elevation: 9999, // Android needs elevation, not just zIndex
  },
});
