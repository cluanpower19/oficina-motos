-- Protege o provisionamento de oficinas e unifica a autorização administrativa.
-- A criação de oficinas passa a ser exclusiva da conta administrativa confirmada.

revoke execute on function public.criar_oficina(text, text, text) from public, anon, authenticated;

create or replace function public.admin_criar_oficina(
  p_email text,
  p_nome text,
  p_telefone text,
  p_usuario_nome text,
  p_plano text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario_id uuid;
  v_confirmado timestamptz;
  v_oficina_id uuid;
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;
  if nullif(trim(p_email), '') is null or nullif(trim(p_nome), '') is null
     or nullif(trim(p_usuario_nome), '') is null then
    raise exception 'Informe e-mail, nome da oficina e nome do responsável';
  end if;
  if p_plano not in ('basico', 'completo') then
    raise exception 'Plano inválido';
  end if;

  select u.id, u.email_confirmed_at
    into v_usuario_id, v_confirmado
    from auth.users u
   where lower(u.email) = lower(trim(p_email))
   limit 1;

  if v_usuario_id is null then
    raise exception 'Não existe usuário Auth com esse e-mail. Convide o usuário pelo Supabase Auth primeiro.';
  end if;
  if v_confirmado is null then
    raise exception 'O usuário precisa confirmar o e-mail antes de receber a oficina';
  end if;
  if exists (select 1 from public.usuarios us where us.id = v_usuario_id) then
    raise exception 'Esse usuário já está vinculado a uma oficina';
  end if;

  insert into public.oficinas (nome, telefone, plano, status_assinatura)
  values (trim(p_nome), nullif(v_telefone, ''), p_plano, 'bloqueado')
  returning id into v_oficina_id;

  insert into public.usuarios (id, oficina_id, nome, papel)
  values (v_usuario_id, v_oficina_id, trim(p_usuario_nome), 'dono');

  return v_oficina_id;
end;
$$;

revoke all on function public.admin_criar_oficina(text, text, text, text, text) from public, anon;
grant execute on function public.admin_criar_oficina(text, text, text, text, text) to authenticated;

-- A conta principal confirmada é a única identidade administrativa.
-- Remove a dependência da tabela admin_users, que não é provisionada pelas migrations locais.
-- Permite que o painel administrativo resolva o nome da oficina nas solicitações.
drop policy if exists "Admin consulta oficinas" on public.oficinas;
create policy "Admin consulta oficinas"
  on public.oficinas for select to authenticated
  using ((select public.admin_eh_admin()));

drop policy if exists "Solicitacoes visiveis pela propria oficina ou admin" on public.solicitacoes_melhorias;
create policy "Solicitacoes visiveis pela propria oficina ou admin"
  on public.solicitacoes_melhorias for select to authenticated
  using (oficina_id = (select public.minha_oficina_id()) or (select public.admin_eh_admin()));

drop policy if exists "Somente admin atualiza solicitacoes" on public.solicitacoes_melhorias;
create policy "Somente admin atualiza solicitacoes"
  on public.solicitacoes_melhorias for update to authenticated
  using ((select public.admin_eh_admin()))
  with check ((select public.admin_eh_admin()));

drop policy if exists "Admin atualiza recursos exclusivos" on public.oficina_funcionalidades;
create policy "Admin atualiza recursos exclusivos"
  on public.oficina_funcionalidades for update to authenticated
  using ((select public.admin_eh_admin()))
  with check ((select public.admin_eh_admin()));

drop policy if exists "Admin insere recursos exclusivos" on public.oficina_funcionalidades;
create policy "Admin insere recursos exclusivos"
  on public.oficina_funcionalidades for insert to authenticated
  with check ((select public.admin_eh_admin()));

drop policy if exists "Admin remove recursos exclusivos" on public.oficina_funcionalidades;
create policy "Admin remove recursos exclusivos"
  on public.oficina_funcionalidades for delete to authenticated
  using ((select public.admin_eh_admin()));

comment on function public.admin_criar_oficina(text, text, text, text, text) is
  'Provisiona oficina bloqueada para usuário Auth confirmado; somente admin pode executar. A liberação é manual após contrato e pagamento.';
