-- 0002_clientes_motos.sql: clientes e motos com RLS por oficina

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  nome text not null,
  telefone text,
  observacoes text,
  criado_em timestamptz not null default now()
);

create table public.motos (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  placa text not null,
  marca text,
  modelo text,
  ano int,
  cor text,
  km_atual int,
  criado_em timestamptz not null default now(),
  unique (oficina_id, placa)
);

create index clientes_oficina_idx on public.clientes (oficina_id, nome);
create index motos_oficina_idx on public.motos (oficina_id);
create index motos_cliente_idx on public.motos (cliente_id);

-- Normaliza: telefone só com dígitos, placa em maiúsculas sem espaços ou hífen
create or replace function public.normalizar_cliente()
returns trigger language plpgsql as $$
begin
  new.telefone := nullif(regexp_replace(coalesce(new.telefone, ''), '\D', '', 'g'), '');
  return new;
end;
$$;

create or replace function public.normalizar_moto()
returns trigger language plpgsql as $$
begin
  new.placa := upper(regexp_replace(new.placa, '[^A-Za-z0-9]', '', 'g'));
  return new;
end;
$$;

create trigger clientes_normalizar before insert or update on public.clientes
  for each row execute function public.normalizar_cliente();
create trigger motos_normalizar before insert or update on public.motos
  for each row execute function public.normalizar_moto();

alter table public.clientes enable row level security;
alter table public.motos enable row level security;

create policy "clientes: da propria oficina" on public.clientes
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

create policy "motos: da propria oficina" on public.motos
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());
;
