import { MAX_VISIBLE, DEFAULT_DURATION } from '../constants';
import type {
  SignalListener,
  SignalOptions,
  SignalPromiseMessages,
} from '../types';

class SignalStore {
  private listener: SignalListener | null = null;
  private signals: SignalOptions[] = [];
  private maxVisible: number = MAX_VISIBLE;
  private defaultDuration: number = DEFAULT_DURATION;

  configure(options: { maxVisible?: number; defaultDuration?: number }) {
    if (options.maxVisible !== undefined) this.maxVisible = options.maxVisible;
    if (options.defaultDuration !== undefined)
      this.defaultDuration = options.defaultDuration;
  }

  getMaxVisible() {
    return this.maxVisible;
  }

  setListener(listener: SignalListener) {
    this.listener = listener;
  }

  removeListener() {
    this.listener = null;
  }

  show(options: SignalOptions): string {
    const now = Date.now();
    const id =
      options.id ?? `signal_${now}_${Math.random().toString(36).slice(2, 7)}`;

    if (this.signals.some((s) => s.id === id)) return id;

    const isLoading = options.type === 'loading';

    const signal: SignalOptions = {
      type: 'info',
      position: 'top',
      swipeToDismiss: !isLoading, // loading toasts shouldn't be accidentally swiped away
      autoHide: !isLoading, // loading toasts stay until manually dismissed
      duration: this.defaultDuration,
      ...options,
      id,
      createdAt: now,
    };

    this.signals.unshift(signal);
    this.emit();
    return id;
  }

  /** Remove a toast by id */
  hide(id: string) {
    const len = this.signals.length;
    this.signals = this.signals.filter((s) => s.id !== id);
    if (this.signals.length !== len) this.emit();
  }

  /** Alias for hide() */
  dismiss(id: string) {
    this.hide(id);
  }

  /** Update any fields of an existing toast in-place */
  update(
    id: string,
    options: Partial<Omit<SignalOptions, 'id' | 'createdAt'>>
  ) {
    const idx = this.signals.findIndex((s) => s.id === id);
    if (idx === -1) return;
    this.signals[idx] = { ...this.signals[idx]!, ...options };
    this.emit();
  }

  /** Remove all toasts */
  clear() {
    if (this.signals.length === 0) return;
    this.signals = [];
    this.emit();
  }

  // ─── Convenience shorthands ───────────────────────────────────────────────

  success(description: string, options?: Partial<SignalOptions>) {
    return this.show({ ...options, description, type: 'success' });
  }

  error(description: string, options?: Partial<SignalOptions>) {
    return this.show({ ...options, description, type: 'error' });
  }

  warning(description: string, options?: Partial<SignalOptions>) {
    return this.show({ ...options, description, type: 'warning' });
  }

  info(description: string, options?: Partial<SignalOptions>) {
    return this.show({ ...options, description, type: 'info' });
  }

  /**
   * Show an infinite loading toast.
   * Returns the id — call Signal.dismiss(id) when the operation completes.
   */
  loading(description: string, options?: Partial<SignalOptions>) {
    return this.show({ ...options, description, type: 'loading' });
  }

  /**
   * Attach a Promise to a toast lifecycle.
   * Automatically transitions loading → success or error.
   *
   * @example
   * Signal.promise(uploadFile(), {
   *   loading: 'Uploading…',
   *   success: (data) => `Uploaded ${data.name}!`,
   *   error:   (err)  => err.message ?? 'Upload failed',
   * });
   */
  promise<T = unknown>(
    promise: Promise<T>,
    messages: SignalPromiseMessages<T>,
    options?: Partial<
      Omit<SignalOptions, 'type' | 'autoHide' | 'swipeToDismiss'>
    >
  ): Promise<T> {
    const id = this.loading(messages.loading, { ...options });

    promise
      .then((data) => {
        const description =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
        this.update(id, {
          type: 'success',
          description,
          autoHide: true,
          swipeToDismiss: true,

          duration: options?.duration ?? this.defaultDuration,
        });
      })
      .catch((err: unknown) => {
        const description =
          typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error;
        this.update(id, {
          type: 'error',
          description,
          autoHide: true,
          swipeToDismiss: true,

          duration: options?.duration ?? this.defaultDuration,
        });
      });

    return promise;
  }

  private emit() {
    this.listener?.([...this.signals]);
  }
}

export const Signal = new SignalStore();
