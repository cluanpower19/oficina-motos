
create index if not exists ordens_servico_mecanico_id_idx
  on public.ordens_servico (mecanico_id);

create index if not exists os_fotos_oficina_id_idx
  on public.os_fotos (oficina_id);

create index if not exists os_itens_oficina_id_idx
  on public.os_itens (oficina_id);

create index if not exists os_itens_peca_id_idx
  on public.os_itens (peca_id);

create index if not exists solicitacoes_melhorias_criado_por_idx
  on public.solicitacoes_melhorias (criado_por);

drop index if exists public.solicitacoes_melhorias_oficina_idx;
;
