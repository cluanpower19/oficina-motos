alter table public.oficinas alter column status_assinatura set default 'bloqueado';
alter table public.oficinas alter column teste_ate set default (current_date - 1);

create or replace function public.assinatura_ok()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (select o.status_assinatura = 'ativo'
       from public.oficinas o where o.id = public.minha_oficina_id()),
    false);
$function$;

create or replace function public.criar_oficina(p_nome text, p_telefone text, p_usuario_nome text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_oficina uuid;
  v_email text;
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
begin
  if auth.uid() is null then raise exception 'Não autenticado'; end if;
  if exists (select 1 from public.usuarios where id = auth.uid()) then
    raise exception 'Usuário já vinculado a uma oficina';
  end if;
  if v_tel !~ '^[1-9][1-9]9?[0-9]{8}$' then
    raise exception 'Telefone inválido. Use DDD + número.';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then raise exception 'E-mail não encontrado'; end if;
  if public.email_descartavel(v_email) then
    raise exception 'E-mail temporário não é aceito. Use seu e-mail pessoal.';
  end if;

  insert into public.oficinas (nome, telefone, status_assinatura, teste_ate)
  values (p_nome, v_tel, 'bloqueado', current_date - 1)
  returning id into v_oficina;

  insert into public.usuarios (id, oficina_id, nome, papel)
  values (auth.uid(), v_oficina, p_usuario_nome, 'dono');

  return v_oficina;
end $function$;;
