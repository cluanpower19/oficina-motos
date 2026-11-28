import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function validarCpfCnpj(doc: string): boolean {
  const d = doc.replace(/\D/g, "");
  if (/^(\d)\1+$/.test(d)) return false;
  if (d.length === 11) {
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += Number(d[i]) * (10 - i);
    let dig = (soma * 10) % 11; if (dig === 10) dig = 0;
    if (dig !== Number(d[9])) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += Number(d[i]) * (11 - i);
    dig = (soma * 10) % 11; if (dig === 10) dig = 0;
    return dig === Number(d[10]);
  }
  if (d.length === 14) {
    const calc = (base: string, pesos: number[]) => {
      const soma = [...base].reduce((a, n, i) => a + Number(n) * pesos[i], 0);
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    const a = calc(d.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
    const b = calc(d.slice(0, 12) + a, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
    return a === Number(d[12]) && b === Number(d[13]);
  }
  return false;
}

async function asaas(path: string, apiKey: string, init?: RequestInit) {
  const response = await fetch("https://api-sandbox.asaas.com/v3" + path, {
    ...init,
    headers: {
      "access_token": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "OficioDoMotor/1.0",
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data?.errors) ? data.errors.map((e: { description?: string }) => e.description).filter(Boolean).join("; ") : "Falha ao comunicar com o Asaas.";
    throw new Error(message || "Falha ao comunicar com o Asaas.");
  }
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ success: false, error: "Método não permitido." }, 405);

  let pagamentoId: string | null = null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const apiKey = Deno.env.get("ASAAS_API_KEY");
  const authHeader = req.headers.get("Authorization");
  if (!apiKey || !serviceKey || !supabaseUrl || !anonKey) return json({ success: false, error: "Integração ainda não configurada no ambiente de testes." }, 503);
  if (!authHeader) return json({ success: false, error: "Sessão não autenticada." }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const { data: userData, error: authError } = await userClient.auth.getUser();
    const user = userData.user;
    if (authError || !user) return json({ success: false, error: "Sessão expirada. Entre novamente." }, 401);

    const body = await req.json();
    const plano = body?.plano;
    const documento = String(body?.cpfCnpj ?? "").replace(/\D/g, "");
    if (!["basico", "completo"].includes(plano)) return json({ success: false, error: "Plano inválido." }, 400);

    const { data: dono, error: donoError } = await userClient.rpc("sou_dono");
    if (donoError || dono !== true) return json({ success: false, error: "Somente o responsável pela oficina pode solicitar a cobrança." }, 403);

    const { data: vinculo, error: vinculoError } = await admin.from("usuarios").select("nome,oficina_id").eq("id", user.id).single();
    if (vinculoError || !vinculo) return json({ success: false, error: "Cadastro da oficina não encontrado." }, 404);
    const { data: oficina, error: oficinaError } = await admin.from("oficinas").select("id,nome,telefone,asaas_customer_id").eq("id", vinculo.oficina_id).single();
    if (oficinaError || !oficina) return json({ success: false, error: "Oficina não encontrada." }, 404);

    const { data: planoDb, error: planoError } = await admin.from("planos_cobranca").select("preco").eq("plano", plano).single();
    if (planoError || !planoDb) return json({ success: false, error: "Preço do plano não configurado." }, 400);

    if (!oficina.asaas_customer_id && !validarCpfCnpj(documento)) {
      return json({ success: false, error: "Informe um CPF ou CNPJ válido do responsável pelo pagamento." }, 400);
    }

    const { data: novoPagamento, error: pagamentoError } = await userClient.rpc("solicitar_pagamento_asaas", { p_plano: plano });
    if (pagamentoError || !novoPagamento) {
      return json({ success: false, error: pagamentoError?.message?.includes("cobrança em aberto") ? pagamentoError.message : "Não foi possível iniciar a cobrança. " + (pagamentoError?.message ?? "") }, 409);
    }
    pagamentoId = novoPagamento;

    let customerId = oficina.asaas_customer_id as string | null;
    if (!customerId) {
      const customer = await asaas("/customers", apiKey, {
        method: "POST",
        body: JSON.stringify({
          name: vinculo.nome || oficina.nome,
          cpfCnpj: documento,
          email: user.email || undefined,
          mobilePhone: oficina.telefone ? String(oficina.telefone).replace(/\D/g, "") : undefined,
          externalReference: oficina.id,
          notificationDisabled: true,
        }),
      });
      customerId = customer.id;
      if (!customerId) throw new Error("O Asaas não retornou o identificador do cliente.");
      const { error: saveCustomerError } = await admin.from("oficinas").update({ asaas_customer_id: customerId }).eq("id", oficina.id);
      if (saveCustomerError) throw new Error("Cliente criado no Asaas, mas não foi possível vincular o cadastro à oficina. Contate o suporte.");
    }

    const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const cobranca = await asaas("/payments", apiKey, {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: Number(planoDb.preco),
        dueDate: hoje,
        description: "Assinatura Ofício do Motor - Plano " + (plano === "completo" ? "Completo" : "Básico"),
        externalReference: pagamentoId,
      }),
    });
    if (!cobranca.id) throw new Error("O Asaas não retornou o identificador da cobrança.");

    const qr = await asaas("/payments/" + encodeURIComponent(cobranca.id) + "/pixQrCode", apiKey);
    if (!qr.payload || !qr.encodedImage) throw new Error("O Asaas não retornou os dados do QR Code PIX.");

    const { error: updateError } = await admin.from("pagamentos_assinatura").update({
      asaas_payment_id: cobranca.id,
      asaas_status: cobranca.status ?? "PENDING",
      pix_payload: qr.payload,
      pix_encoded_image: qr.encodedImage,
      pix_expira_em: qr.expirationDate ?? null,
    }).eq("id", pagamentoId);
    if (updateError) throw new Error("A cobrança foi criada, mas não foi possível salvar os dados do PIX. Contate o suporte antes de gerar outra cobrança.");

    return json({ success: true, paymentId: pagamentoId, expiresAt: qr.expirationDate ?? null });
  } catch (error) {
    if (pagamentoId) {
      await admin.from("pagamentos_assinatura").update({ status: "cancelado" }).eq("id", pagamentoId).eq("status", "aguardando_pagamento");
    }
    const message = error instanceof Error ? error.message : "Erro inesperado ao gerar PIX.";
    return json({ success: false, error: message }, 400);
  }
});
