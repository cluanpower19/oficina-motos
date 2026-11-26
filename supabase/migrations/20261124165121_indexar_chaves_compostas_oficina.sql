-- Índices de suporte para as FKs compostas criadas em 20261124164926.
CREATE INDEX IF NOT EXISTS motos_cliente_oficina_idx
  ON public.motos (cliente_id, oficina_id);
CREATE INDEX IF NOT EXISTS ordens_servico_cliente_oficina_idx
  ON public.ordens_servico (cliente_id, oficina_id);
CREATE INDEX IF NOT EXISTS ordens_servico_moto_oficina_idx
  ON public.ordens_servico (moto_id, oficina_id);
CREATE INDEX IF NOT EXISTS ordens_servico_mecanico_oficina_idx
  ON public.ordens_servico (mecanico_id, oficina_id);
CREATE INDEX IF NOT EXISTS os_fotos_os_oficina_idx
  ON public.os_fotos (os_id, oficina_id);
CREATE INDEX IF NOT EXISTS os_itens_os_oficina_idx
  ON public.os_itens (os_id, oficina_id);
CREATE INDEX IF NOT EXISTS os_itens_peca_oficina_idx
  ON public.os_itens (peca_id, oficina_id);
CREATE INDEX IF NOT EXISTS financeiro_os_oficina_idx
  ON public.financeiro (os_id, oficina_id);
CREATE INDEX IF NOT EXISTS lembretes_moto_oficina_idx
  ON public.lembretes (moto_id, oficina_id);
;
