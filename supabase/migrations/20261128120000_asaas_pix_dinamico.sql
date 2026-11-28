-- Integração Asaas: PIX dinâmico e conciliação por webhook.
-- O CPF/CNPJ do pagador NÃO é persistido no banco do Ofício do Motor.
-- Ele é enviado à API do Asaas no momento do cadastro do cliente.

alter table public.oficinas
  add column if not exists asaas_customer_id text;

alter table public.pagamentos_assinatura
  add column if not exists provedor text not null default 'manual',
  add column if not exists asaas_payment_id text,
  add column if not exists asaas_status text,
  add column if not exists pix_payload text,
  add column if not exists pix_encoded_image text,
  add column if not exists pix_expira_em timestamptz;

alter table public.pagamentos_assinatura
  drop constraint if exists pagamentos_assinatura_provedor_check;
alter table public.pagamentos_assinatura
  add constraint pagamentos_assinatura_provedor_check
  check (provedor in ('manual','asaas'));

alter table public.pagamentos_assinatura
  drop constraint if exists pagamentos_assinatura_status_check;
alter table public.pagamentos_assinatura
  add constraint pagamentos_assinatura_status_check
  check (status in ('aguardando_comprovante','aguardando_pagamento','em_analise','confirmado','cancelado'));

drop index if exists public.pagamentos_assinatura_um_pendente_por_oficina;
create unique index pagamentos_assinatura_um_pendente_por_oficina
  on public.pagamentos_assinatura(oficina_id)
  where status in ('aguardando_comprovante','aguardando_pagamento','em_analise');

create unique index if not exists pagamentos_assinatura_asaas_payment_id_uidx
  on public.pagamentos_assinatura(asaas_payment_id)
  where asaas_payment_id is not null;

create table if not exists public.asaas_webhook_eventos (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null unique,
  pagamento_id uuid references public.pagamentos_assinatura(id) on delete restrict,
  tipo_evento text not null,
  processado_em timestamptz,
  criado_em timestamptz not null default now()
);
alter table public.asaas_webhook_eventos enable row level security;

create or replace function public.solicitar_pagamento_asaas(p_plano text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oficina uuid := public.minha_oficina_id();
  v_preco numeric(10,2);
  v_pagamento uuid;
begin
  if auth.uid() is null or v_oficina is null then
    raise exception 'Usuário não vinculado a uma oficina';
  end if;
  if not public.sou_dono() then
    raise exception 'Somente o dono da oficina pode solicitar cobrança.';
  end if;
  if p_plano not in ('basico','completo') then
    raise exception 'Plano inválido';
  end if;
  select preco into v_preco
    from public.planos_cobranca where plano = p_plano;
  if v_preco is null then
    raise exception 'Preço não configurado';
  end if;
  insert into public.pagamentos_assinatura(oficina_id,plano,valor,status,provedor,criado_por)
  values (v_oficina,p_plano,v_preco,'aguardando_pagamento','asaas',auth.uid())
  returning id into v_pagamento;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,evento,ator_id,detalhes)
  values (v_oficina,v_pagamento,'pagamento_asaas_solicitado',auth.uid(),
    jsonb_build_object('plano',p_plano,'valor',v_preco,'provedor','asaas'));
  return v_pagamento;
exception when unique_violation then
  raise exception 'Já existe uma cobrança em aberto para esta oficina.';
end;
$$;

revoke all on function public.solicitar_pagamento_asaas(text) from public;
grant execute on function public.solicitar_pagamento_asaas(text) to authenticated;
