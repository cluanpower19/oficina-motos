revoke update on table public.oficinas from authenticated;
grant update (nome, telefone, endereco, logo_url, msg_orcamento, msg_pronta, msg_lembrete) on table public.oficinas to authenticated;;
