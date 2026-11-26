-- 0007_lembretes.sql: lembretes de retorno (troca de oleo, revisao, etc.)

create table public.lembretes (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  moto_id uuid not null references public.motos(id) on delete cascade,
  tipo text not null default 'oleo' check (tipo in ('oleo', 'revisao', 'pneu', 'outro')),
  data_prevista date,
  km_previsto integer check (km_previsto is null or km_previsto >= 0),
  enviado boolean not null default false,
  criado_em timestamptz not null default now(),
  constraint lembretes_data_ou_km check (data_prevista is not null or km_previsto is not null)
);
create index lembretes_oficina_data_idx on public.lembretes (oficina_id, enviado, data_prevista);
create index lembretes_moto_idx on public.lembretes (moto_id);

alter table public.lembretes enable row level security;
create policy "lembretes: da propria oficina" on public.lembretes
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());
grant select, insert, update, delete on public.lembretes to authenticated;
