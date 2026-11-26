create table public.os_fotos (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null default public.minha_oficina_id() references public.oficinas(id) on delete cascade,
  os_id uuid not null references public.ordens_servico(id) on delete cascade,
  path text not null,
  legenda text,
  criado_em timestamptz not null default now()
);
create index os_fotos_os_idx on public.os_fotos (os_id);

alter table public.os_fotos enable row level security;
create policy "os_fotos: da propria oficina" on public.os_fotos
  for all to authenticated
  using (oficina_id = public.minha_oficina_id())
  with check (oficina_id = public.minha_oficina_id());
grant select, insert, update, delete on public.os_fotos to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('os-fotos', 'os-fotos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "os-fotos: inserir na pasta da oficina" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'os-fotos' and (storage.foldername(name))[1] = public.minha_oficina_id()::text);
create policy "os-fotos: ler da oficina" on storage.objects
  for select to authenticated
  using (bucket_id = 'os-fotos' and (storage.foldername(name))[1] = public.minha_oficina_id()::text);
create policy "os-fotos: apagar da oficina" on storage.objects
  for delete to authenticated
  using (bucket_id = 'os-fotos' and (storage.foldername(name))[1] = public.minha_oficina_id()::text);

create or replace function public.orcamento_publico(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'oficina', jsonb_build_object('nome', ofi.nome, 'telefone', ofi.telefone, 'endereco', ofi.endereco),
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

create or replace function public.responder_orcamento(p_token text, p_aprovar boolean)
returns text language plpgsql security definer set search_path = public as $$
declare o public.ordens_servico;
begin
  select * into o from public.ordens_servico where token_publico = p_token for update;
  if not found then return 'nao_encontrado'; end if;
  if o.status not in ('orcamento', 'aguardando_aprovacao') then return 'ja_respondido'; end if;
  update public.ordens_servico
     set status = case when p_aprovar then 'aprovado' else 'cancelado' end
   where id = o.id;
  return case when p_aprovar then 'aprovado' else 'recusado' end;
end;
$$;

revoke all on function public.orcamento_publico(text) from public;
revoke all on function public.responder_orcamento(text, boolean) from public;
grant execute on function public.orcamento_publico(text) to anon, authenticated;
grant execute on function public.responder_orcamento(text, boolean) to anon, authenticated;;
