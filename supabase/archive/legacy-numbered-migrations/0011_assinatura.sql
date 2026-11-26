-- 0011_assinatura.sql: controle de assinatura (teste de 14 dias, ativo, bloqueado)
-- Bloqueada ou com teste vencido: a oficina continua LENDO os dados, mas nao grava nada.
-- Ativar/bloquear: o dono do sistema altera oficinas.status_assinatura (e plano) no painel do Supabase.

alter table public.oficinas add column teste_ate date not null default (current_date + 14);
alter table public.oficinas add constraint oficinas_status_chk check (status_assinatura in ('teste', 'ativo', 'bloqueado'));
alter table public.oficinas add constraint oficinas_plano_chk check (plano in ('basico', 'completo'));

create or replace function public.assinatura_ok()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select o.status_assinatura = 'ativo' or (o.status_assinatura = 'teste' and o.teste_ate >= current_date)
       from public.oficinas o where o.id = public.minha_oficina_id()),
    false);
$$;
revoke all on function public.assinatura_ok() from public, anon;
grant execute on function public.assinatura_ok() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['clientes','motos','servicos_catalogo','pecas','os_fotos','ordens_servico','os_itens','lembretes','financeiro']
  loop
    execute format('create policy "assinatura: so grava se ativa (insert)" on public.%I as restrictive for insert to authenticated with check (public.assinatura_ok())', t);
    execute format('create policy "assinatura: so grava se ativa (update)" on public.%I as restrictive for update to authenticated using (public.assinatura_ok()) with check (public.assinatura_ok())', t);
    execute format('create policy "assinatura: so grava se ativa (delete)" on public.%I as restrictive for delete to authenticated using (public.assinatura_ok())', t);
  end loop;
end $$;
