
create table if not exists public.solicitacoes_melhorias (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  criado_por uuid not null references auth.users(id),
  categoria text not null default 'melhoria' check (categoria in ('melhoria','correcao','duvida')),
  escopo text not null default 'exclusivo' check (escopo in ('exclusivo','geral')),
  titulo text not null check (char_length(trim(titulo)) between 4 and 120),
  descricao text not null check (char_length(trim(descricao)) between 10 and 4000),
  status text not null default 'pendente' check (status in ('pendente','em_analise','aprovada','em_desenvolvimento','concluida','recusada')),
  valor_estimado numeric(10,2) check (valor_estimado is null or valor_estimado >= 0),
  resposta_admin text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists solicitacoes_melhorias_oficina_idx
  on public.solicitacoes_melhorias (oficina_id, criado_em desc);
create index if not exists solicitacoes_melhorias_status_idx
  on public.solicitacoes_melhorias (status, criado_em desc);

create table if not exists public.oficina_funcionalidades (
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

create index if not exists oficina_funcionalidades_oficina_idx
  on public.oficina_funcionalidades (oficina_id, habilitado);

alter table public.solicitacoes_melhorias enable row level security;
alter table public.oficina_funcionalidades enable row level security;

drop policy if exists "Solicitacoes visiveis pela propria oficina ou admin" on public.solicitacoes_melhorias;
create policy "Solicitacoes visiveis pela propria oficina ou admin"
on public.solicitacoes_melhorias for select to authenticated
using (
  oficina_id = (select public.minha_oficina_id())
  or exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
);

drop policy if exists "Oficina pode abrir solicitacao" on public.solicitacoes_melhorias;
create policy "Oficina pode abrir solicitacao"
on public.solicitacoes_melhorias for insert to authenticated
with check (
  oficina_id = (select public.minha_oficina_id())
  and criado_por = (select auth.uid())
);

drop policy if exists "Somente admin atualiza solicitacoes" on public.solicitacoes_melhorias;
create policy "Somente admin atualiza solicitacoes"
on public.solicitacoes_melhorias for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "Funcionalidades visiveis pela propria oficina ou admin" on public.oficina_funcionalidades;
create policy "Funcionalidades visiveis pela propria oficina ou admin"
on public.oficina_funcionalidades for select to authenticated
using (
  oficina_id = (select public.minha_oficina_id())
  or exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
);

drop policy if exists "Somente admin gerencia funcionalidades" on public.oficina_funcionalidades;
create policy "Somente admin gerencia funcionalidades"
on public.oficina_funcionalidades for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

revoke all on public.solicitacoes_melhorias from anon, public;
revoke all on public.oficina_funcionalidades from anon, public;
grant select, insert, update on public.solicitacoes_melhorias to authenticated;
grant select, insert, update, delete on public.oficina_funcionalidades to authenticated;
;
