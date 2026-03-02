import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { SignalProvider, useSignal } from 'react-native-toast-signal';

function PaymentScreen() {
  const { show } = useSignal();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('1234 5678 9012 3456');

  const handlePayment = async () => {
    if (!cardNumber) {
      show({
        type: 'error',
        title: 'Invalid Card',
        description: 'Please enter a valid card number.',
      });
      return;
    }

    setLoading(true);

    show({
      type: 'loading',
      title: 'Processing Payment',
      description: 'Please wait while we confirm your transaction...',
      autoHide: true,
    });

    setTimeout(() => {
      setLoading(false);

      const success = Math.random() > 0.3;

      if (success) {
        show({
          type: 'success',
          title: 'Payment Successful',
          description: 'Your order #45821 has been confirmed.',
        });
      } else {
        show({
          type: 'error',
          title: 'Payment Failed',
          description: 'Your card was declined. Try another method.',
        });
      }
    }, 3500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Card Number</Text>
        <TextInput
          placeholder="1234 5678 9012 3456"
          value={cardNumber}
          onChangeText={setCardNumber}
          style={styles.input}
          keyboardType="numeric"
        />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>$249.00</Text>
        </View>

        <Pressable
          style={[styles.payButton, loading && styles.disabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payText}>Pay Now</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.gesture}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SignalProvider maxVisible={3}>
          <PaymentScreen />
        </SignalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gesture: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
    justifyContent: 'center',
  },

  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#0f172a', // slate-900
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  label: {
    fontSize: 14,
    color: '#64748b', // slate-500
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },

  totalLabel: {
    fontSize: 16,
    color: '#475569',
  },

  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  payButton: {
    backgroundColor: '#3b82f6', // blue-500
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  payText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  disabled: {
    opacity: 0.7,
  },
});
