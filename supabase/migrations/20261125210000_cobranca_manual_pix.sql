-- Cobrança manual por Pix, comprovantes privados e trilha de auditoria.
-- A confirmação de pagamento é exclusiva do administrador e idempotente.

alter table public.oficinas
  add column if not exists vencimento_assinatura date,
  add column if not exists dia_ciclo smallint,
  add column if not exists cancelamento_agendado boolean not null default false,
  add column if not exists cancelamento_solicitado_em timestamptz;

alter table public.oficinas
  drop constraint if exists oficinas_dia_ciclo_check;
alter table public.oficinas
  add constraint oficinas_dia_ciclo_check
  check (dia_ciclo is null or dia_ciclo between 1 and 31);

create table if not exists public.planos_cobranca (
  plano text primary key check (plano in ('basico','completo')),
  preco numeric(10,2) not null check (preco > 0),
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);
insert into public.planos_cobranca (plano,preco)
values ('basico',49.90),('completo',79.90)
on conflict (plano) do nothing;

create table if not exists public.configuracao_pix (
  id boolean primary key default true check (id),
  tipo_chave text,
  chave_pix text,
  titular text,
  instrucoes text,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid references auth.users(id),
  constraint configuracao_pix_tipo_check check (tipo_chave is null or tipo_chave in ('cpf','cnpj','email','telefone','aleatoria'))
);
insert into public.configuracao_pix (id) values (true) on conflict (id) do nothing;

create table if not exists public.pagamentos_assinatura (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete restrict,
  plano text not null references public.planos_cobranca(plano),
  valor numeric(10,2) not null check (valor > 0),
  status text not null default 'aguardando_comprovante'
    check (status in ('aguardando_comprovante','em_analise','confirmado','cancelado')),
  criado_em timestamptz not null default now(),
  criado_por uuid not null references auth.users(id),
  confirmado_em timestamptz,
  confirmado_por uuid references auth.users(id),
  periodo_inicio date,
  vencimento_anterior date,
  novo_vencimento date,
  dia_ciclo smallint check (dia_ciclo is null or dia_ciclo between 1 and 31),
  motivo_rejeicao text
);

create unique index if not exists pagamentos_assinatura_um_pendente_por_oficina
  on public.pagamentos_assinatura(oficina_id)
  where status in ('aguardando_comprovante','em_analise');
create index if not exists pagamentos_assinatura_oficina_criado
  on public.pagamentos_assinatura(oficina_id, criado_em desc);

create table if not exists public.comprovantes_assinatura (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid not null references public.pagamentos_assinatura(id) on delete restrict,
  oficina_id uuid not null references public.oficinas(id) on delete restrict,
  caminho_arquivo text not null unique,
  enviado_em timestamptz not null default now(),
  enviado_por uuid not null references auth.users(id),
  status text not null default 'em_analise' check (status in ('em_analise','aceito','rejeitado')),
  motivo_rejeicao text,
  analisado_em timestamptz,
  analisado_por uuid references auth.users(id)
);
create index if not exists comprovantes_assinatura_pagamento
  on public.comprovantes_assinatura(pagamento_id, enviado_em desc);

create table if not exists public.eventos_cobranca (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete restrict,
  pagamento_id uuid references public.pagamentos_assinatura(id) on delete restrict,
  comprovante_id uuid references public.comprovantes_assinatura(id) on delete restrict,
  evento text not null,
  ator_id uuid references auth.users(id),
  detalhes jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);
create index if not exists eventos_cobranca_oficina_criado
  on public.eventos_cobranca(oficina_id, criado_em desc);

create table if not exists public.notificacoes_cobranca (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid not null references public.oficinas(id) on delete restrict,
  pagamento_id uuid references public.pagamentos_assinatura(id) on delete restrict,
  tipo text not null,
  titulo text not null,
  mensagem text not null,
  criado_em timestamptz not null default now(),
  lida_em timestamptz
);
create index if not exists notificacoes_cobranca_oficina
  on public.notificacoes_cobranca(oficina_id, criado_em desc);

