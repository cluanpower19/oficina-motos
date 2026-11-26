-- Cadastro autÃ´nomo de oficinas com trial de sete dias apÃ³s confirmaÃ§Ã£o do e-mail.
-- teste_ate representa o Ãºltimo dia inclusivo, usando a data local de SÃ£o Paulo.

create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;

grant usage on schema app_private to authenticated;

create or replace function public.assinatura_ok()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select coalesce((
    select o.status_assinatura = 'ativo'
        or (o.status_assinatura = 'teste'
            and o.teste_ate >= timezone('America/Sao_Paulo', now())::date)
    from public.oficinas o
    where o.id = public.minha_oficina_id()
  ), false);
$function$;

revoke all on function public.assinatura_ok() from public, anon;

grant execute on function public.assinatura_ok() to authenticated;

-- O plano controla a leitura dos recursos; assinatura_ok controla gravaÃ§Ãµes.
create or replace function public.plano_completo_ok()
returns boolean language sql stable security definer set search_path = ''
as $function$
  select coalesce((
    select o.plano = 'completo'
    from public.oficinas o
    where o.id = public.minha_oficina_id()
  ), false);
$function$;

revoke all on function public.plano_completo_ok() from public, anon;

grant execute on function public.plano_completo_ok() to authenticated;

create or replace function app_private.iniciar_trial_oficina(
  p_nome text, p_telefone text, p_usuario_nome text, p_plano text
)
returns uuid language plpgsql security definer set search_path = ''
as $function$
declare
  v_usuario_id uuid := auth.uid();
  v_email text;
  v_confirmado timestamptz;
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
  v_chave_email text;
  v_chave_telefone text;
  v_novos integer;
  v_hoje date;
  v_oficina_id uuid;
begin
  if v_usuario_id is null then
    raise exception 'Entre na sua conta para iniciar o cadastro.' using errcode = '42501';
  end if;
  if public.admin_eh_admin() then
    raise exception 'A conta administrativa nÃ£o pode iniciar um teste de oficina.';
  end if;
  if nullif(btrim(p_nome), '') is null or char_length(btrim(p_nome)) > 120 then
    raise exception 'Informe o nome da oficina (atÃ© 120 caracteres).';
  end if;
  if nullif(btrim(p_usuario_nome), '') is null or char_length(btrim(p_usuario_nome)) > 100 then
    raise exception 'Informe o nome do responsÃ¡vel (atÃ© 100 caracteres).';
  end if;
  if left(v_telefone, 2) = '55' and length(v_telefone) in (12, 13) then
    v_telefone := substr(v_telefone, 3);
  end if;
  if v_telefone !~ '^[1-9][1-9]9?[0-9]{8}$' then
    raise exception 'Telefone invÃ¡lido. Informe DDD e nÃºmero com 10 ou 11 dÃ­gitos.';
  end if;
  if p_plano is null or p_plano not in ('basico', 'completo') then
    raise exception 'Selecione um plano vÃ¡lido.';
  end if;

  select lower(btrim(u.email)), u.email_confirmed_at
    into v_email, v_confirmado
    from auth.users u where u.id = v_usuario_id;
  if v_email is null then
    raise exception 'NÃ£o foi possÃ­vel localizar o e-mail da conta.';
  end if;
  if v_confirmado is null then
    raise exception 'Confirme seu e-mail antes de iniciar o teste grÃ¡tis.' using errcode = '42501';
  end if;
  if public.email_descartavel(v_email) then
    raise exception 'E-mail temporÃ¡rio nÃ£o Ã© aceito. Use seu e-mail habitual.';
  end if;
  if exists (select 1 from public.usuarios u where u.id = v_usuario_id) then
    raise exception 'Esta conta jÃ¡ estÃ¡ vinculada a uma oficina.';
  end if;

  v_chave_email := 'email:' || public.email_canonico(v_email);
  v_chave_telefone := 'tel:' || v_telefone;
  insert into public.testes_usados (chave)
  values (v_chave_email), (v_chave_telefone)
  on conflict (chave) do nothing;
  get diagnostics v_novos = row_count;
  if v_novos <> 2 then
    raise exception 'Este e-mail ou telefone jÃ¡ utilizou o teste grÃ¡tis. Fale com a equipe para contratar um plano.';
  end if;

  v_hoje := timezone('America/Sao_Paulo', now())::date;
  insert into public.oficinas (nome, telefone, plano, status_assinatura, teste_ate)
  values (btrim(p_nome), v_telefone, p_plano, 'teste', v_hoje + 6)
  returning id into v_oficina_id;
  insert into public.usuarios (id, oficina_id, nome, papel)
  values (v_usuario_id, v_oficina_id, btrim(p_usuario_nome), 'dono');
  return v_oficina_id;
end;
$function$;

revoke all on function app_private.iniciar_trial_oficina(text, text, text, text) from public, anon, authenticated;

grant execute on function app_private.iniciar_trial_oficina(text, text, text, text) to authenticated;

