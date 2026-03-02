import { useCallback, useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  useDerivedValue,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ENTRY_OFFSET_Y,
  SCALE_STEP,
  STACK_OFFSET,
  SWIPE_THRESHOLD,
  TIMING_MS,
  DEFAULT_THEME,
  TYPE_ICONS,
} from '../constants';
import type { SignalItemProps, SignalTheme } from '../types';
import { scheduleOnRN } from 'react-native-worklets';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);
const EASE_REORDER = Easing.out(Easing.exp);

const ENTER = { duration: TIMING_MS, easing: EASE_OUT } as const;
const EXIT = { duration: TIMING_MS, easing: EASE_IN } as const;
const SNAP = { duration: 200, easing: EASE_OUT } as const;
const ORDER = { duration: TIMING_MS, easing: EASE_REORDER } as const;

function Spinner({ color }: { color: string }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.spinnerRing, { borderTopColor: color }, spinStyle]}
    />
  );
}

interface Props extends SignalItemProps {
  theme?: Partial<SignalTheme>;
}

export const SignalItem = ({
  signal,
  onHide,
  index,
  maxVisible,
  theme,
}: Props) => {
  const insets = useSafeAreaInsets();

  const isDismissed = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHideRef = useRef(onHide);
  const signalRef = useRef(signal);

  useEffect(() => {
    onHideRef.current = onHide;
    signalRef.current = signal;
  });

  const isTop = (signal.position ?? 'top') === 'top';
  const swipeable = signal.swipeToDismiss ?? true;
  const autoHide = signal.autoHide ?? true;
  const isLoading = signal.type === 'loading';

  const stackShift = Math.min(
    index * STACK_OFFSET,
    Math.max(0, (isTop ? insets.top : insets.bottom) - 8)
  );
  const targetY = isTop ? -stackShift : stackShift;
  const entryY = isTop
    ? -(ENTRY_OFFSET_Y + Math.abs(targetY))
    : ENTRY_OFFSET_Y + Math.abs(targetY);

  const translateY = useSharedValue(entryY);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1 - index * SCALE_STEP);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(1);

  const handleOnShow = useCallback(() => {
    const s = signalRef.current;
    s.onShow?.();
    const a11y = s.title ? `${s.title}. ${s.description}` : s.description;
    AccessibilityInfo.announceForAccessibility(a11y);
  }, []);

  const handleOnHide = useCallback(() => {
    signalRef.current.onHide?.();
    onHideRef.current();
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismissRef = useRef<() => void>(() => {});

  const startTimer = useCallback(() => {
    if (!autoHide || isDismissed.current || timerRef.current) return;
    const duration = signalRef.current.duration ?? 3000;
    progress.value = withTiming(0, { duration, easing: Easing.linear });
    timerRef.current = setTimeout(() => dismissRef.current(), duration);
  }, [autoHide, progress]);

  const dismiss = useCallback(() => {
    if (isDismissed.current) return;
    isDismissed.current = true;
    clearTimer();
    cancelAnimation(translateY);
    cancelAnimation(translateX);
    cancelAnimation(scale);
    cancelAnimation(opacity);
    cancelAnimation(progress);
    translateY.value = withTiming(entryY, EXIT);
    opacity.value = withTiming(0, EXIT, () => {
      'worklet';
      scheduleOnRN(handleOnHide);
    });
  }, [
    entryY,
    clearTimer,
    handleOnHide,
    opacity,
    translateX,
    translateY,
    scale,
    progress,
  ]);

  useEffect(() => {
    dismissRef.current = dismiss;
  }, [dismiss]);

  useEffect(() => {
    opacity.value = withTiming(1, ENTER);
    translateY.value = withTiming(targetY, ENTER);
    scale.value = withTiming(1 - index * SCALE_STEP, ORDER, (finished) => {
      'worklet';
      if (finished) {
        scheduleOnRN(handleOnShow);
        scheduleOnRN(startTimer);
      }
    });
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDismissed.current) return;
    cancelAnimation(translateY);
    cancelAnimation(scale);

    if (index < maxVisible) {
      if (opacity.value === 0) opacity.value = withTiming(1, ENTER);
      translateY.value = withTiming(targetY, ORDER);
      scale.value = withTiming(1 - index * SCALE_STEP, ORDER, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(startTimer);
      });
    } else {
      // Behind the maxVisible cap — hide instantly, no ghost frames
      opacity.value = 0;
      translateY.value = targetY;
      scale.value = 1 - index * SCALE_STEP;
    }
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle in-place updates (e.g. loading → success/error) ─────────────
  const prevType = useRef(signal.type);
  useEffect(() => {
    if (isDismissed.current || signal.type === prevType.current) return;
    prevType.current = signal.type;

    // Reset timer state so the new type's duration applies cleanly
    clearTimer();
    timerRef.current = null;
    isDismissed.current = false;

    // Brief scale pulse to draw attention to the type change
    cancelAnimation(scale);
    scale.value = withTiming(
      (1 - index * SCALE_STEP) * 1.05,
      { duration: 120, easing: EASE_OUT },
      () => {
        'worklet';
        scale.value = withTiming(1 - index * SCALE_STEP, {
          duration: 200,
          easing: EASE_OUT,
        });
      }
    );

    // Reset progress bar and restart countdown
    progress.value = 1;
    scheduleOnRN(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal.type]);

  const pan = Gesture.Pan()
    .enabled(swipeable)
    .onBegin(() => {
      'worklet';
      cancelAnimation(progress);
      scheduleOnRN(clearTimer);
    })
    .onUpdate((e) => {
      'worklet';
      translateX.value = e.translationX;
      // Subtle Y resistance — nudges but stays in its lane
      const drag = e.translationY * 0.08;
      translateY.value =
        targetY + (isTop ? Math.min(0, drag) : Math.max(0, drag));
    })
    .onEnd((e) => {
      'worklet';
      const flick = Math.abs(e.velocityX) > 600;
      if (Math.abs(e.translationX) > SWIPE_THRESHOLD || flick) {
        cancelAnimation(opacity);
        opacity.value = withTiming(0, EXIT);
        translateX.value = withTiming(
          e.translationX > 0 ? 600 : -600,
          EXIT,
          () => {
            'worklet';
            scheduleOnRN(handleOnHide);
          }
        );
      } else {
        translateX.value = withTiming(0, SNAP);
        translateY.value = withTiming(targetY, SNAP);
        scheduleOnRN(startTimer);
      }
    });

  const stackOpacity = useDerivedValue(() => {
    'worklet';
    if (index >= maxVisible) return 0;
    return opacity.value * Math.max(0.6, 1 - index * 0.12);
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: stackOpacity.value,
    zIndex: 1000 - index,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as `${number}%`,
  }));

  const type = signal.type ?? 'info';
  const mergedTheme = { ...DEFAULT_THEME, ...theme };
  // Safe fallback: loading/custom always resolve; unknown type → info
  const typeTheme =
    mergedTheme[type as keyof typeof mergedTheme] ?? mergedTheme.info;
  const iconChar = TYPE_ICONS[type];

  const renderIcon = () => {
    // 1. Caller-supplied ReactNode
    if (signal.icon) {
      return <View style={styles.iconWrap}>{signal.icon}</View>;
    }
    // 2. Animated spinner for loading
    if (isLoading) {
      return (
        <View style={styles.iconWrap}>
          <Spinner color={typeTheme.iconColor} />
        </View>
      );
    }
    // 3. Unicode badge for all other types
    if (iconChar) {
      return (
        <View
          style={[
            styles.iconWrap,
            styles.iconBadge,
            { borderColor: typeTheme.iconColor },
          ]}
        >
          <Text style={[styles.iconText, { color: typeTheme.iconColor }]}>
            {iconChar}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          styles.container,
          isTop ? styles.anchorTop : styles.anchorBottom,
          animatedStyle,
        ]}
      >
        <Pressable
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
          accessibilityLabel={
            signal.title
              ? `${signal.title}. ${signal.description}`
              : signal.description
          }
          accessibilityHint={
            swipeable
              ? 'Swipe to dismiss or tap to interact'
              : 'Tap to interact'
          }
          onPress={() => signalRef.current.onPress?.(dismiss)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View
            style={[
              styles.box,
              {
                backgroundColor: typeTheme.background,
                borderColor: typeTheme.border,
              },
            ]}
          >
            {/* ── Body row ── */}
            <View style={styles.row}>
              {renderIcon()}

              <View style={styles.content}>
                {signal.title ? (
                  <Text
                    style={[styles.title, { color: typeTheme.titleColor }]}
                    numberOfLines={1}
                  >
                    {signal.title}
                  </Text>
                ) : null}
                <Text
                  style={[
                    styles.description,
                    { color: typeTheme.descriptionColor },
                  ]}
                  numberOfLines={3}
                >
                  {signal.description}
                </Text>
              </View>

              {swipeable && (
                <Pressable
                  onPress={dismiss}
                  hitSlop={12}
                  accessibilityLabel="Dismiss"
                  accessibilityRole="button"
                  style={styles.closeBtn}
                >
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* ── Action button ── */}
            {signal.action ? (
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => signal.action!.onPress(dismiss)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { borderColor: typeTheme.iconColor + '50' },
                    pressed && styles.actionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={signal.action.label}
                >
                  <Text
                    style={[styles.actionLabel, { color: typeTheme.iconColor }]}
                  >
                    {signal.action.label}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* ── Progress bar ── */}
            {autoHide ? (
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    { backgroundColor: typeTheme.iconColor },
                    progressStyle,
                  ]}
                />
              </View>
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  anchorTop: { top: 0 },
  anchorBottom: { bottom: 0 },

  box: {
    borderRadius: 16,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden', // clips progress bar to card radius
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 10 },
    }),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // Icon container (shared by badge, spinner, custom)
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Extra style for the bordered unicode badge variant
  iconBadge: {
    borderWidth: 1.5,
  },
  iconText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Spinner: 3 transparent sides + 1 colored = arc effect
  spinnerRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: 'transparent',
    // borderTopColor set via inline style
  },

  content: { flex: 1 },

  title: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },

  closeBtn: { padding: 2, flexShrink: 0 },
  closeIcon: { color: '#ffffff60', fontSize: 12, fontWeight: '700' },

  pressed: { opacity: 0.85 },

  // Action button
  actionRow: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPressed: { opacity: 0.65 },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Progress bar
  progressTrack: {
    marginTop: 10,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff14',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
    opacity: 0.6,
  },
});
