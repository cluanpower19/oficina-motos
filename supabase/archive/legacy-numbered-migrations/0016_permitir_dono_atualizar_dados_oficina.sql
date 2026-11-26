-- 0016_permitir_dono_atualizar_dados_oficina.sql
-- A policy "oficina: dono atualiza a propria" já limita a alteração à
-- oficina do usuário cujo papel é dono. Concede o privilégio SQL necessário
-- para que essa policy possa ser aplicada pelo PostgREST.
grant update on table public.oficinas to authenticated;
