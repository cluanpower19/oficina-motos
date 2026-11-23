# DESKTOP.md: programa para Windows e Mac (Ofício do motor)

Repo: C:\Users\iaras\oficiodomotor.github.io (GitHub: oficiodomotor/oficiodomotor.github.io, branch main).
Sistema atual: web (Vite + React + TypeScript + Supabase). O programa desktop é o mesmo sistema dentro de uma janela (Electron). O Supabase continua sendo o banco (precisa de internet).

## Prompt de continuidade (colar numa conversa nova, com o Remote Desktop Commander conectado)

```
Use o Remote Desktop Commander. Leia C:\Users\iaras\oficiodomotor.github.io\DESKTOP.md e continue a próxima etapa pendente da lista, só uma etapa por sessão. Ao terminar: marque a etapa como feita neste arquivo, faça commit e push, e me dê o prompt para a próxima.
```

## Regras para o Claude
1. `list_devices`, escolher o online. Windows/PowerShell: usar `;` (não `&&`) e caminhos com `\`.
2. `start_process` remoto espera só 3s. Para comandos lentos, usar `read_process_output` e não repetir o comando.
3. Uma etapa por sessão, só o escopo da etapa. Respostas curtas.
4. Nunca colocar chaves no código. A anon key do Supabase fica em `.env.production` (já existe). Nunca usar service role no frontend.
5. Ao fim de cada etapa: atualizar o checklist abaixo, `git add -A; git commit -m "desktop etapa N"; git push`.
6. Não quebrar o site web: o build web (`npm run build`) deve continuar passando.

## Decisões
- Tecnologia: Electron + electron-builder (só precisa de Node; Tauri exigiria Rust).
- Mac: o instalador (.dmg) só pode ser gerado num Mac ou no GitHub Actions (runner macos). Por isso as builds oficiais saem do GitHub Actions.
- Sem certificado de assinatura, o Windows mostra aviso do SmartScreen e o Mac mostra aviso do Gatekeeper na primeira abertura. Assinar custa (Apple Developer ~US$99/ano; certificado Windows pago). Deixar para a última etapa.
- Alternativa barata e imediata: PWA (instalar pelo navegador no Windows/Mac). Fazer na etapa 1.

## Checklist
- [x] 1. PWA: manifest, ícones, service worker simples. Teste de "Instalar app" no Chrome/Edge.
- [ ] 2. Verificar compatibilidade com janela desktop: o roteador (BrowserRouter x HashRouter), `base` do Vite, caminhos `/img/...`. Ajustar sem quebrar o site web.
- [ ] 3. Estrutura Electron: pasta `electron/` (main.cjs, preload.cjs), scripts `desktop:dev` e `desktop:build` no package.json, janela com ícone e menu enxuto.
- [ ] 4. Build local do instalador Windows (.exe NSIS) e teste de abrir, logar e usar.
- [ ] 5. GitHub Actions: build Windows + Mac ao criar uma tag `desktop-vX.Y.Z`, anexando os instaladores na Release.
- [ ] 6. Ícone final, nome do app, link do WhatsApp abrindo no navegador padrão, impressão de orçamento.
- [ ] 7. Atualização automática (electron-updater) a partir das Releases.
- [ ] 8. (Opcional) Assinatura de código Windows e Mac + notarização.

## Diário
- 23/11/2026, etapa 1 (PWA): criados public/manifest.webmanifest, public/sw.js (cache só do próprio site, rede primeiro nas páginas), public/icons/* (192, 512, maskable, apple-touch), links no index.html e registro do service worker em src/main.tsx (só em produção). Pendência: testar 'Instalar app' no Chrome/Edge com o site publicado e conferir se o deploy serve /sw.js e /manifest.webmanifest (não podem cair no redirect para index.html).

