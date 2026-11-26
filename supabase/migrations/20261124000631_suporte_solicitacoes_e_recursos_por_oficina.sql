create table if not exists public.solicitacoes_melhorias (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete restrict,
  categoria text not null check (categoria in ('melhoria','correcao','duvida')),
  escopo text not null default 'exclusivo' check (escopo in ('exclusivo','geral')),
  titulo text not null check (char_length(titulo) between 4 and 120),
  descricao text not null check (char_length(descricao) between 10 and 4000),
  status text not null default 'pendente' check (status in ('pendente','em_analise','aprovada','em_desenvolvimento','concluida','recusada')),
  valor_estimado numeric(12,2) check (valor_estimado is null or valor_estimado >= 0),
  resposta_admin text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists solicitacoes_melhorias_oficina_data_idx on public.solicitacoes_melhorias(oficina_id, criado_em desc);

create table if not exists public.oficina_funcionalidades (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  chave text not null check (chave ~ '^[a-z][a-z0-9_]{1,59}$'),
  nome text not null check (char_length(nome) between 2 and 100),
  descricao text,
  habilitado boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (oficina_id, chave)
);
create index if not exists oficina_funcionalidades_oficina_idx on public.oficina_funcionalidades(oficina_id, habilitado);

alter table public.solicitacoes_melhorias enable row level security;
alter table public.oficina_funcionalidades enable row level security;

revoke all on public.solicitacoes_melhorias from anon, public;
revoke all on public.oficina_funcionalidades from anon, public;
grant select, insert on public.solicitacoes_melhorias to authenticated;
grant update on public.solicitacoes_melhorias to authenticated;
grant select, insert, update on public.oficina_funcionalidades to authenticated;

create policy "Oficina consulta suas solicitacoes" on public.solicitacoes_melhorias
for select to authenticated
using (oficina_id = public.minha_oficina_id() or public.admin_eh_admin());
create policy "Oficina abre solicitacao" on public.solicitacoes_melhorias
for insert to authenticated
with check (oficina_id = public.minha_oficina_id() and criado_por = auth.uid());
create policy "Admin atualiza solicitacoes" on public.solicitacoes_melhorias
for update to authenticated
using (public.admin_eh_admin())
with check (public.admin_eh_admin());

create policy "Oficina consulta recursos habilitados" on public.oficina_funcionalidades
for select to authenticated
using ((oficina_id = public.minha_oficina_id() and habilitado = true) or public.admin_eh_admin());
create policy "Admin gerencia recursos exclusivos" on public.oficina_funcionalidades
for all to authenticated
using (public.admin_eh_admin())
with check (public.admin_eh_admin());;
