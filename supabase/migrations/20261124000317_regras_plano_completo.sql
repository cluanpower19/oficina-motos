create or replace function public.plano_completo_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select o.plano = 'completo' and o.status_assinatura = 'ativo'
    from public.oficinas o
    where o.id = public.minha_oficina_id()
  ), false);
$$;
revoke all on function public.plano_completo_ok() from public, anon;
grant execute on function public.plano_completo_ok() to authenticated;

create policy "plano completo: pecas" on public.pecas
as restrictive for all to authenticated
using (public.plano_completo_ok())
with check (public.plano_completo_ok());

create policy "plano completo: lembretes" on public.lembretes
as restrictive for all to authenticated
using (public.plano_completo_ok())
with check (public.plano_completo_ok());

create policy "plano completo: financeiro" on public.financeiro
as restrictive for all to authenticated
using (public.plano_completo_ok())
with check (public.plano_completo_ok());

create policy "plano completo: fotos de OS" on public.os_fotos
as restrictive for all to authenticated
using (public.plano_completo_ok())
with check (public.plano_completo_ok());

create policy "plano completo: itens de pecas" on public.os_itens
as restrictive for all to authenticated
using (tipo <> 'peca' or public.plano_completo_ok())
with check (tipo <> 'peca' or public.plano_completo_ok());;
