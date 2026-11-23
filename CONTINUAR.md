# CONTINUAR.md: como retomar o projeto em qualquer conta do Claude

## Comando único (colar numa conversa nova, com o Remote Desktop Commander conectado)

```
Use o Remote Desktop Commander. Leia C:\Users\iaras\oficina-moto\CONTINUAR.md e depois PROJETO.md e continue o projeto de onde parou, seguindo as regras do CONTINUAR.md.
```

## Regras para o Claude (leia antes de agir)

1. Dispositivo: use `list_devices` e escolha o online. Windows/PowerShell: use `;` (não `&&`), caminhos com `\`.
2. `start_process` remoto espera só 3s. Comando lento: use `get_tool_result` / `read_process_output` para acompanhar. Não repita o comando original.
3. Leia a seção 15 do PROJETO.md: ela diz a etapa atual e as pendências. Rode `git -C C:\Users\iaras\oficina-moto status` e `git log --oneline -5` para conferir.
4. Faça **uma etapa por sessão**, só o escopo da etapa. Não refaça o que já existe.
5. Respostas curtas, sem explicações longas (o usuário tem créditos limitados).
6. Nunca escrever chaves no código. `.env` fica só local. Nunca usar a `service role` no frontend.
7. Migrações: arquivo novo numerado em `supabase/migrations`; nunca editar antigas. Não rodar de novo as já aplicadas (seção 15 lista).
8. Ao terminar a etapa: fechamento da seção 9.1 do PROJETO.md (atualizar seção 15, commit, tag `etapa-NN`, push se houver remoto).
9. Se o usuário parar no meio: **commit de segurança** (`git add -A; git commit -m "WIP etapa N"`) e atualizar "Pendências" na seção 15.

## Se estiver em outro computador

1. Instalar Node.js e Git, e conectar o Desktop Commander (`npx @wonderwhy-er/desktop-commander@latest remote`).
2. `git clone <URL do repositório privado> C:\Users\<usuario>\oficina-moto`
3. Recriar o `.env` (copiar `.env.example` e preencher com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, do gerenciador de senhas ou Supabase → Project Settings → API).
4. `npm install`, depois colar o comando único acima (ajustando o caminho).
