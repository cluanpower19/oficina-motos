-- 0001_base.sql: oficinas, usuarios, RLS e criação da oficina no cadastro

create table public.oficinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  endereco text,
  logo_url text,
  plano text not null default 'basico',
  status_assinatura text not null default 'teste',
  criado_em timestamptz not null default now()
);

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  oficina_id uuid not null references public.oficinas(id) on delete cascade,
  nome text not null,
  papel text not null default 'dono' check (papel in ('dono', 'mecanico')),
  criado_em timestamptz not null default now()
);

create index usuarios_oficina_idx on public.usuarios (oficina_id);

alter table public.oficinas enable row level security;
alter table public.usuarios enable row level security;

-- Retorna a oficina do usuário logado (evita recursão nas policies)
create or replace function public.minha_oficina_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select oficina_id from public.usuarios where id = auth.uid()
$$;

create policy "oficina: ver a própria" on public.oficinas
  for select to authenticated
  using (id = public.minha_oficina_id());

create policy "oficina: atualizar a própria" on public.oficinas
  for update to authenticated
  using (id = public.minha_oficina_id())
  with check (id = public.minha_oficina_id());

create policy "usuarios: ver da mesma oficina" on public.usuarios
  for select to authenticated
  using (oficina_id = public.minha_oficina_id());

-- Cria a oficina e vincula o usuário logado como "dono"
create or replace function public.criar_oficina(
  p_nome text,
  p_telefone text,
  p_usuario_nome text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_oficina uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    raise exception 'Usuário já vinculado a uma oficina';
  end if;

  insert into public.oficinas (nome, telefone)
  values (p_nome, regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g'))
  returning id into v_oficina;

  insert into public.usuarios (id, oficina_id, nome, papel)
  values (auth.uid(), v_oficina, p_usuario_nome, 'dono');

  return v_oficina;
end;
$$;

revoke all on function public.criar_oficina(text, text, text) from public;
grant execute on function public.criar_oficina(text, text, text) to authenticated;
;
