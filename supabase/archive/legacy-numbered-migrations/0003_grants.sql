-- 0003_grants.sql: garante permissões da Data API para usuários logados (seguro rodar mais de uma vez)

grant usage on schema public to authenticated;
grant select, update on public.oficinas to authenticated;
grant select on public.usuarios to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.motos to authenticated;
grant execute on function public.minha_oficina_id() to authenticated;
grant execute on function public.criar_oficina(text, text, text) to authenticated;
