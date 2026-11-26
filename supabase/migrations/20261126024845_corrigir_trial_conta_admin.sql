-- Corrige, uma única vez, o trial inicial da conta administrativa vinculada à própria oficina.
-- Não ativa assinatura paga nem permite conceder trial a outras oficinas.

create or replace function app_private.corrigir_trial_propria_oficina_admin()
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oficina_id uuid;
  v_status text;
  v_teste_ate date;
  v_vencimento date;
  v_cancelamento boolean;
  v_hoje date := timezone('America/Sao_Paulo', now())::date;
  v_novo_teste_ate date := timezone('America/Sao_Paulo', now())::date + 6;
begin
  if auth.uid() is null or not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;

  select u.oficina_id
    into v_oficina_id
    from public.usuarios u
    where u.id = auth.uid()
      and u.papel = 'dono';

  if v_oficina_id is null then
    raise exception 'A conta administrativa não possui uma oficina própria vinculada.';
  end if;

  if exists (
    select 1 from public.eventos_cobranca e
    where e.oficina_id = v_oficina_id
      and e.evento = 'correcao_trial_admin_20261126'
  ) then
    raise exception 'A correção inicial do teste grátis já foi utilizada.';
  end if;

  select o.status_assinatura, o.teste_ate, o.vencimento_assinatura, o.cancelamento_agendado
    into v_status, v_teste_ate, v_vencimento, v_cancelamento
    from public.oficinas o
    where o.id = v_oficina_id
    for update;

  if v_status <> 'bloqueado'
     or v_vencimento is not null
     or coalesce(v_cancelamento, false)
     or v_teste_ate >= v_hoje then
    raise exception 'A oficina não corresponde ao caso de trial inicial bloqueado.';
  end if;

  if exists (
    select 1 from public.pagamentos_assinatura p
    where p.oficina_id = v_oficina_id
  ) then
    raise exception 'A oficina já possui histórico de pagamentos; correção não permitida.';
  end if;

  update public.oficinas
    set status_assinatura = 'teste',
        teste_ate = v_novo_teste_ate
    where id = v_oficina_id;

  insert into public.eventos_cobranca (
    oficina_id, evento, ator_id, detalhes
  ) values (
    v_oficina_id,
    'correcao_trial_admin_20261126',
    auth.uid(),
    jsonb_build_object(
      'motivo', 'Correção única de inconsistência na data inicial do trial da conta administrativa',
      'status_anterior', v_status,
      'teste_ate_anterior', v_teste_ate,
      'teste_ate_novo', v_novo_teste_ate
    )
  );

  return v_novo_teste_ate;
end;
$$;

revoke all on function app_private.corrigir_trial_propria_oficina_admin() from public, anon, authenticated;
grant execute on function app_private.corrigir_trial_propria_oficina_admin() to authenticated;

create or replace function public.corrigir_trial_propria_oficina_admin()
returns date
language sql
security invoker
set search_path = ''
as $$
  select app_private.corrigir_trial_propria_oficina_admin();
$$;

revoke all on function public.corrigir_trial_propria_oficina_admin() from public, anon;
grant execute on function public.corrigir_trial_propria_oficina_admin() to authenticated;

comment on function public.corrigir_trial_propria_oficina_admin() is
  'Correção única e auditada do trial inicial da própria oficina vinculada ao administrador; não ativa assinatura paga.';