create or replace function public.iniciar_trial_oficina(
  p_nome text, p_telefone text, p_usuario_nome text, p_plano text
)
returns uuid language sql security invoker set search_path = ''
as $function$
  select app_private.iniciar_trial_oficina($1, $2, $3, $4);
$function$;

revoke all on function public.iniciar_trial_oficina(text, text, text, text) from public, anon, authenticated;

grant execute on function public.iniciar_trial_oficina(text, text, text, text) to authenticated;

-- O dono nÃ£o pode alterar a prÃ³pria oficina depois que a assinatura expira.
drop policy if exists "assinatura: dono atualiza propria oficina" on public.oficinas;

create policy "assinatura: dono atualiza propria oficina"
  on public.oficinas as restrictive for update to authenticated
  using (public.assinatura_ok()) with check (public.assinatura_ok());

-- Arquivos seguem consultÃ¡veis; apenas gravaÃ§Ãµes ficam bloqueadas apÃ³s expiraÃ§Ã£o.
drop policy if exists "assinatura: logos inserir" on storage.objects;

create policy "assinatura: logos inserir" on storage.objects as restrictive for insert to authenticated
  with check ((bucket_id <> 'logos') or public.assinatura_ok());

drop policy if exists "assinatura: logos atualizar" on storage.objects;

create policy "assinatura: logos atualizar" on storage.objects as restrictive for update to authenticated
  using ((bucket_id <> 'logos') or public.assinatura_ok())
  with check ((bucket_id <> 'logos') or public.assinatura_ok());

drop policy if exists "assinatura: logos excluir" on storage.objects;

create policy "assinatura: logos excluir" on storage.objects as restrictive for delete to authenticated
  using ((bucket_id <> 'logos') or public.assinatura_ok());

drop policy if exists "assinatura: fotos OS inserir" on storage.objects;

create policy "assinatura: fotos OS inserir" on storage.objects as restrictive for insert to authenticated
  with check ((bucket_id <> 'os-fotos') or public.assinatura_ok());

drop policy if exists "assinatura: fotos OS atualizar" on storage.objects;

create policy "assinatura: fotos OS atualizar" on storage.objects as restrictive for update to authenticated
  using ((bucket_id <> 'os-fotos') or public.assinatura_ok())
  with check ((bucket_id <> 'os-fotos') or public.assinatura_ok());

drop policy if exists "assinatura: fotos OS excluir" on storage.objects;

create policy "assinatura: fotos OS excluir" on storage.objects as restrictive for delete to authenticated
  using ((bucket_id <> 'os-fotos') or public.assinatura_ok());

-- O painel administrativo distingue trial vÃ¡lido de teste encerrado.
drop function if exists public.admin_listar_oficinas();

create function public.admin_listar_oficinas()
returns table (id uuid, nome text, telefone text, plano text, status_assinatura text, criado_em timestamptz, teste_ate date)
language plpgsql stable security definer set search_path = ''
as $function$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso nÃ£o autorizado' using errcode = '42501';
  end if;
  return query
    select o.id, o.nome, o.telefone, o.plano, o.status_assinatura, o.criado_em, o.teste_ate
    from public.oficinas o order by o.criado_em desc;
end;
$function$;

revoke all on function public.admin_listar_oficinas() from public, anon;

grant execute on function public.admin_listar_oficinas() to authenticated;

create or replace function public.admin_atualizar_oficina(p_oficina_id uuid, p_plano text, p_status text)
returns boolean language plpgsql security definer set search_path = ''
as $function$
begin
  if not public.admin_eh_admin() then
    raise exception 'Acesso nÃ£o autorizado' using errcode = '42501';
  end if;
  if p_plano is null or p_plano not in ('basico', 'completo') then
    raise exception 'Plano invÃ¡lido';
  end if;
  if p_status is null or p_status not in ('ativo', 'bloqueado', 'teste') then
    raise exception 'Status invÃ¡lido';
  end if;
  if p_status = 'teste' and not exists (
    select 1 from public.oficinas where id = p_oficina_id and status_assinatura = 'teste'
  ) then
    raise exception 'O status de teste sÃ³ pode ser preservado para uma oficina que jÃ¡ esteja em teste.';
  end if;
  update public.oficinas set plano = p_plano, status_assinatura = p_status where id = p_oficina_id;
  if not found then raise exception 'Oficina nÃ£o encontrada'; end if;
  return true;
end;
$function$;

revoke all on function public.admin_atualizar_oficina(uuid, text, text) from public, anon;

grant execute on function public.admin_atualizar_oficina(uuid, text, text) to authenticated;

comment on function public.iniciar_trial_oficina(text, text, text, text) is
  'Cria oficina apÃ³s confirmaÃ§Ã£o de e-mail, reservando e-mail e telefone atomicamente para um Ãºnico trial de sete dias.';

comment on function public.plano_completo_ok() is
  'Verifica apenas a contrataÃ§Ã£o do plano Completo; a validade da assinatura Ã© aplicada separadamente por assinatura_ok().';

NOTIFY pgrst, 'reload schema';
