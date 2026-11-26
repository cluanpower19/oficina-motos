-- 0004_catalogo_pecas.sql: catalogo de servicos e pecas com RLS por oficina

create table public.servicos_catalogo (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  nome text not null,
  valor_padrao numeric(10,2) not null default 0 check (valor_padrao >= 0),
  criado_em timestamptz not null default now()
);

create table public.pecas (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  nome text not null,
  codigo text,
  preco_venda numeric(10,2) not null default 0 check (preco_venda >= 0),
  quantidade_estoque int not null default 0,
  estoque_minimo int not null default 0 check (estoque_minimo >= 0),
  criado_em timestamptz not null default now()
);

create index servicos_catalogo_oficina_idx on public.servicos_catalogo (oficina_id, nome);
create index pecas_oficina_idx on public.pecas (oficina_id, nome);
create unique index pecas_codigo_unico on public.pecas (oficina_id, lower(codigo)) where codigo is not null;

-- Codigo vazio vira nulo
create or replace function public.normalizar_peca()
returns trigger language plpgsql as $$
begin
  new.codigo := nullif(trim(coalesce(new.codigo, '')), '');
  return new;
end;
$$;

create trigger pecas_normalizar before insert or update on public.pecas
  for each row execute function public.normalizar_peca();

alter table public.servicos_catalogo enable row level security;
alter table public.pecas enable row level security;

create policy "servicos: da propria oficina" on public.servicos_catalogo
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

create policy "pecas: da propria oficina" on public.pecas
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

grant select, insert, update, delete on public.servicos_catalogo to authenticated;
grant select, insert, update, delete on public.pecas to authenticated;
;
