-- Confirmação automática e idempotente de pagamentos PIX recebidos pelo Asaas.
create or replace function public.asaas_confirmar_pagamento(
  p_evento_id text,
  p_evento_tipo text,
  p_asaas_payment_id text,
  p_valor numeric
)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pag public.pagamentos_assinatura%rowtype;
  v_oficina public.oficinas%rowtype;
  v_hoje date := timezone('America/Sao_Paulo',now())::date;
  v_base date;
  v_inicio date;
  v_vencimento date;
  v_dia integer;
  v_ano integer;
  v_mes integer;
  v_ultimo integer;
  v_preservar boolean := false;
  v_evento uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Acesso não autorizado' using errcode='42501';
  end if;
  if p_evento_id is null or length(p_evento_id) < 5 or p_asaas_payment_id is null then
    raise exception 'Evento ou cobrança inválidos';
  end if;
  select * into v_pag from public.pagamentos_assinatura
    where asaas_payment_id=p_asaas_payment_id for update;
  if not found then raise exception 'Cobrança não localizada'; end if;
  if v_pag.provedor <> 'asaas' then raise exception 'Provedor da cobrança inválido'; end if;
  if abs(v_pag.valor - p_valor) > 0.01 then raise exception 'Valor recebido diferente do valor contratado'; end if;
  if v_pag.status='confirmado' then
    insert into public.asaas_webhook_eventos(evento_id,pagamento_id,tipo_evento,processado_em)
    values (p_evento_id,v_pag.id,p_evento_tipo,now()) on conflict (evento_id) do nothing;
    return v_pag.novo_vencimento;
  end if;
  if v_pag.status <> 'aguardando_pagamento' then
    raise exception 'Cobrança não está aguardando pagamento';
  end if;

  insert into public.asaas_webhook_eventos(evento_id,pagamento_id,tipo_evento,processado_em)
  values (p_evento_id,v_pag.id,p_evento_tipo,now())
  on conflict (evento_id) do nothing
  returning id into v_evento;
  if v_evento is null then
    select novo_vencimento into v_vencimento
      from public.pagamentos_assinatura where id=v_pag.id;
    return v_vencimento;
  end if;

  select * into v_oficina from public.oficinas where id=v_pag.oficina_id for update;
  if not found then raise exception 'Oficina não encontrada'; end if;

  if v_oficina.status_assinatura='ativo'
    and v_oficina.vencimento_assinatura is not null
    and v_hoje <= v_oficina.vencimento_assinatura then
    v_base := v_oficina.vencimento_assinatura;
    v_preservar := true;
    v_dia := coalesce(v_oficina.dia_ciclo,extract(day from v_base)::integer);
  elsif v_oficina.status_assinatura='teste' and v_oficina.teste_ate >= v_hoje then
    v_base := v_oficina.teste_ate;
    v_preservar := true;
    v_dia := coalesce(v_oficina.dia_ciclo,extract(day from v_base)::integer);
  else
    v_base := v_hoje;
    v_dia := extract(day from v_hoje)::integer;
  end if;

  v_inicio := case when v_preservar then v_base + 1 else v_hoje end;
  v_ano := extract(year from v_base)::integer;
  v_mes := extract(month from v_base)::integer + 1;
  if v_mes=13 then v_mes:=1; v_ano:=v_ano+1; end if;
  v_ultimo := extract(day from (make_date(v_ano,v_mes,1) + interval '1 month - 1 day'))::integer;
  v_vencimento := make_date(v_ano,v_mes,least(v_dia,v_ultimo));

  update public.pagamentos_assinatura
    set status='confirmado',asaas_status='RECEIVED',confirmado_em=now(),
        periodo_inicio=v_inicio,vencimento_anterior=v_oficina.vencimento_assinatura,
        novo_vencimento=v_vencimento,dia_ciclo=v_dia,motivo_rejeicao=null
    where id=v_pag.id;
  update public.oficinas
    set plano=v_pag.plano,status_assinatura='ativo',
        vencimento_assinatura=v_vencimento,dia_ciclo=v_dia,
        cancelamento_agendado=false,cancelamento_solicitado_em=null
    where id=v_oficina.id;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,evento,detalhes)
  values (v_oficina.id,v_pag.id,'pagamento_asaas_confirmado',
    jsonb_build_object('valor',v_pag.valor,'plano',v_pag.plano,'periodo_inicio',v_inicio,
      'vencimento',v_vencimento,'asaas_payment_id',p_asaas_payment_id,
      'preservou_tempo_restante',v_preservar));
  insert into public.notificacoes_cobranca(oficina_id,pagamento_id,tipo,titulo,mensagem)
  values (v_oficina.id,v_pag.id,'pagamento_confirmado','Pagamento confirmado',
    'Seu PIX foi confirmado automaticamente. Seu acesso está ativo até '||to_char(v_vencimento,'DD/MM/YYYY')||'.');
  return v_vencimento;
end;
$$;

revoke all on function public.asaas_confirmar_pagamento(text,text,text,numeric) from public, anon, authenticated;
grant execute on function public.asaas_confirmar_pagamento(text,text,text,numeric) to service_role;
