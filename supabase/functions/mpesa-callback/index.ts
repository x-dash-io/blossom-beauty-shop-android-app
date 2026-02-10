import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const callback = body.Body?.stkCallback;
    if (!callback) {
      console.log("No stkCallback in body, acknowledging.");
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract metadata from successful transactions
    let mpesaReceiptNumber: string | null = null;
    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = String(item.Value);
      }
    }

    const isSuccess = ResultCode === 0;
    
    // Find the payment record
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("id, order_id, user_id")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (fetchError || !payment) {
      console.error("Payment not found for CheckoutRequestID:", CheckoutRequestID);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Update payment status
    await supabase
      .from("payments")
      .update({
        status: isSuccess ? "completed" : "failed",
        mpesa_receipt_number: mpesaReceiptNumber,
        result_code: String(ResultCode),
        result_desc: ResultDesc,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Update order status on success
    if (isSuccess) {
      await supabase
        .from("orders")
        .update({ status: "processing" })
        .eq("id", payment.order_id);
    }

    // AUDIT LOG
    await supabase.from("payment_logs").insert({
      payment_id: payment.id,
      order_id: payment.order_id,
      user_id: payment.user_id,
      action: "callback_received",
      payload: { 
        result_code: ResultCode, 
        result_desc: ResultDesc, 
        is_success: isSuccess,
        receipt: mpesaReceiptNumber 
      }
    });

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
});
