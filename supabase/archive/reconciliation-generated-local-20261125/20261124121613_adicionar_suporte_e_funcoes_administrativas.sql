
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "admins can read own admin record" on public.admin_users
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.admin_users to authenticated;

create or replace function public.admin_eh_admin()
returns boolean language sql stable security definer set search_path = '' as $function$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$function$;
revoke all on function public.admin_eh_admin() from public, anon;
grant execute on function public.admin_eh_admin() to authenticated;

create table public.solicitacoes_melhorias (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'melhoria' check (categoria in ('melhoria','correcao','duvida')),
  escopo text not null default 'exclusivo' check (escopo in ('exclusivo','geral')),
  titulo text not null check (char_length(trim(titulo)) between 4 and 120),
  descricao text not null check (char_length(trim(descricao)) between 10 and 4000),
  status text not null default 'pendente' check (status in ('pendente','em_analise','aprovada','em_desenvolvimento','concluida','recusada')),
  valor_estimado numeric check (valor_estimado is null or valor_estimado >= 0),
  resposta_admin text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table public.solicitacoes_melhorias enable row level security;
create policy "Oficina pode abrir solicitacao" on public.solicitacoes_melhorias
  for insert to authenticated with check (oficina_id = (select public.minha_oficina_id()) and criado_por = (select auth.uid()));
create policy "Solicitacoes visiveis pela propria oficina ou admin" on public.solicitacoes_melhorias
  for select to authenticated using (oficina_id = (select public.minha_oficina_id()) or public.admin_eh_admin());
create policy "Somente admin atualiza solicitacoes" on public.solicitacoes_melhorias
  for update to authenticated using (public.admin_eh_admin()) with check (public.admin_eh_admin());
grant select, insert, update on public.solicitacoes_melhorias to authenticated;

create table public.oficina_funcionalidades (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  chave text not null check (chave ~ '^[a-z][a-z0-9_]{1,59}$'),
  nome text not null check (char_length(trim(nome)) between 2 and 100),
  descricao text,
  habilitado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (oficina_id, chave)
);
alter table public.oficina_funcionalidades enable row level security;
create policy "Admin atualiza recursos exclusivos" on public.oficina_funcionalidades
  for update to authenticated using (public.admin_eh_admin()) with check (public.admin_eh_admin());
create policy "Admin insere recursos exclusivos" on public.oficina_funcionalidades
  for insert to authenticated with check (public.admin_eh_admin());
create policy "Admin remove recursos exclusivos" on public.oficina_funcionalidades
  for delete to authenticated using (public.admin_eh_admin());
create policy "Oficina consulta recursos habilitados" on public.oficina_funcionalidades
  for select to authenticated using ((oficina_id = public.minha_oficina_id() and habilitado = true) or public.admin_eh_admin());
grant select, insert, update, delete on public.oficina_funcionalidades to authenticated;

create or replace function public.admin_listar_oficinas()
returns table(id uuid, nome text, telefone text, plano text, status_assinatura text, criado_em timestamptz)
language plpgsql stable security definer set search_path = '' as $function$
begin
  if not public.admin_eh_admin() then raise exception 'Acesso não autorizado'; end if;
  return query select o.id, o.nome, o.telefone, o.plano, o.status_assinatura, o.criado_em
    from public.oficinas o order by o.criado_em desc;
end;
$function$;
revoke all on function public.admin_listar_oficinas() from public, anon;
grant execute on function public.admin_listar_oficinas() to authenticated;

create or replace function public.admin_atualizar_oficina(p_oficina_id uuid, p_plano text, p_status text)
returns boolean language plpgsql security definer set search_path = '' as $function$
begin
  if not public.admin_eh_admin() then raise exception 'Acesso não autorizado'; end if;
  if p_plano not in ('basico','completo') then raise exception 'Plano inválido'; end if;
  if p_status not in ('ativo','bloqueado') then raise exception 'Status inválido'; end if;
  update public.oficinas set plano=p_plano,status_assinatura=p_status where id=p_oficina_id;
  if not found then raise exception 'Oficina não encontrada'; end if;
  return true;
end;
$function$;
revoke all on function public.admin_atualizar_oficina(uuid,text,text) from public, anon;
grant execute on function public.admin_atualizar_oficina(uuid,text,text) to authenticated;
;