alter table public.planos_cobranca enable row level security;
alter table public.configuracao_pix enable row level security;
alter table public.pagamentos_assinatura enable row level security;
alter table public.comprovantes_assinatura enable row level security;
alter table public.eventos_cobranca enable row level security;
alter table public.notificacoes_cobranca enable row level security;

drop policy if exists "Planos cobrança leitura autenticada" on public.planos_cobranca;
create policy "Planos cobrança leitura autenticada" on public.planos_cobranca
  for select to authenticated using (true);
drop policy if exists "Planos cobrança admin atualiza" on public.planos_cobranca;
create policy "Planos cobrança admin atualiza" on public.planos_cobranca
  for update to authenticated using ((select public.admin_eh_admin()))
  with check ((select public.admin_eh_admin()));

drop policy if exists "Pix leitura autenticada" on public.configuracao_pix;
create policy "Pix leitura autenticada" on public.configuracao_pix
  for select to authenticated using (true);
drop policy if exists "Pix admin atualiza" on public.configuracao_pix;
create policy "Pix admin atualiza" on public.configuracao_pix
  for update to authenticated using ((select public.admin_eh_admin()))
  with check ((select public.admin_eh_admin()));

drop policy if exists "Pagamentos visiveis pela oficina ou admin" on public.pagamentos_assinatura;
create policy "Pagamentos visiveis pela oficina ou admin" on public.pagamentos_assinatura
  for select to authenticated
  using (oficina_id = (select public.minha_oficina_id()) or (select public.admin_eh_admin()));

drop policy if exists "Comprovantes visiveis pela oficina ou admin" on public.comprovantes_assinatura;
create policy "Comprovantes visiveis pela oficina ou admin" on public.comprovantes_assinatura
  for select to authenticated
  using (oficina_id = (select public.minha_oficina_id()) or (select public.admin_eh_admin()));

drop policy if exists "Eventos cobrança visiveis pela oficina ou admin" on public.eventos_cobranca;
create policy "Eventos cobrança visiveis pela oficina ou admin" on public.eventos_cobranca
  for select to authenticated
  using (oficina_id = (select public.minha_oficina_id()) or (select public.admin_eh_admin()));

drop policy if exists "Notificacoes cobrança leitura propria oficina" on public.notificacoes_cobranca;
create policy "Notificacoes cobrança leitura propria oficina" on public.notificacoes_cobranca
  for select to authenticated
  using (oficina_id = (select public.minha_oficina_id()) or (select public.admin_eh_admin()));
drop policy if exists "Notificacoes cobrança marcar lida" on public.notificacoes_cobranca;
create policy "Notificacoes cobrança marcar lida" on public.notificacoes_cobranca
  for update to authenticated
  using (oficina_id = (select public.minha_oficina_id()))
  with check (oficina_id = (select public.minha_oficina_id()));

-- Remove políticas duplicadas/permissivas e restringe cada bucket ao seu uso.
drop policy if exists "Plano completo exigido para arquivos de fotos das OS" on storage.objects;
drop policy if exists "Plano completo pode enviar fotos da propria oficina" on storage.objects;
drop policy if exists "Plano completo pode remover fotos da propria oficina" on storage.objects;
drop policy if exists "assinatura: fotos OS atualizar" on storage.objects;
drop policy if exists "assinatura: fotos OS excluir" on storage.objects;
drop policy if exists "assinatura: fotos OS inserir" on storage.objects;
drop policy if exists "os-fotos: apagar da oficina" on storage.objects;
drop policy if exists "os-fotos: inserir na pasta da oficina" on storage.objects;
drop policy if exists "os-fotos: ler da oficina" on storage.objects;

create policy "os-fotos: leitura da propria oficina plano completo"
  on storage.objects for select to authenticated
  using (bucket_id='os-fotos'
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.plano_completo_ok()));
create policy "os-fotos: envio plano completo assinatura ativa"
  on storage.objects for insert to authenticated
  with check (bucket_id='os-fotos'
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.plano_completo_ok())
    and (select public.assinatura_ok()));
create policy "os-fotos: atualizacao plano completo assinatura ativa"
  on storage.objects for update to authenticated
  using (bucket_id='os-fotos'
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.plano_completo_ok())
    and (select public.assinatura_ok()))
  with check (bucket_id='os-fotos'
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.plano_completo_ok())
    and (select public.assinatura_ok()));
