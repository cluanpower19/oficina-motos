-- 0009_configuracoes.sql: mensagens de WhatsApp editaveis, logo na pagina publica, convite de mecanicos
-- e protecao das colunas de assinatura (so o dono edita, e so os campos de configuracao)

alter table public.oficinas
  add column msg_orcamento text,
  add column msg_pronta text,
  add column msg_lembrete text,
  add column codigo_convite text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
create unique index oficinas_codigo_convite_uni on public.oficinas (codigo_convite);
alter table public.oficinas add constraint oficinas_msgs_tamanho check (
  char_length(coalesce(msg_orcamento, '')) <= 1000
  and char_length(coalesce(msg_pronta, '')) <= 1000
  and char_length(coalesce(msg_lembrete, '')) <= 1000
);

-- Antes: qualquer usuario da oficina podia alterar tambem plano e status_assinatura.
drop policy "oficina: atualizar a própria" on public.oficinas;
create policy "oficina: dono atualiza a propria" on public.oficinas
  for update to authenticated
  using (id = public.minha_oficina_id() and public.sou_dono())
  with check (id = public.minha_oficina_id() and public.sou_dono());
revoke update on public.oficinas from authenticated;
grant update (nome, telefone, endereco, logo_url, msg_orcamento, msg_pronta, msg_lembrete) on public.oficinas to authenticated;

-- Mecanico entra na oficina com o codigo de convite
create or replace function public.entrar_oficina(p_codigo text, p_nome text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    raise exception 'Usuário já vinculado a uma oficina';
  end if;
  select id into v from public.oficinas where codigo_convite = lower(trim(p_codigo));
  if v is null then raise exception 'Código da oficina inválido'; end if;
  insert into public.usuarios (id, oficina_id, nome, papel)
  values (auth.uid(), v, coalesce(nullif(trim(p_nome), ''), 'Mecânico'), 'mecanico');
  return v;
end;
$$;
revoke all on function public.entrar_oficina(text, text) from public, anon;
grant execute on function public.entrar_oficina(text, text) to authenticated;

-- Dono gera um codigo novo (invalida o anterior)
create or replace function public.renovar_convite()
returns text language plpgsql security definer set search_path = public as $$
declare novo text;
begin
  if not public.sou_dono() then raise exception 'Apenas o dono pode renovar o código'; end if;
  novo := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  update public.oficinas set codigo_convite = novo where id = public.minha_oficina_id();
  return novo;
end;
$$;
revoke all on function public.renovar_convite() from public, anon;
grant execute on function public.renovar_convite() to authenticated;

-- Pagina publica do orcamento agora tambem devolve a logo
create or replace function public.orcamento_publico(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'oficina', jsonb_build_object('nome', ofi.nome, 'telefone', ofi.telefone, 'endereco', ofi.endereco, 'logo', ofi.logo_url),
    'os', jsonb_build_object('numero', o.numero, 'status', o.status, 'valor_total', o.valor_total,
          'defeito_relatado', o.defeito_relatado, 'km_entrada', o.km_entrada,
          'criado_em', o.criado_em, 'aprovado_em', o.aprovado_em),
    'cliente', c.nome,
    'moto', jsonb_build_object('placa', m.placa, 'marca', m.marca, 'modelo', m.modelo),
    'itens', coalesce((select jsonb_agg(jsonb_build_object('tipo', i.tipo, 'descricao', i.descricao,
          'quantidade', i.quantidade, 'valor_unitario', i.valor_unitario) order by i.criado_em)
          from public.os_itens i where i.os_id = o.id), '[]'::jsonb),
    'fotos', coalesce((select jsonb_agg(jsonb_build_object('path', f.path, 'legenda', f.legenda) order by f.criado_em)
          from public.os_fotos f where f.os_id = o.id), '[]'::jsonb)
  ) into v
  from public.ordens_servico o
  join public.oficinas ofi on ofi.id = o.oficina_id
  join public.clientes c on c.id = o.cliente_id
  join public.motos m on m.id = o.moto_id
  where o.token_publico = p_token;
  return v;
end;
$$;
