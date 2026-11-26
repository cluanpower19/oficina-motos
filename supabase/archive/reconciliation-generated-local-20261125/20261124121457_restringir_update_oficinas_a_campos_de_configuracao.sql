-- 0017_restringir_update_oficinas_a_campos_de_configuracao.sql
-- Remove o UPDATE amplo concedido na migration 0016 e limita a edição
-- do dono aos campos exibidos em Configurações. Plano, status de assinatura,
-- código de convite e datas de teste permanecem sob controle administrativo.
revoke update on table public.oficinas from authenticated;
grant update (nome, telefone, endereco, logo_url, msg_orcamento, msg_pronta, msg_lembrete)
  on table public.oficinas to authenticated;
;
