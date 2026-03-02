import { Signal } from '../core/store';
import { MAX_VISIBLE } from '../constants';

// Reset store state between tests
beforeEach(() => {
  Signal.clear();
  Signal.removeListener();
});

describe('Signal.show', () => {
  it('returns a string id', () => {
    const id = Signal.show({ description: 'Hello' });
    expect(typeof id).toBe('string');
  });

  it('does not add duplicate ids', () => {
    const ids: string[] = [];
    Signal.setListener((s) => ids.push(...s.map((x) => x.id!)));
    Signal.show({ id: 'dup', description: 'First' });
    Signal.show({ id: 'dup', description: 'Second' });
    // Listener fires once per show, but second call is a no-op
    const unique = [...new Set(ids)];
    expect(unique).toHaveLength(1);
  });

  it('sets sensible defaults', () => {
    let captured: Parameters<import('../types').SignalListener>[0] = [];
    Signal.setListener((s) => {
      captured = s;
    });
    Signal.show({ description: 'Test' });
    const s = captured[0]!;
    expect(s.type).toBe('info');
    expect(s.position).toBe('top');
    expect(s.autoHide).toBe(true);
    expect(s.swipeToDismiss).toBe(true);
  });
});

describe('Signal.hide', () => {
  it('removes the signal and emits', () => {
    let latest: unknown[] = [];
    Signal.setListener((s) => {
      latest = s;
    });
    const id = Signal.show({ description: 'Bye' });
    Signal.hide(id);
    expect(latest).toHaveLength(0);
  });

  it('is a no-op for unknown ids', () => {
    let callCount = 0;
    Signal.setListener(() => callCount++);
    Signal.hide('unknown-id');
    expect(callCount).toBe(0);
  });
});

describe('Signal.dismiss', () => {
  it('is an alias for hide', () => {
    let latest: unknown[] = [];
    Signal.setListener((s) => {
      latest = s;
    });
    const id = Signal.show({ description: 'Dismiss me' });
    Signal.dismiss(id);
    expect(latest).toHaveLength(0);
  });
});

describe('Signal.update', () => {
  it('updates fields in-place and emits', () => {
    let latest: Parameters<import('../types').SignalListener>[0] = [];
    Signal.setListener((s) => {
      latest = s;
    });
    const id = Signal.show({ description: 'Original' });
    Signal.update(id, { description: 'Updated', type: 'success' });
    const s = latest.find((x) => x.id === id)!;
    expect(s.description).toBe('Updated');
    expect(s.type).toBe('success');
  });

  it('is a no-op for unknown ids', () => {
    let callCount = 0;
    const id = Signal.show({ description: 'Exists' });
    Signal.setListener(() => callCount++);
    Signal.update('ghost-id', { description: 'Nope' });
    expect(callCount).toBe(0);
    Signal.hide(id);
  });
});

describe('Signal.clear', () => {
  it('removes all signals', () => {
    let latest: unknown[] = [];
    Signal.setListener((s) => {
      latest = s;
    });
    Signal.show({ description: 'A' });
    Signal.show({ description: 'B' });
    Signal.clear();
    expect(latest).toHaveLength(0);
  });

  it('does not emit when already empty', () => {
    let callCount = 0;
    Signal.setListener(() => callCount++);
    Signal.clear();
    expect(callCount).toBe(0);
  });
});

describe('convenience methods', () => {
  const types = ['success', 'error', 'warning', 'info', 'loading'] as const;

  types.forEach((type) => {
    it(`Signal.${type}() sets type = '${type}'`, () => {
      let captured: Parameters<import('../types').SignalListener>[0] = [];
      Signal.setListener((s) => {
        captured = s;
      });
      Signal[type]('test description');
      expect(captured[0]?.type).toBe(type);
      expect(captured[0]?.description).toBe('test description');
    });
  });

  it('loading sets autoHide=false and swipeToDismiss=false by default', () => {
    let captured: Parameters<import('../types').SignalListener>[0] = [];
    Signal.setListener((s) => {
      captured = s;
    });
    Signal.loading('Loading…');
    expect(captured[0]?.autoHide).toBe(false);
    expect(captured[0]?.swipeToDismiss).toBe(false);
  });
});

describe('Signal.promise', () => {
  it('shows loading then resolves to success', async () => {
    const snapshots: string[] = [];
    Signal.setListener((s) => {
      if (s[0]) snapshots.push(`${s[0].type}:${s[0].description}`);
    });

    const p = Promise.resolve({ name: 'file.png' });
    await Signal.promise(p, {
      loading: 'Uploading…',
      success: (data) => `Done: ${(data as { name: string }).name}`,
      error: 'Failed',
    });

    expect(snapshots[0]).toBe('loading:Uploading…');
    expect(snapshots[snapshots.length - 1]).toMatch(/^success:Done:/);
  });

  it('resolves to error on rejection', async () => {
    const snapshots: string[] = [];
    Signal.setListener((s) => {
      if (s[0]) snapshots.push(`${s[0].type}`);
    });

    const p = Promise.reject(new Error('oops'));
    try {
      await Signal.promise(p, {
        loading: 'Loading…',
        success: 'Done',
        error: 'Failed',
      });
    } catch {
      // expected
    }

    // Give microtask queue time to settle
    await Promise.resolve();
    expect(snapshots).toContain('error');
  });

  it('returns the original promise', () => {
    const original = Promise.resolve(42);
    const returned = Signal.promise(original, {
      loading: '…',
      success: 'ok',
      error: 'err',
    });
    expect(returned).toBe(original);
  });
});

describe('Signal.configure', () => {
  it('overrides maxVisible', () => {
    Signal.configure({ maxVisible: 5 });
    expect(Signal.getMaxVisible()).toBe(5);
    Signal.configure({ maxVisible: MAX_VISIBLE }); // restore
  });
});
