create or replace function public.sou_dono()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios where id = auth.uid() and papel = 'dono')
$$;
revoke all on function public.sou_dono() from public, anon;
grant execute on function public.sou_dono() to authenticated;

create table public.financeiro (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric(12,2) not null check (valor >= 0),
  data date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  os_id uuid references public.ordens_servico(id) on delete set null,
  pago boolean not null default false,
  criado_em timestamptz not null default now()
);
create index financeiro_oficina_data_idx on public.financeiro (oficina_id, data);
create unique index financeiro_entrada_os_uni on public.financeiro (os_id) where tipo = 'entrada' and os_id is not null;

alter table public.financeiro enable row level security;
create policy "financeiro: so o dono da oficina" on public.financeiro
  for all to authenticated
  using (oficina_id = public.minha_oficina_id() and public.sou_dono())
  with check (oficina_id = public.minha_oficina_id() and public.sou_dono());
grant select, insert, update, delete on public.financeiro to authenticated;

create or replace function public.os_gerar_financeiro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'entregue' and old.status is distinct from 'entregue' and new.valor_total > 0 then
    insert into public.financeiro (oficina_id, tipo, descricao, valor, os_id, pago)
    values (
      new.oficina_id, 'entrada',
      'OS #' || new.numero || coalesce(' - ' || (select nome from public.clientes where id = new.cliente_id), ''),
      new.valor_total, new.id, false
    )
    on conflict (os_id) where tipo = 'entrada' and os_id is not null do nothing;
  end if;
  return null;
end;
$$;
revoke all on function public.os_gerar_financeiro() from public, anon, authenticated;

create trigger os_gerar_financeiro_trg
  after update of status on public.ordens_servico
  for each row execute function public.os_gerar_financeiro();;
