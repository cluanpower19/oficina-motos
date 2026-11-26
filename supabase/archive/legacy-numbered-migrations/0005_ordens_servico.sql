-- 0005_ordens_servico.sql: OS, itens, numero sequencial por oficina, total, baixa de estoque

create table public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  numero int not null default 0,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  moto_id uuid not null references public.motos(id) on delete restrict,
  mecanico_id uuid references public.usuarios(id) on delete set null,
  defeito_relatado text,
  km_entrada int,
  status text not null default 'orcamento'
    check (status in ('orcamento','aguardando_aprovacao','aprovado','em_andamento','pronto','entregue','cancelado')),
  valor_total numeric(10,2) not null default 0,
  token_publico text not null unique
    default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  estoque_baixado boolean not null default false,
  aprovado_em timestamptz,
  entregue_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (oficina_id, numero)
);

create table public.os_itens (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  tipo text not null check (tipo in ('servico','peca')),
  descricao text not null,
  quantidade int not null default 1 check (quantidade > 0),
  valor_unitario numeric(10,2) not null default 0 check (valor_unitario >= 0),
  peca_id uuid references public.pecas(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index os_oficina_idx on public.ordens_servico (oficina_id, numero desc);
create index os_moto_idx on public.ordens_servico (moto_id);
create index os_cliente_idx on public.ordens_servico (cliente_id);
create index os_itens_os_idx on public.os_itens (os_id);

-- Numero sequencial por oficina
create or replace function public.os_numerar()
returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.oficina_id::text));
  select coalesce(max(numero), 0) + 1 into new.numero
    from public.ordens_servico where oficina_id = new.oficina_id;
  return new;
end;
$$;
create trigger os_numerar_trg before insert on public.ordens_servico
  for each row execute function public.os_numerar();

-- Datas automaticas e baixa de estoque ao marcar em_andamento (uma vez so)
create or replace function public.os_antes_atualizar()
returns trigger language plpgsql as $$
begin
  if new.status = 'aprovado' and new.aprovado_em is null then
    new.aprovado_em := now();
  end if;
  if new.status = 'entregue' and new.entregue_em is null then
    new.entregue_em := now();
  end if;
  if new.status = 'em_andamento' and not old.estoque_baixado then
    update public.pecas p
       set quantidade_estoque = p.quantidade_estoque - s.qtd
      from (select peca_id, sum(quantidade)::int as qtd
              from public.os_itens
             where os_id = new.id and peca_id is not null
             group by peca_id) s
     where p.id = s.peca_id;
    new.estoque_baixado := true;
  end if;
  return new;
end;
$$;
create trigger os_antes_atualizar_trg before update on public.ordens_servico
  for each row execute function public.os_antes_atualizar();

-- Recalcula o total da OS quando os itens mudam
create or replace function public.os_recalcular_total()
returns trigger language plpgsql as $$
declare v_os uuid := coalesce(new.os_id, old.os_id);
begin
  update public.ordens_servico
     set valor_total = coalesce((select sum(quantidade * valor_unitario) from public.os_itens where os_id = v_os), 0)
   where id = v_os;
  return null;
end;
$$;
create trigger os_itens_total_trg after insert or update or delete on public.os_itens
  for each row execute function public.os_recalcular_total();

alter table public.ordens_servico enable row level security;
alter table public.os_itens enable row level security;

create policy "os: da propria oficina" on public.ordens_servico
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

create policy "os_itens: da propria oficina" on public.os_itens
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());

grant select, insert, update, delete on public.ordens_servico to authenticated;
grant select, insert, update, delete on public.os_itens to authenticated;
