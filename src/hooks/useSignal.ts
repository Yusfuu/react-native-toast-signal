import { useCallback } from 'react';
import { Signal } from '../core/store';
import type { SignalOptions, SignalPromiseMessages } from '../types';

/**
 * Hook to imperatively control Signal toasts from any component.
 *
 * @example
 * const signal = useSignal();
 *
 * // Simple
 * signal.success('Saved!');
 * signal.error('Failed', { title: 'Oops' });
 *
 * // Loading → dismiss manually
 * const id = signal.loading('Uploading…');
 * await upload();
 * signal.dismiss(id);
 * signal.success('Done!');
 *
 * // Promise shorthand (auto loading → success/error)
 * signal.promise(uploadFile(), {
 *   loading: 'Uploading…',
 *   success: (data) => `Uploaded ${data.name}!`,
 *   error:   (err)  => err.message ?? 'Upload failed',
 * });
 *
 * // With action button
 * signal.error('Payment failed', {
 *   action: { label: 'Retry', onPress: (dismiss) => { retry(); dismiss(); } },
 * });
 *
 * // Custom icon
 * signal.show({ description: 'New follower!', icon: <Avatar uri={url} size={20} /> });
 */
export const useSignal = () => {
  const show = useCallback(
    (options: SignalOptions): string => Signal.show(options),
    []
  );

  const success = useCallback(
    (description: string, options?: Partial<SignalOptions>): string =>
      Signal.success(description, options),
    []
  );

  const error = useCallback(
    (description: string, options?: Partial<SignalOptions>): string =>
      Signal.error(description, options),
    []
  );

  const warning = useCallback(
    (description: string, options?: Partial<SignalOptions>): string =>
      Signal.warning(description, options),
    []
  );

  const info = useCallback(
    (description: string, options?: Partial<SignalOptions>): string =>
      Signal.info(description, options),
    []
  );

  /** Show an infinite loading toast. Returns id — call dismiss(id) when done. */
  const loading = useCallback(
    (description: string, options?: Partial<SignalOptions>): string =>
      Signal.loading(description, options),
    []
  );

  /**
   * Attach a Promise to a toast lifecycle.
   * Automatically transitions loading → success or error when the promise settles.
   */
  const promise = useCallback(
    <T = unknown>(
      p: Promise<T>,
      messages: SignalPromiseMessages<T>,
      options?: Partial<
        Omit<SignalOptions, 'type' | 'autoHide' | 'swipeToDismiss'>
      >
    ): Promise<T> => Signal.promise(p, messages, options),
    []
  );

  const hide = useCallback((id: string): void => Signal.hide(id), []);

  /** Alias for hide() */
  const dismiss = useCallback((id: string): void => Signal.dismiss(id), []);

  const update = useCallback(
    (
      id: string,
      options: Partial<Omit<SignalOptions, 'id' | 'createdAt'>>
    ): void => Signal.update(id, options),
    []
  );

  const clear = useCallback((): void => Signal.clear(), []);

  return {
    show,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    hide,
    dismiss,
    update,
    clear,
  };
};
