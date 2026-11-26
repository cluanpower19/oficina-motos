-- Exibe o e-mail do titular no painel administrativo, sem expor auth.users diretamente.
drop function if exists public.admin_listar_oficinas();
create function public.admin_listar_oficinas()
returns table (
  id uuid,
  nome text,
  telefone text,
  email text,
  plano text,
  status_assinatura text,
  criado_em timestamptz,
  teste_ate date,
  vencimento_assinatura date,
  dia_ciclo smallint,
  cancelamento_agendado boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;
  return query
    select o.id,o.nome,o.telefone,dono.email::text,o.plano,o.status_assinatura,o.criado_em,
      o.teste_ate,o.vencimento_assinatura,o.dia_ciclo,o.cancelamento_agendado
    from public.oficinas o
    left join lateral (
      select au.email
      from public.usuarios u
      join auth.users au on au.id = u.id
      where u.oficina_id = o.id and u.papel = 'dono'
      limit 1
    ) dono on true
    order by o.criado_em desc;
end;
$$;
revoke all on function public.admin_listar_oficinas() from public, anon;
grant execute on function public.admin_listar_oficinas() to authenticated;