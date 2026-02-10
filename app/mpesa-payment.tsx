import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import {
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';
import {
  createPayment,
  fetchPaymentStatus,
} from '@/lib/supabase-db';
import { initiateStkPush, formatPhoneDisplay } from '@/lib/mpesa';

const MPESA_GREEN = '#00A550';
const MPESA_DARK = '#004D25';
const MPESA_LIGHT = '#E8F5E9';
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_SECONDS = 60;

type ScreenState = 'initiating' | 'waiting' | 'completed' | 'failed' | 'timeout' | 'error';

export default function MpesaPaymentScreen() {
  const {
    orderId = '',
    paymentId = '',
    phone = '',
    amount = '0',
  } = useLocalSearchParams<{
    orderId: string;
    paymentId: string;
    phone: string;
    amount: string;
  }>();

  const router = useRouter();
  const { user } = useAuth();

  const [screenState, setScreenState] = useState<ScreenState>('initiating');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(MAX_WAIT_SECONDS);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const resultScaleAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initiated = useRef(false);

  const amountNum = parseFloat(amount);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const startPolling = useCallback(() => {
    console.log('[M-Pesa] Starting status polling for payment:', paymentId);

    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          cleanup();
          setScreenState('timeout');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: MAX_WAIT_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    pollRef.current = setInterval(async () => {
      if (!paymentId) return;
      try {
        const payment = await fetchPaymentStatus(paymentId);
        console.log('[M-Pesa] Poll result:', payment?.status);

        if (payment?.status === 'completed') {
          cleanup();
          setReceiptNumber(payment.mpesaReceiptNumber ?? '');
          setScreenState('completed');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (payment?.status === 'failed' || payment?.status === 'cancelled') {
          cleanup();
          setErrorMessage(payment.resultDesc ?? 'Payment was not completed');
          setScreenState('failed');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (err) {
        console.log('[M-Pesa] Poll error:', err);
      }
    }, POLL_INTERVAL_MS);
  }, [paymentId, orderId, cleanup, progressAnim]);

  const initiatePayment = useCallback(async () => {
    if (!user?.id || !orderId || !paymentId || !phone) {
      setErrorMessage('Missing payment information. Please go back and try again.');
      setScreenState('error');
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      return;
    }

    setScreenState('initiating');
    setSecondsLeft(MAX_WAIT_SECONDS);
    resultScaleAnim.setValue(0);
    progressAnim.setValue(0);
    fadeAnim.setValue(0);

    try {
      const created = await createPayment(user.id, {
        id: paymentId,
        orderId,
        phoneNumber: phone,
        amount: amountNum,
        paymentMethod: 'mpesa',
      });

      if (!created) {
        console.log('[M-Pesa] Payment record may already exist, continuing...');
      }

      const result = await initiateStkPush({
        phone,
        orderId,
        paymentId,
      });

      if (result.success) {
        console.log('[M-Pesa] STK Push initiated:', result.data.CheckoutRequestID);

        setScreenState('waiting');
        startPulse();
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        startPolling();
      } else {
        console.log('[M-Pesa] STK Push failed:', result.error);
        setErrorMessage(result.error);
        setScreenState('error');
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch (err: unknown) {
      console.log('[M-Pesa] Initiation error:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      setScreenState('error');
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [user, orderId, paymentId, phone, amountNum, startPulse, startPolling, resultScaleAnim, progressAnim, fadeAnim]);

  useEffect(() => {
    if (!initiated.current) {
      initiated.current = true;
      initiatePayment();
    }
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (['completed', 'failed', 'timeout', 'error'].includes(screenState)) {
      Animated.spring(resultScaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [screenState, resultScaleAnim]);

  const handleRetry = useCallback(async () => {
    cleanup();
    setErrorMessage('');
    setReceiptNumber('');
    await initiatePayment();
  }, [cleanup, initiatePayment]);

  const handleCancel = useCallback(async () => {
    cleanup();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  }, [cleanup, router]);

  const handleContinue = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({
      pathname: '/confirmation',
      params: {
        orderId,
        paymentMethod: 'mpesa',
        receiptNumber,
      },
    });
  }, [router, orderId, receiptNumber]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const formattedAmount = amountNum.toFixed(2);
  const formattedPhone = formatPhoneDisplay(phone);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          {screenState !== 'completed' && screenState !== 'initiating' ? (
            <Pressable onPress={handleCancel} style={styles.headerButton} hitSlop={12}>
              <XCircle size={22} color={Colors.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
          <View style={styles.mpesaHeaderBadge}>
            <Text style={styles.mpesaHeaderM}>M</Text>
            <Text style={styles.mpesaHeaderPesa}>-PESA</Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.content}>
          {screenState === 'initiating' && (
            <View style={styles.stateContent}>
              <View style={styles.loadingCircle}>
                <ActivityIndicator size="large" color={MPESA_GREEN} />
              </View>
              <Text style={styles.stateTitle}>Initiating Payment</Text>
              <Text style={styles.stateSubtitle}>Connecting to M-Pesa...</Text>
            </View>
          )}

          {screenState === 'waiting' && (
            <Animated.View style={[styles.stateContent, { opacity: fadeAnim }]}>
              <Animated.View
                style={[
                  styles.phoneIconWrap,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.phoneIconInner}>
                  <Smartphone size={44} color="#FFFFFF" />
                </View>
              </Animated.View>

              <Text style={styles.stateTitle}>Check Your Phone</Text>
              <Text style={styles.stateSubtitle}>
                Enter your M-Pesa PIN on your phone to complete the payment
              </Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, { color: MPESA_GREEN }]}>
                    KES {formattedAmount}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{formattedPhone}</Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order</Text>
                  <Text style={styles.detailValue}>#{orderId.slice(-6)}</Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[styles.progressFill, { width: progressWidth as unknown as number }]}
                  />
                </View>
                <View style={styles.timerRow}>
                  <Clock size={14} color={Colors.textMuted} />
                  <Text style={styles.timerText}>{secondsLeft}s remaining</Text>
                </View>
              </View>

              <Pressable onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel Payment</Text>
              </Pressable>
            </Animated.View>
          )}

          {screenState === 'completed' && (
            <View style={styles.stateContent}>
              <Animated.View
                style={[
                  styles.resultCircle,
                  styles.resultSuccess,
                  { transform: [{ scale: resultScaleAnim }] },
                ]}
              >
                <CheckCircle size={52} color="#FFFFFF" />
              </Animated.View>

              <Text style={styles.stateTitle}>Payment Successful!</Text>
              <Text style={styles.stateSubtitle}>
                Your M-Pesa payment has been confirmed
              </Text>

              <View style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount Paid</Text>
                  <Text style={[styles.detailValue, { color: MPESA_GREEN }]}>
                    KES {formattedAmount}
                  </Text>
                </View>
                {receiptNumber ? (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>M-Pesa Receipt</Text>
                      <Text style={styles.detailValueBold}>{receiptNumber}</Text>
                    </View>
                  </>
                ) : null}
              </View>

              <Pressable onPress={handleContinue} style={styles.continueBtn}>
                <Text style={styles.continueBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {(screenState === 'failed' || screenState === 'timeout' || screenState === 'error') && (
            <View style={styles.stateContent}>
              <Animated.View
                style={[
                  styles.resultCircle,
                  styles.resultFailed,
                  { transform: [{ scale: resultScaleAnim }] },
                ]}
              >
                {screenState === 'timeout' ? (
                  <Clock size={52} color="#FFFFFF" />
                ) : screenState === 'error' ? (
                  <AlertTriangle size={52} color="#FFFFFF" />
                ) : (
                  <XCircle size={52} color="#FFFFFF" />
                )}
              </Animated.View>

              <Text style={styles.stateTitle}>
                {screenState === 'timeout'
                  ? 'Payment Timed Out'
                  : screenState === 'error'
                  ? 'Payment Error'
                  : 'Payment Failed'}
              </Text>
              <Text style={styles.stateSubtitle}>
                {errorMessage ||
                  (screenState === 'timeout'
                    ? 'The M-Pesa prompt has expired. You can try again.'
                    : 'The payment could not be completed.')}
              </Text>

              <View style={styles.errorActions}>
                <Pressable onPress={handleRetry} style={styles.retryBtn}>
                  <RefreshCw size={18} color="#FFFFFF" />
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </Pressable>
                <Pressable onPress={handleCancel} style={styles.cancelOutlineBtn}>
                  <Text style={styles.cancelOutlineText}>Cancel Order</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Shield size={14} color={Colors.textMuted} />
          <Text style={styles.footerText}>Secured by Safaricom M-Pesa</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFE',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpesaHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mpesaHeaderM: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: MPESA_GREEN,
  },
  mpesaHeaderPesa: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: MPESA_DARK,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateContent: {
    alignItems: 'center',
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MPESA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  phoneIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: MPESA_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  phoneIconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: MPESA_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  resultSuccess: {
    backgroundColor: '#22C55E',
  },
  resultFailed: {
    backgroundColor: '#EF4444',
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  stateSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textPrimary,
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: MPESA_GREEN,
    borderRadius: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: MPESA_GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MPESA_GREEN,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  retryBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cancelOutlineBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelOutlineText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