create policy "os-fotos: exclusao plano completo assinatura ativa"
  on storage.objects for delete to authenticated
  using (bucket_id='os-fotos'
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.plano_completo_ok())
    and (select public.assinatura_ok()));

drop policy if exists "assinatura: logos atualizar" on storage.objects;
drop policy if exists "assinatura: logos excluir" on storage.objects;
drop policy if exists "assinatura: logos inserir" on storage.objects;
drop policy if exists "logos: dono apaga na pasta da oficina" on storage.objects;
drop policy if exists "logos: dono atualiza na pasta da oficina" on storage.objects;
drop policy if exists "logos: dono envia na pasta da oficina" on storage.objects;
create policy "logos: dono envia com assinatura ativa"
  on storage.objects for insert to authenticated
  with check (bucket_id='logos' and (select public.sou_dono())
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.assinatura_ok()));
create policy "logos: dono atualiza com assinatura ativa"
  on storage.objects for update to authenticated
  using (bucket_id='logos' and (select public.sou_dono())
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.assinatura_ok()))
  with check (bucket_id='logos' and (select public.sou_dono())
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.assinatura_ok()));
create policy "logos: dono apaga com assinatura ativa"
  on storage.objects for delete to authenticated
  using (bucket_id='logos' and (select public.sou_dono())
    and (storage.foldername(name))[1]=(select public.minha_oficina_id())::text
    and (select public.assinatura_ok()));

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('comprovantes-pix','comprovantes-pix',false,5242880,
  array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Comprovantes Pix envio pela propria oficina" on storage.objects;
create policy "Comprovantes Pix envio pela propria oficina"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'comprovantes-pix'
    and (select public.sou_dono())
    and (storage.foldername(name))[1] = (select public.minha_oficina_id())::text
    and exists (
      select 1 from public.pagamentos_assinatura p
      where p.id::text = (storage.foldername(name))[2]
        and p.oficina_id = (select public.minha_oficina_id())
        and p.status = 'aguardando_comprovante'
    )
  );
drop policy if exists "Comprovantes Pix leitura propria oficina ou admin" on storage.objects;
create policy "Comprovantes Pix leitura propria oficina ou admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'comprovantes-pix'
    and (
      (storage.foldername(name))[1] = (select public.minha_oficina_id())::text
      or (select public.admin_eh_admin())
    )
  );

create or replace function public.assinatura_ok()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select
      (o.status_assinatura = 'ativo'
        and (
          o.vencimento_assinatura is null
          or timezone('America/Sao_Paulo', now())::date <=
            o.vencimento_assinatura + case when o.cancelamento_agendado then 0 else 5 end
        ))
      or (o.status_assinatura = 'teste'
        and o.teste_ate >= timezone('America/Sao_Paulo', now())::date)
    from public.oficinas o
    where o.id = public.minha_oficina_id()
  ), false);
$$;

