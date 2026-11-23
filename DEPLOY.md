# DEPLOY.md: publicar o sistema e gerir assinaturas

## 1. Publicar (Netlify, grátis; Vercel funciona igual)

1. Entre em netlify.com com sua conta, "Add new site" > "Import an existing project" > GitHub > repositório `oficina-motos`.
2. Build: `npm run build`, pasta: `dist` (já definido em `netlify.toml`).
3. Em "Site configuration > Environment variables" crie:
   - `VITE_SUPABASE_URL` = `https://layuhmhkzqttgfhawpsh.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = chave publishable/anon (Supabase > Project Settings > API)
   - `VITE_SUPORTE_WHATSAPP` = seu WhatsApp com 55 + DDD (opcional)
4. "Deploy site". Cada `git push` na `main` publica de novo.
5. Nunca coloque a `service_role` aqui.

## 2. Domínio próprio

1. Compre o domínio (Registro.br para .com.br).
2. Netlify > "Domain management" > "Add a domain" e siga o passo a passo de DNS (CNAME/ALIAS indicado por ele). O HTTPS é automático.
3. Supabase > Authentication > URL Configuration: ponha o domínio em "Site URL" e em "Redirect URLs".
4. Os links de orçamento passam a usar o domínio novo sozinhos.

## 3. Gerir assinaturas (Supabase > SQL Editor)

Cada oficina nova começa em `teste` por 14 dias. Teste vencido ou `bloqueado`: a oficina ainda consulta, mas não grava (o banco impede).

```sql
-- ver oficinas
select id, nome, plano, status_assinatura, teste_ate from oficinas order by criado_em desc;

-- ativar depois do Pix
update oficinas set status_assinatura = 'ativo', plano = 'completo' where id = '<id>';

-- bloquear por falta de pagamento
update oficinas set status_assinatura = 'bloqueado' where id = '<id>';

-- estender o teste em 7 dias
update oficinas set teste_ate = teste_ate + 7 where id = '<id>';
```

Planos: `basico` (R$ 79) e `completo` (R$ 149). Limite de usuários por plano ainda não é aplicado (fase 2).
