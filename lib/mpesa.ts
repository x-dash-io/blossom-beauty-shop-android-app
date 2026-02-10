import { supabase } from './supabase';

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (/^[17]\d{8}$/.test(cleaned)) {
    cleaned = '254' + cleaned;
  }
  return cleaned;
}

export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^254[17]\d{8}$/.test(normalized);
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.length === 12) {
    return `+${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
  }
  return phone;
}

interface StkPushSuccessResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateStkPush(params: {
  phone: string;
  amount: number;
  orderId: string;
  paymentId: string;
}): Promise<{ success: true; data: StkPushSuccessResponse } | { success: false; error: string }> {
  try {
    console.log('[M-Pesa] Initiating STK Push for order:', params.orderId);
    const normalizedPhone = normalizePhoneNumber(params.phone);

    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: {
        phone: normalizedPhone,
        amount: Math.ceil(params.amount),
        orderId: params.orderId,
        paymentId: params.paymentId,
        accountReference: 'BlossomBeauty',
        transactionDesc: `Payment for order ${params.orderId}`,
      },
    });

    if (error) {
      console.log('[M-Pesa] Edge function error:', error);
      return {
        success: false,
        error: typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Failed to initiate M-Pesa payment. Please ensure the payment service is configured.',
      };
    }

    console.log('[M-Pesa] STK Push response:', data);

    if (data?.ResponseCode === '0') {
      return { success: true, data: data as StkPushSuccessResponse };
    }

    return {
      success: false,
      error: data?.ResponseDescription || data?.errorMessage || 'Failed to initiate M-Pesa payment',
    };
  } catch (err: unknown) {
    console.log('[M-Pesa] Exception:', err);
    const message = err instanceof Error ? err.message : 'Network error. Please check your connection and try again.';
    return { success: false, error: message };
  }
}
