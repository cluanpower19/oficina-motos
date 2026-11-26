
revoke all on function public.minha_oficina_id() from public, anon;
grant execute on function public.minha_oficina_id() to authenticated;

alter function public.normalizar_cliente() set search_path = public;
alter function public.normalizar_moto() set search_path = public;
alter function public.normalizar_peca() set search_path = public;
alter function public.os_numerar() set search_path = public;
alter function public.os_antes_atualizar() set search_path = public;
alter function public.os_recalcular_total() set search_path = public;
alter function public.email_canonico(text) set search_path = pg_catalog;
alter function public.email_descartavel(text) set search_path = pg_catalog;
;
