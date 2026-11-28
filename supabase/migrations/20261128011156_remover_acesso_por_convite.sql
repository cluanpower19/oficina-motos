-- Remove o fluxo de acesso por convite e os campos exclusivos de atribuição.
-- A produção foi verificada: existe apenas a conta titular e não há OS ou atribuições.
drop function if exists public.entrar_oficina(text, text);
drop function if exists public.renovar_convite();

drop index if exists public.oficinas_codigo_convite_uni;
alter table public.oficinas drop column if exists codigo_convite;

alter table public.usuarios drop constraint if exists usuarios_papel_check;
alter table public.usuarios
  add constraint usuarios_papel_check check (papel = 'dono');

alter table public.ordens_servico
  drop constraint if exists ordens_servico_mecanico_id_fkey,
  drop constraint if exists ordens_servico_mecanico_oficina_fk;
alter table public.ordens_servico drop column if exists mecanico_id;

-- Alteração aplicada junto com a retirada dos componentes da interface.

-- Validação automática do código corrigido.
