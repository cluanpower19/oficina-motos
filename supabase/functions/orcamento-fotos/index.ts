import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405)

  try {
    const { token } = await req.json()
    if (typeof token !== "string" || token.length < 16 || token.length > 256) {
      return json({ error: "Orçamento não encontrado." }, 404)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Configuração interna ausente na função orcamento-fotos.")
      return json({ error: "Não foi possível carregar as fotos." }, 500)
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: os, error: erroOS } = await admin
      .from("ordens_servico")
      .select("id, oficina_id")
      .eq("token_publico", token)
      .maybeSingle()

    if (erroOS) throw erroOS
    if (!os) return json({ fotos: [] })

    const { data: oficina, error: erroOficina } = await admin
      .from("oficinas")
      .select("plano, status_assinatura")
      .eq("id", os.oficina_id)
      .maybeSingle()

    if (erroOficina) throw erroOficina
    if (!oficina || oficina.plano !== "completo" || oficina.status_assinatura !== "ativo") {
      return json({ fotos: [] })
    }

    const { data: fotos, error: erroFotos } = await admin
      .from("os_fotos")
      .select("path, legenda")
      .eq("os_id", os.id)
      .eq("oficina_id", os.oficina_id)
      .order("criado_em")

    if (erroFotos) throw erroFotos
    if (!fotos?.length) return json({ fotos: [] })

    const { data: urls, error: erroUrls } = await admin.storage
      .from("os-fotos")
      .createSignedUrls(fotos.map((foto) => foto.path), 300)

    if (erroUrls) throw erroUrls

    const porPath = new Map((urls ?? []).map((item) => [item.path, item.signedUrl]))
    return json({
      fotos: fotos
        .filter((foto) => porPath.has(foto.path))
        .map((foto) => ({ ...foto, url: porPath.get(foto.path) })),
    })
  } catch (error) {
    console.error("Erro ao gerar fotos assinadas do orçamento:", error)
    return json({ error: "Não foi possível carregar as fotos." }, 500)
  }
})
