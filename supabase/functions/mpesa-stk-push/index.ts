// @ts-nocheck
// Supabase Edge Function: M-Pesa STK Push
// Deploy: supabase functions deploy mpesa-stk-push
//
// Required secrets (set via Supabase Dashboard or CLI):
//   supabase secrets set MPESA_CONSUMER_KEY=your_key
//   supabase secrets set MPESA_CONSUMER_SECRET=your_secret
//   supabase secrets set MPESA_PASSKEY=your_passkey
//   supabase secrets set MPESA_SHORTCODE=your_shortcode
//   supabase secrets set MPESA_ENVIRONMENT=sandbox
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-set by Supabase)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SANDBOX_URL = "https://sandbox.safaricom.co.ke";
const PRODUCTION_URL = "https://api.safaricom.co.ke";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, orderId, paymentId, accountReference, transactionDesc } =
      await req.json();

    const env = Deno.env.get("MPESA_ENVIRONMENT") ?? "sandbox";
    const baseUrl = env === "production" ? PRODUCTION_URL : SANDBOX_URL;
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY")!;
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET")!;
    const passkey = Deno.env.get("MPESA_PASSKEY")!;
    const shortcode = Deno.env.get("MPESA_SHORTCODE")!;

    // 1. Get OAuth token
    const authString = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${authString}` } }
    );
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Failed to get Daraja access token:", tokenData);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Generate timestamp + password
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // 3. Callback URL (auto-resolves to your Supabase project)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    // 4. STK Push request
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: accountReference || "BlossomBeauty",
        TransactionDesc: transactionDesc || `Payment for ${orderId}`,
      }),
    });

    const stkData = await stkRes.json();
    console.log("STK Push response:", JSON.stringify(stkData));

    // 5. Update payment record if STK push succeeded
    if (stkData.ResponseCode === "0") {
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from("payments")
        .update({
          checkout_request_id: stkData.CheckoutRequestID,
          merchant_request_id: stkData.MerchantRequestID,
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);
    }

    return new Response(JSON.stringify(stkData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa STK Push error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
