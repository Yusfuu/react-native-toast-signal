import type { SignalTheme } from './types';

export const MAX_VISIBLE = 3;
export const DEFAULT_DURATION = 3000;
export const STACK_OFFSET = 14;
export const SCALE_STEP = 0.05;
export const ENTRY_OFFSET_Y = 80;
export const SWIPE_THRESHOLD = 100;
export const TIMING_MS = 280;

export const DEFAULT_THEME: SignalTheme = {
  success: {
    background: '#0a0a0a',
    border: '#22c55e40',
    titleColor: '#ffffff',
    descriptionColor: '#d1fae5',
    iconColor: '#22c55e',
  },
  error: {
    background: '#0a0a0a',
    border: '#ef444440',
    titleColor: '#ffffff',
    descriptionColor: '#fee2e2',
    iconColor: '#ef4444',
  },
  warning: {
    background: '#0a0a0a',
    border: '#f59e0b40',
    titleColor: '#ffffff',
    descriptionColor: '#fef3c7',
    iconColor: '#f59e0b',
  },
  info: {
    background: '#0a0a0a',
    border: '#ffffff26',
    titleColor: '#ffffff',
    descriptionColor: '#ffffffcc',
    iconColor: '#60a5fa',
  },
  loading: {
    background: '#0a0a0a',
    border: '#a78bfa40',
    titleColor: '#ffffff',
    descriptionColor: '#ede9fe',
    iconColor: '#a78bfa',
  },
  custom: {
    background: '#0a0a0a',
    border: '#ffffff26',
    titleColor: '#ffffff',
    descriptionColor: '#ffffffcc',
    iconColor: '#ffffff',
  },
};

/** Unicode icons for non-loading, non-custom types */
export const TYPE_ICONS: Partial<Record<string, string>> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};
