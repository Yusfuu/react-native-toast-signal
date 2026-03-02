import type { ReactNode } from 'react';

export type SignalType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'loading'
  | 'custom';

export type SignalPosition = 'top' | 'bottom';

export interface SignalAction {
  /** Button label */
  label: string;
  /** Called when tapped. Receives a dismiss callback so you control whether to close. */
  onPress: (dismiss: () => void) => void;
}

export interface SignalOptions {
  /** Unique ID — auto-generated if omitted */
  id?: string;
  /** Optional bold headline above the description */
  title?: string;
  /** Main body text (required) */
  description: string;
  /** Duration in ms before auto-dismiss. Default: 3000. Loading defaults to 0 (infinite). */
  duration?: number;
  type?: SignalType;
  /** Default: 'top' */
  position?: SignalPosition;
  /** Set automatically */
  createdAt?: number;
  /** Allow swipe-to-dismiss. Default: true */
  swipeToDismiss?: boolean;
  /** Auto-dismiss after duration. Default: true. Loading defaults to false. */
  autoHide?: boolean;
  /** Called once entry animation finishes */
  onShow?: () => void;
  /** Called after toast fully exits */
  onHide?: () => void;
  /** Called when the toast body is tapped. Receives a dismiss callback. */
  onPress?: (dismiss: () => void) => void;
  /**
   * Optional CTA button rendered below the description.
   * @example action={{ label: 'Retry', onPress: (dismiss) => { retry(); dismiss(); } }}
   */
  action?: SignalAction;
  /**
   * Replace the default type icon with any ReactNode.
   * @example icon={<MyIcon size={16} />}
   */
  icon?: ReactNode;
}

export interface SignalItemProps {
  signal: SignalOptions;
  onHide: () => void;
  index: number;
  maxVisible: number;
}

export interface SignalProviderProps {
  children: React.ReactNode;
  /** Maximum toasts visible at once. Default: 3 */
  maxVisible?: number;
  /** Default auto-dismiss duration in ms. Default: 3000 */
  defaultDuration?: number;
}

export type SignalListener = (signals: SignalOptions[]) => void;

export interface SignalTypeTheme {
  background: string;
  border: string;
  titleColor: string;
  descriptionColor: string;
  iconColor: string;
}

/** Full theme map — all six types */
export type SignalTheme = Record<SignalType, SignalTypeTheme>;

export interface SignalPromiseMessages<T = unknown> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((err: unknown) => string);
}
