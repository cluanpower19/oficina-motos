-- 0015_grant_edge_function_select_os_fotos.sql
-- A Edge Function orcamento-fotos usa service_role para localizar a OS,
-- validar o plano da oficina e obter os caminhos das fotos antes de gerar
-- URLs assinadas temporárias. Não concede leitura a anon.
grant select on table public.ordens_servico to service_role;
grant select on table public.oficinas to service_role;
grant select on table public.os_fotos to service_role;
;
