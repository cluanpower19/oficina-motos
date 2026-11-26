alter table public.oficinas alter column teste_ate set default (current_date + 7);

create table if not exists public.testes_usados (
  chave text primary key,
  criado_em timestamptz not null default now()
);
alter table public.testes_usados enable row level security;
revoke all on public.testes_usados from anon, authenticated;

create or replace function public.email_canonico(p text)
returns text language plpgsql immutable as $$
declare u text; d text;
begin
  p := lower(trim(p));
  u := split_part(p, '@', 1);
  d := split_part(p, '@', 2);
  u := split_part(u, '+', 1);
  if d in ('gmail.com', 'googlemail.com') then
    d := 'gmail.com';
    u := replace(u, '.', '');
  end if;
  return u || '@' || d;
end $$;

create or replace function public.email_descartavel(p text)
returns boolean language sql immutable as $$
  select split_part(lower(trim(p)), '@', 2) = any (array[
    'mailinator.com','guerrillamail.com','10minutemail.com','tempmail.com','temp-mail.org',
    'yopmail.com','trashmail.com','sharklasers.com','getnada.com','maildrop.cc','dispostable.com',
    'throwawaymail.com','fakeinbox.com','mohmal.com','emailondeck.com','tempmailo.com','burnermail.io'
  ]);
$$;

create or replace function public.criar_oficina(p_nome text, p_telefone text, p_usuario_nome text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_oficina uuid;
  v_email text;
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_k_email text;
  v_k_tel text;
  v_repetido boolean;
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

  v_k_email := 'email:' || public.email_canonico(v_email);
  v_k_tel := 'tel:' || v_tel;
  v_repetido := exists (select 1 from public.testes_usados where chave in (v_k_email, v_k_tel));

  insert into public.testes_usados (chave) values (v_k_email), (v_k_tel) on conflict do nothing;

  insert into public.oficinas (nome, telefone, status_assinatura, teste_ate)
  values (p_nome, v_tel,
          case when v_repetido then 'bloqueado' else 'teste' end,
          case when v_repetido then current_date - 1 else current_date + 7 end)
  returning id into v_oficina;

  insert into public.usuarios (id, oficina_id, nome, papel)
  values (auth.uid(), v_oficina, p_usuario_nome, 'dono');

  return v_oficina;
end $$;
revoke all on function public.criar_oficina(text, text, text) from public, anon;
grant execute on function public.criar_oficina(text, text, text) to authenticated;
revoke all on function public.email_canonico(text), public.email_descartavel(text) from public, anon, authenticated;

insert into public.testes_usados (chave)
select 'tel:' || o.telefone from public.oficinas o where o.telefone ~ '^[0-9]{10,11}$'
on conflict do nothing;
insert into public.testes_usados (chave)
select 'email:' || public.email_canonico(u.email)
from public.usuarios us join auth.users u on u.id = us.id where us.papel = 'dono'
on conflict do nothing;;