drop function if exists public.admin_listar_oficinas();
create function public.admin_listar_oficinas()
returns table (
  id uuid,
  nome text,
  telefone text,
  plano text,
  status_assinatura text,
  criado_em timestamptz,
  teste_ate date,
  vencimento_assinatura date,
  dia_ciclo smallint,
  cancelamento_agendado boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;
  return query
    select o.id,o.nome,o.telefone,o.plano,o.status_assinatura,o.criado_em,
      o.teste_ate,o.vencimento_assinatura,o.dia_ciclo,o.cancelamento_agendado
    from public.oficinas o
    order by o.criado_em desc;
end;
$$;
revoke all on function public.admin_listar_oficinas() from public, anon;
grant execute on function public.admin_listar_oficinas() to authenticated;

create or replace function public.admin_atualizar_oficina(
  p_oficina_id uuid,
  p_plano text,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status_atual text;
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode = '42501';
  end if;
  if p_plano is null or p_plano not in ('basico','completo') then
    raise exception 'Plano inválido';
  end if;
  if p_status is null or p_status not in ('ativo','bloqueado','teste') then
    raise exception 'Status inválido';
  end if;
  select status_assinatura into v_status_atual
    from public.oficinas where id = p_oficina_id for update;
  if not found then raise exception 'Oficina não encontrada'; end if;
  if p_status = 'ativo' and v_status_atual <> 'ativo' then
    raise exception 'A ativação deve ocorrer pela confirmação de um pagamento.';
  end if;
  if p_status = 'teste' and v_status_atual <> 'teste' then
    raise exception 'O período de teste não pode ser reativado manualmente.';
  end if;
  update public.oficinas set plano = p_plano, status_assinatura = p_status
   where id = p_oficina_id;
  return true;
end;
$$;

create or replace function public.solicitar_pagamento_assinatura(p_plano text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oficina uuid := public.minha_oficina_id();
  v_preco numeric(10,2);
  v_pagamento uuid;
begin
  if auth.uid() is null or v_oficina is null then
    raise exception 'Usuário não vinculado a uma oficina';
  end if;
  if not public.sou_dono() then raise exception 'Somente o dono da oficina pode solicitar cobrança.'; end if;
  if p_plano not in ('basico','completo') then raise exception 'Plano inválido'; end if;
  select preco into v_preco from public.planos_cobranca where plano = p_plano;
  if v_preco is null then raise exception 'Preço não configurado'; end if;
  if not exists (select 1 from public.configuracao_pix where id=true and nullif(trim(chave_pix),'') is not null) then
    raise exception 'Os dados Pix ainda não foram configurados. Entre em contato com o suporte.';
  end if;
  insert into public.pagamentos_assinatura(oficina_id,plano,valor,criado_por)
  values (v_oficina,p_plano,v_preco,auth.uid())
  returning id into v_pagamento;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,evento,ator_id,detalhes)
  values (v_oficina,v_pagamento,'pagamento_solicitado',auth.uid(),jsonb_build_object('plano',p_plano,'valor',v_preco));
  return v_pagamento;
exception when unique_violation then
  raise exception 'Já existe uma cobrança em aberto para esta oficina.';
end;
$$;
revoke all on function public.solicitar_pagamento_assinatura(text) from public,anon;
grant execute on function public.solicitar_pagamento_assinatura(text) to authenticated;

create or replace function public.registrar_comprovante_assinatura(p_pagamento_id uuid,p_caminho text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oficina uuid := public.minha_oficina_id();
  v_comprovante uuid;
begin
  if auth.uid() is null or v_oficina is null then raise exception 'Não autenticado'; end if;
  if not public.sou_dono() then raise exception 'Somente o dono da oficina pode enviar comprovante.'; end if;
  if p_caminho is null or (storage.foldername(p_caminho))[1] <> v_oficina::text
    or (storage.foldername(p_caminho))[2] <> p_pagamento_id::text then
    raise exception 'Caminho de comprovante inválido';
  end if;
  perform 1 from public.pagamentos_assinatura
    where id=p_pagamento_id and oficina_id=v_oficina and status='aguardando_comprovante'
    for update;
  if not found then raise exception 'Cobrança não está aguardando comprovante'; end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id='comprovantes-pix' and name=p_caminho
  ) then raise exception 'Arquivo de comprovante não encontrado'; end if;
  insert into public.comprovantes_assinatura(pagamento_id,oficina_id,caminho_arquivo,enviado_por)
  values (p_pagamento_id,v_oficina,p_caminho,auth.uid())
  returning id into v_comprovante;
  update public.pagamentos_assinatura set status='em_analise',motivo_rejeicao=null
    where id=p_pagamento_id;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,comprovante_id,evento,ator_id)
  values (v_oficina,p_pagamento_id,v_comprovante,'comprovante_enviado',auth.uid());
  insert into public.notificacoes_cobranca(oficina_id,pagamento_id,tipo,titulo,mensagem)
  values (v_oficina,p_pagamento_id,'comprovante_enviado','Comprovante recebido',
    'Recebemos seu comprovante Pix. A liberação ocorrerá após a conferência manual do pagamento.');
  return v_comprovante;
end;
$$;
revoke all on function public.registrar_comprovante_assinatura(uuid,text) from public,anon;
grant execute on function public.registrar_comprovante_assinatura(uuid,text) to authenticated;

create or replace function public.admin_confirmar_comprovante(p_comprovante_id uuid)
returns date
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp public.comprovantes_assinatura%rowtype;
  v_pag public.pagamentos_assinatura%rowtype;
  v_oficina public.oficinas%rowtype;
  v_hoje date := timezone('America/Sao_Paulo',now())::date;
  v_base date;
  v_inicio date;
  v_vencimento date;
  v_dia integer;
  v_ano integer;
  v_mes integer;
  v_ultimo integer;
  v_preservar boolean := false;
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode='42501';
  end if;
  select * into v_comp from public.comprovantes_assinatura
    where id=p_comprovante_id for update;
  if not found then raise exception 'Comprovante não encontrado'; end if;
  select * into v_pag from public.pagamentos_assinatura
    where id=v_comp.pagamento_id for update;
  if not found or v_pag.status <> 'em_analise' or v_comp.status <> 'em_analise' then
    raise exception 'Este comprovante já foi analisado ou a cobrança não está pendente.';
  end if;
  select * into v_oficina from public.oficinas where id=v_pag.oficina_id for update;
  if not found then raise exception 'Oficina não encontrada'; end if;

  if v_oficina.status_assinatura='ativo'
    and v_oficina.vencimento_assinatura is not null
    and v_hoje <= v_oficina.vencimento_assinatura then
    v_base := v_oficina.vencimento_assinatura;
    v_preservar := true;
    v_dia := coalesce(v_oficina.dia_ciclo,extract(day from v_base)::integer);
  elsif v_oficina.status_assinatura='teste' and v_oficina.teste_ate >= v_hoje then
    v_base := v_oficina.teste_ate;
    v_preservar := true;
    v_dia := coalesce(v_oficina.dia_ciclo,extract(day from v_base)::integer);
  else
    v_base := v_hoje;
    v_dia := extract(day from v_hoje)::integer;
  end if;

  v_inicio := case when v_preservar then v_base + 1 else v_hoje end;
  v_ano := extract(year from v_base)::integer;
  v_mes := extract(month from v_base)::integer + 1;
  if v_mes=13 then v_mes:=1; v_ano:=v_ano+1; end if;
  v_ultimo := extract(day from (make_date(v_ano,v_mes,1) + interval '1 month - 1 day'))::integer;
  v_vencimento := make_date(v_ano,v_mes,least(v_dia,v_ultimo));

  update public.comprovantes_assinatura
    set status='aceito',analisado_em=now(),analisado_por=auth.uid()
    where id=v_comp.id;
  update public.pagamentos_assinatura
    set status='confirmado',confirmado_em=now(),confirmado_por=auth.uid(),
        periodo_inicio=v_inicio,vencimento_anterior=v_oficina.vencimento_assinatura,
        novo_vencimento=v_vencimento,dia_ciclo=v_dia,motivo_rejeicao=null
    where id=v_pag.id;
  update public.oficinas
    set plano=v_pag.plano,status_assinatura='ativo',
        vencimento_assinatura=v_vencimento,dia_ciclo=v_dia,
        cancelamento_agendado=false,cancelamento_solicitado_em=null
    where id=v_oficina.id;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,comprovante_id,evento,ator_id,detalhes)
  values (v_oficina.id,v_pag.id,v_comp.id,'pagamento_confirmado',auth.uid(),
    jsonb_build_object('valor',v_pag.valor,'plano',v_pag.plano,'periodo_inicio',v_inicio,'vencimento',v_vencimento,'preservou_tempo_restante',v_preservar));
  insert into public.notificacoes_cobranca(oficina_id,pagamento_id,tipo,titulo,mensagem)
  values (v_oficina.id,v_pag.id,'pagamento_confirmado','Pagamento confirmado',
    'Seu pagamento foi conferido. Seu acesso está ativo até '||to_char(v_vencimento,'DD/MM/YYYY')||'.');
  return v_vencimento;
