-- Administração principal do Ofício do Motor.
-- A autorização é validada no banco usando o usuário autenticado e e-mail confirmado.
-- Não confia em user_metadata nem em controles da interface.

create or replace function public.admin_eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and lower(u.email) = 'oficiodomotor@gmail.com'
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function public.admin_eh_admin() from public, anon;
grant execute on function public.admin_eh_admin() to authenticated;

create or replace function public.admin_listar_oficinas()
returns table (
  id uuid,
  nome text,
  telefone text,
  plano text,
  status_assinatura text,
  criado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;

  return query
    select o.id, o.nome, o.telefone, o.plano, o.status_assinatura, o.criado_em
    from public.oficinas o
    order by o.criado_em desc;
end;
$$;

revoke all on function public.admin_listar_oficinas() from public, anon;
grant execute on function public.admin_listar_oficinas() to authenticated;

create or replace function public.admin_atualizar_oficina(
  p_oficina_id uuid,
  p_plano text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;
  if p_plano not in ('basico', 'completo') then
    raise exception 'Plano inválido';
  end if;
  if p_status not in ('ativo', 'bloqueado') then
    raise exception 'Status inválido';
  end if;

  update public.oficinas
     set plano = p_plano,
         status_assinatura = p_status
   where id = p_oficina_id;

  if not found then
    raise exception 'Oficina não encontrada';
  end if;
end;
$$;

revoke all on function public.admin_atualizar_oficina(uuid, text, text) from public, anon;
grant execute on function public.admin_atualizar_oficina(uuid, text, text) to authenticated;

comment on function public.admin_eh_admin() is
  'Autoriza somente a conta institucional confirmada oficiodomotor@gmail.com.';
