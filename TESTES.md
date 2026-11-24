# Ambiente de testes do Ofício do Motor

Este ambiente usa um projeto Supabase independente. Nunca configure o projeto oficial com as credenciais deste arquivo.

## Gerar o aplicativo de testes

```bash
npm ci
npm test
npm run build:test
```

O comando `build:test` carrega `.env.test` e conecta o aplicativo ao projeto `oficio-motor-testes`. O resultado fica em `dist/` e não é publicado no GitHub Pages oficial.

## Segurança

- `.env.test` contém somente a chave publishable/anon do projeto de testes, própria para uso no navegador; nunca coloque `service_role` ou secret keys neste arquivo.
- Use somente contas e dados fictícios no projeto de testes.
- Não copie dados pessoais nem usuários da produção.
- O workflow `Ambiente de testes` gera um artefato separado e não publica no site oficial.
