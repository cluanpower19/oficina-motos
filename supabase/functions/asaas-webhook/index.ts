import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookToken || !apiKey || !supabaseUrl || !serviceKey) {
    return json({ error: "Webhook not configured" }, 503);
  }

  const receivedToken = req.headers.get("asaas-access-token") ?? "";
  if (!safeEqual(receivedToken, webhookToken)) return json({ error: "Unauthorized" }, 401);

  try {
    const event = await req.json();
    const eventId = String(event?.id ?? "");
    const eventType = String(event?.event ?? "");
    const asaasPaymentId = String(event?.payment?.id ?? "");
    if (!eventId || !eventType || !asaasPaymentId) return json({ received: true, ignored: true });

    if (eventType !== "PAYMENT_RECEIVED") return json({ received: true, ignored: true });

    const apiResponse = await fetch("https://api-sandbox.asaas.com/v3/payments/" + encodeURIComponent(asaasPaymentId), {
      method: "GET",
      headers: { "access_token": apiKey, "Accept": "application/json", "User-Agent": "OficioDoMotor/1.0" },
    });
    const payment = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) return json({ error: "Could not verify payment with Asaas" }, 502);

    if (payment.status !== "RECEIVED" || payment.billingType !== "PIX") {
      return json({ received: true, ignored: true, reason: "Payment not received as PIX" });
    }

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: localPayment, error: localError } = await admin
      .from("pagamentos_assinatura")
      .select("id,valor,status,provedor")
      .eq("asaas_payment_id", asaasPaymentId)
      .maybeSingle();

    if (localError) return json({ error: "Could not load local payment" }, 500);
    if (!localPayment) return json({ received: true, ignored: true, reason: "Payment not linked" });
    if (localPayment.provedor !== "asaas" || payment.externalReference !== localPayment.id) {
      return json({ error: "Payment reference mismatch" }, 400);
    }
    if (Math.abs(Number(payment.value) - Number(localPayment.valor)) > 0.01) {
      return json({ error: "Payment amount mismatch" }, 400);
    }

    const { data: vencimento, error: confirmError } = await admin.rpc("asaas_confirmar_pagamento", {
      p_evento_id: eventId,
      p_evento_tipo: eventType,
      p_asaas_payment_id: asaasPaymentId,
      p_valor: Number(payment.value),
    });
    if (confirmError) return json({ error: "Could not activate subscription" }, 500);

    return json({ received: true, processed: true, dueDate: vencimento ?? null });
  } catch {
    return json({ error: "Invalid webhook payload" }, 400);
  }
});
