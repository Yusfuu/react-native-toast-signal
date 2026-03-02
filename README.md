# react-native-signal

A lightweight, fully-animated, accessible toast/notification library for React Native built on **Reanimated v4**, **Gesture Handler**, and **Safe Area Context**.

---

## Features

- 🎨 **4 built-in types** — `success`, `error`, `warning`, `info` with per-type theming
- 📚 **Stack support** — multiple toasts stack and scale elegantly
- 👆 **Swipe to dismiss** — horizontal pan gesture with spring physics
- 🔛 **Top & bottom** — independent stacks per position
- ♿ **Accessible** — `accessibilityRole="alert"`, live regions, `announceForAccessibility`
- ⏱ **Auto-dismiss** — configurable per-toast or globally
- 🎛 **Imperative API** — `Signal.show()` / `Signal.success()` callable outside React
- 🔁 **Update in place** — mutate a toast's message/type after showing it
- 🪝 **Hook API** — `useSignal()` for in-component usage

---

## Installation

```sh
npm install react-native-signal
# or
yarn add react-native-signal
```

### Peer dependencies

```sh
npm install react-native-reanimated react-native-gesture-handler react-native-safe-area-context
```

Follow the setup guides for each peer dependency:

- [Reanimated v4](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)
- [Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context#getting-started)

---

## Quick start

### 1. Wrap your app

```tsx
// App.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SignalProvider } from 'react-native-signal';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SignalProvider>
          <YourApp />
        </SignalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 2. Show a toast

#### Hook (inside components)

```tsx
import { useSignal } from 'react-native-signal';

function ProfileScreen() {
  const { success, error } = useSignal();

  const save = async () => {
    try {
      await api.saveProfile();
      success('Profile saved!');
    } catch {
      error('Save failed', { title: 'Oops' });
    }
  };

  return <Button onPress={save} title="Save" />;
}
```

#### Imperative (outside components — API calls, global error handlers, etc.)

```ts
import { Signal } from 'react-native-signal';

// In an Axios interceptor, Redux middleware, etc.
Signal.error('Session expired. Please log in again.', {
  title: 'Auth error',
  duration: 5000,
  position: 'bottom',
});
```

---

## API

### `<SignalProvider />`

Wrap your root component. Must be a descendant of `SafeAreaProvider` and `GestureHandlerRootView`.

| Prop              | Type                   | Default | Description                                   |
| ----------------- | ---------------------- | ------- | --------------------------------------------- |
| `maxVisible`      | `number`               | `3`     | Max number of toasts shown simultaneously     |
| `defaultDuration` | `number`               | `3000`  | Default auto-dismiss time in ms               |
| `theme`           | `Partial<SignalTheme>` | —       | Override colors per signal type (see Theming) |

---

### `useSignal()`

Returns an object with the following methods. All `show*` methods return the toast `id` (string).

```ts
const { show, success, error, warning, info, hide, update, clear } =
  useSignal();
```

| Method                       | Description                                |
| ---------------------------- | ------------------------------------------ |
| `show(options)`              | Show a toast with full options             |
| `success(message, options?)` | Show a success toast                       |
| `error(message, options?)`   | Show an error toast                        |
| `warning(message, options?)` | Show a warning toast                       |
| `info(message, options?)`    | Show an info toast                         |
| `hide(id)`                   | Dismiss a specific toast by id             |
| `update(id, options)`        | Update a visible toast's message/type/etc. |
| `clear()`                    | Dismiss all toasts immediately             |

---

### `Signal` (imperative singleton)

Same methods as the hook but callable anywhere:

```ts
import { Signal } from 'react-native-signal';

const id = Signal.show({ message: 'Loading…', autoHide: false });
await doWork();
Signal.update(id, { message: 'Done!', type: 'success' });
Signal.hide(id);
```

---

### `SignalOptions`

| Property    | Type                                          | Default        | Description                            |
| ----------- | --------------------------------------------- | -------------- | -------------------------------------- |
| `message`   | `string`                                      | **required**   | Main toast text                        |
| `id`        | `string`                                      | auto-generated | Deduplication key                      |
| `title`     | `string`                                      | —              | Bold heading above message             |
| `type`      | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'`       | Visual style and icon                  |
| `position`  | `'top' \| 'bottom'`                           | `'top'`        | Which edge of the screen               |
| `duration`  | `number`                                      | `3000`         | Auto-dismiss delay in ms               |
| `autoHide`  | `boolean`                                     | `true`         | Set `false` to require manual dismiss  |
| `swipeable` | `boolean`                                     | `true`         | Allow horizontal swipe-to-dismiss      |
| `onShow`    | `() => void`                                  | —              | Called after entry animation completes |
| `onHide`    | `() => void`                                  | —              | Called after exit animation completes  |
| `onPress`   | `(dismiss: () => void) => void`               | —              | Called when toast is tapped            |

---

## Theming

Pass a `theme` prop to `<SignalProvider>` to override any colors:

```tsx
<SignalProvider
  theme={{
    success: {
      background: '#052e16',
      border: '#16a34a80',
      titleColor: '#bbf7d0',
      messageColor: '#86efac',
      iconColor: '#4ade80',
    },
    error: {
      background: '#450a0a',
      border: '#dc262680',
      titleColor: '#fecaca',
      messageColor: '#f87171',
      iconColor: '#ef4444',
    },
    // warning and info use defaults
  }}
>
```

### `SignalTypeTheme` shape

```ts
interface SignalTypeTheme {
  background: string; // toast card background
  border: string; // 1px border (use alpha, e.g. '#22c55e40')
  titleColor: string;
  messageColor: string;
  iconColor: string; // circular icon badge color
}
```

---

## Advanced examples

### Persistent toast (manual dismiss)

```ts
const id = Signal.show({
  message: 'Downloading update…',
  type: 'info',
  autoHide: false,
  swipeable: false,
});

// Later:
Signal.hide(id);
```

### Update a toast in place

```ts
const id = Signal.info('Uploading…', { autoHide: false });

await upload(file, (progress) => {
  Signal.update(id, { message: `Uploading… ${progress}%` });
});

Signal.update(id, {
  message: 'Upload complete!',
  type: 'success',
  autoHide: true,
});
```

### Action on tap

```ts
Signal.show({
  type: 'error',
  title: 'No connection',
  message: 'Tap to retry',
  autoHide: false,
  onPress: (dismiss) => {
    dismiss();
    retry();
  },
});
```

### Bottom toast

```ts
Signal.warning('Battery low', {
  position: 'bottom',
  duration: 4000,
});
```

---

## Architecture notes

```
src/
├── core/
│   └── store.ts          # Singleton SignalStore — holds visible signals
├── components/
│   └── SignalItem.tsx     # Animated toast card (Reanimated v4)
├── provider/
│   └── SignalProvider.tsx # Renders top/bottom stacks, subscribes to store
├── hooks/
│   └── useSignal.ts       # Thin React hook over the store
├── constants.ts
├── types.ts
└── index.ts
```

**Why a singleton store instead of Context?**  
Context re-renders every subscriber on every signal change. The singleton emits to a single `useState` setter in `SignalProvider`, keeping the render tree minimal and enabling the imperative `Signal.*` API to work without a hook.

---

## Troubleshooting

| Symptom                                 | Fix                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Toasts appear behind modals             | Ensure `SignalProvider` is inside `GestureHandlerRootView` but its children include your navigation stack |
| Swipe gesture conflicts with navigation | Wrap the gesture with `Gesture.Simultaneous()` or adjust `activeOffsetX` on the pan                       |
| Toast clips behind status bar           | Make sure `SafeAreaProvider` is an ancestor of `SignalProvider`                                           |
| Animation stutters on Android           | Ensure Reanimated's Babel plugin is in your `babel.config.js`                                             |

---

## License

MIT