end;
$$;
revoke all on function public.admin_confirmar_comprovante(uuid) from public,anon;
grant execute on function public.admin_confirmar_comprovante(uuid) to authenticated;

create or replace function public.admin_rejeitar_comprovante(p_comprovante_id uuid,p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comp public.comprovantes_assinatura%rowtype;
  v_pag public.pagamentos_assinatura%rowtype;
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso administrativo não autorizado' using errcode='42501';
  end if;
  if nullif(trim(p_motivo),'') is null then raise exception 'Informe o motivo da rejeição.'; end if;
  select * into v_comp from public.comprovantes_assinatura
    where id=p_comprovante_id for update;
  if not found then raise exception 'Comprovante não encontrado'; end if;
  select * into v_pag from public.pagamentos_assinatura
    where id=v_comp.pagamento_id for update;
  if not found or v_pag.status <> 'em_analise' or v_comp.status <> 'em_analise' then
    raise exception 'Este comprovante já foi analisado ou a cobrança não está pendente.';
  end if;
  update public.comprovantes_assinatura
    set status='rejeitado',motivo_rejeicao=trim(p_motivo),
        analisado_em=now(),analisado_por=auth.uid()
    where id=v_comp.id;
  update public.pagamentos_assinatura
    set status='aguardando_comprovante',motivo_rejeicao=trim(p_motivo)
    where id=v_pag.id;
  insert into public.eventos_cobranca(oficina_id,pagamento_id,comprovante_id,evento,ator_id,detalhes)
  values (v_pag.oficina_id,v_pag.id,v_comp.id,'comprovante_rejeitado',auth.uid(),
    jsonb_build_object('motivo',trim(p_motivo)));
  insert into public.notificacoes_cobranca(oficina_id,pagamento_id,tipo,titulo,mensagem)
  values (v_pag.oficina_id,v_pag.id,'comprovante_rejeitado','Comprovante rejeitado',
    'O comprovante foi rejeitado: '||trim(p_motivo)||'. Envie um novo comprovante para esta cobrança.');
end;
$$;
revoke all on function public.admin_rejeitar_comprovante(uuid,text) from public,anon;
grant execute on function public.admin_rejeitar_comprovante(uuid,text) to authenticated;

create or replace function public.solicitar_cancelamento_assinatura()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_oficina uuid := public.minha_oficina_id();
begin
  if v_oficina is null then raise exception 'Oficina não encontrada'; end if;
  if not public.sou_dono() then raise exception 'Somente o dono da oficina pode cancelar a renovação.'; end if;
  update public.oficinas
    set cancelamento_agendado=true,cancelamento_solicitado_em=now()
    where id=v_oficina and status_assinatura='ativo'
      and vencimento_assinatura is not null
      and vencimento_assinatura >= timezone('America/Sao_Paulo',now())::date;
  if not found then raise exception 'Não há período pago ativo para cancelar.'; end if;
  insert into public.eventos_cobranca(oficina_id,evento,ator_id)
  values (v_oficina,'cancelamento_agendado',auth.uid());
  insert into public.notificacoes_cobranca(oficina_id,tipo,titulo,mensagem)
  values (v_oficina,'cancelamento_agendado','Cancelamento agendado',
    'Sua assinatura não será renovada. O acesso permanece até o fim do período já pago.');
end;
$$;
revoke all on function public.solicitar_cancelamento_assinatura() from public,anon;
grant execute on function public.solicitar_cancelamento_assinatura() to authenticated;

grant select, update on public.planos_cobranca to authenticated;
grant select, update on public.configuracao_pix to authenticated;
grant select on public.pagamentos_assinatura to authenticated;
grant select on public.comprovantes_assinatura to authenticated;
grant select on public.eventos_cobranca to authenticated;
grant select on public.notificacoes_cobranca to authenticated;
grant update (lida_em) on public.notificacoes_cobranca to authenticated;

comment on table public.pagamentos_assinatura is
  'Cobranças manuais do SaaS; comprovantes não ativam acesso sem confirmação administrativa.';
comment on table public.comprovantes_assinatura is
  'Histórico imutável de comprovantes enviados, inclusive os rejeitados.';
comment on function public.assinatura_ok() is
  'Acesso de escrita: trial válido, assinatura dentro do vencimento ou tolerância de cinco dias; cancelamento não tem tolerância.';

notify pgrst, 'reload schema';
