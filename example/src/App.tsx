import { Button, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SignalProvider, useSignal } from 'react-native-toast-signal';

export default function App() {
  console.log('redner ehe');

  const { show } = useSignal();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SignalProvider maxVisible={3}>
          <View style={styles.container}>
            <Button
              title="Show Toast"
              onPress={() =>
                show({
                  type: 'success',
                  title: 'Understandable have a great day',
                  description: 'It works!',
                  action: { label: 'habibi', onPress: () => {} },
                })
              }
            />
          </View>
        </SignalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
