-- Registra tentativas confirmadas de reutiliza??o do trial, sem abrir acesso ?s tabelas do Auth.
create table if not exists public.alertas_seguranca (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  email text not null,
  telefone text not null,
  motivo text not null check (motivo in ('email_reutilizado','telefone_reutilizado','email_e_telefone_reutilizados')),
  criado_em timestamptz not null default now(),
  revisado_em timestamptz,
  revisado_por uuid references auth.users(id),
  constraint alertas_seguranca_revisao_check check ((revisado_em is null) = (revisado_por is null))
);
create index if not exists alertas_seguranca_criado_em_idx on public.alertas_seguranca(criado_em desc);
create index if not exists alertas_seguranca_email_criado_idx on public.alertas_seguranca(email, criado_em desc);
create index if not exists alertas_seguranca_telefone_criado_idx on public.alertas_seguranca(telefone, criado_em desc);
alter table public.alertas_seguranca enable row level security;
revoke all on public.alertas_seguranca from public, anon, authenticated;

create or replace function public.registrar_alerta_trial_repetido()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_confirmado timestamptz;
  v_telefone text;
  v_email_usado boolean;
  v_telefone_usado boolean;
  v_motivo text;
begin
  if v_user is null then
    raise exception 'Autentica??o necess?ria' using errcode = '42501';
  end if;
  select lower(btrim(u.email)), u.email_confirmed_at,
         regexp_replace(coalesce(u.raw_user_meta_data->>'telefone',''), '[^0-9]', '', 'g')
    into v_email, v_confirmado, v_telefone
    from auth.users u where u.id = v_user;
  if v_email is null or v_confirmado is null then return false; end if;
  if left(v_telefone, 2) = '55' and length(v_telefone) in (12,13) then
    v_telefone := substr(v_telefone, 3);
  end if;
  if v_telefone !~ '^[1-9][1-9]9?[0-9]{8}$' then return false; end if;
  if exists (select 1 from public.usuarios u where u.id = v_user) then return false; end if;

  select exists(select 1 from public.testes_usados t where t.chave = 'email:' || public.email_canonico(v_email)),
         exists(select 1 from public.testes_usados t where t.chave = 'tel:' || v_telefone)
    into v_email_usado, v_telefone_usado;
  if not v_email_usado and not v_telefone_usado then return false; end if;

  -- Evita duplicar alertas por recarregamento/repeti??o imediata da mesma sess?o.
  if exists (select 1 from public.alertas_seguranca a where a.auth_user_id = v_user and a.criado_em > now() - interval '15 minutes') then
    return false;
  end if;

  v_motivo := case
    when v_email_usado and v_telefone_usado then 'email_e_telefone_reutilizados'
    when v_email_usado then 'email_reutilizado'
    else 'telefone_reutilizado'
  end;
  insert into public.alertas_seguranca(auth_user_id,email,telefone,motivo)
  values (v_user,v_email,v_telefone,v_motivo);
  return true;
end;
$$;
revoke all on function public.registrar_alerta_trial_repetido() from public, anon;
grant execute on function public.registrar_alerta_trial_repetido() to authenticated;

create or replace function public.admin_listar_alertas_seguranca()
returns table (
  id uuid,
  email text,
  telefone text,
  motivo text,
  criado_em timestamptz,
  revisado_em timestamptz,
  tentativas_email_24h bigint,
  tentativas_telefone_24h bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo n?o autorizado' using errcode = '42501';
  end if;
  return query
    select a.id,a.email,a.telefone,a.motivo,a.criado_em,a.revisado_em,
      (select count(*) from public.alertas_seguranca x where x.email = a.email and x.criado_em > now() - interval '24 hours'),
      (select count(*) from public.alertas_seguranca x where x.telefone = a.telefone and x.criado_em > now() - interval '24 hours')
    from public.alertas_seguranca a
    order by a.criado_em desc
    limit 100;
end;
$$;
revoke all on function public.admin_listar_alertas_seguranca() from public, anon;
grant execute on function public.admin_listar_alertas_seguranca() to authenticated;

create or replace function public.admin_marcar_alerta_seguranca_revisado(p_alerta_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_atualizado integer;
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo n?o autorizado' using errcode = '42501';
  end if;
  update public.alertas_seguranca
     set revisado_em = now(), revisado_por = auth.uid()
   where id = p_alerta_id and revisado_em is null;
  get diagnostics v_atualizado = row_count;
  return v_atualizado = 1;
end;
$$;
revoke all on function public.admin_marcar_alerta_seguranca_revisado(uuid) from public, anon;
grant execute on function public.admin_marcar_alerta_seguranca_revisado(uuid) to authenticated;
