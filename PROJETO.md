# PROJETO.md: Sistema de Gestão para Oficinas de Moto

> Fonte da verdade do projeto. Fica na **raiz do repositório**.
> Como continuar em qualquer conta/computador: veja **CONTINUAR.md**.

## 1. Resumo

Sistema web (SaaS por assinatura mensal) para **oficinas de moto pequenas.
Foco: ordem de serviço digital, orçamento aprovado pelo cliente via WhatsApp, histórico por placa e lembrete automático de retorno (troca de óleo, revisão).

**Não é um ERP.** Simples o bastante para o dono da oficina aprender em 15 minutos, no celular.

## 2. Público e dores

| Dor da oficina | O que o sistema faz |
|---|---|
| Orçamento combinado só de boca, depois o cliente contesta | Orçamento enviado por link, com botão "Aprovar" e registro de data e hora |
| Cliente liga toda hora perguntando se a moto está pronta | Aviso automático de status por WhatsApp |
| Cliente esquece a troca de óleo e some | Lembrete de retorno por data ou quilometragem |
| Histórico da moto no caderno | Histórico por placa e por cliente |
| Não sabe quanto entrou e saiu no mês | Caixa simples e contas a receber |

## 3. Regras de ouro

1. Interface pensada primeiro para **celular**.
2. Poucos cliques: abrir uma OS em menos de 1 minuto.
3. Sem emissão de nota fiscal no MVP.
4. Sem aplicativo nativo. Site responsivo (PWA, se der).
5. Cada oficina só enxerga os próprios dados (multi-oficina com isolamento).
6. Tudo em português do Brasil. Valores em R$, datas em dd/mm/aaaa.
7. **O código vive no Git/GitHub** (repositório privado). Toda etapa termina com o fechamento da seção 9.1.
8. **Migrações só para frente:** cada mudança no banco vira um arquivo novo e numerado em `/supabase/migrations` (ex.: `0003_catalogo.sql`). Nunca editar migrações antigas.
9. **Nenhuma chave no código nem no repositório.** `.env` no `.gitignore`; só o `.env.example` (nomes das variáveis) vai para o Git.

## 4. Stack técnica

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend/banco:** Supabase (Postgres + Auth + Storage), em conta própria. Segurança: RLS em todas as tabelas, filtrando por `oficina_id`.
- **Desenvolvimento:** local no PC do dono (Windows, PowerShell), feito pelo Claude via Remote Desktop Commander. Pasta: `C:\Users\iaras\oficina-moto`.
- **Código:** Git local + repositório **privado** no GitHub (push ao fim de cada etapa, tag `etapa-NN`).
- **Hospedagem:** Netlify ou Vercel, conta própria, domínio próprio (decidir na Etapa 10).
- **WhatsApp (MVP):** links `https://wa.me/55DDDNUMERO?text=...` abertos pelo dono. Sem API oficial.
- **WhatsApp (fase 2):** automação via provedor de API, quando houver clientes pagando.

## 5. Modelo de dados

Todas as tabelas (exceto `oficinas`) têm `oficina_id` e `criado_em`.

- **oficinas**: id, nome, telefone, endereco, logo_url, plano, status_assinatura
- **usuarios**: id (Auth), oficina_id, nome
- **clientes**: id, oficina_id, nome, telefone (com DDD), observacoes
- **motos**: id, oficina_id, cliente_id, placa, marca, modelo, ano, cor, km_atual
- **servicos_catalogo**: id, oficina_id, nome, valor_padrao
- **pecas**: id, oficina_id, nome, codigo (opcional), preco_venda, quantidade_estoque, estoque_minimo
- **ordens_servico**: id, oficina_id, numero (sequencial por oficina), cliente_id, moto_id, defeito_relatado, km_entrada, status, valor_total, token_publico, aprovado_em, entregue_em
  - status: `orcamento` → `aguardando_aprovacao` → `aprovado` → `em_andamento` → `pronto` → `entregue` (ou `cancelado`)
- **os_itens**: id, os_id, tipo (`servico` | `peca`), descricao, quantidade, valor_unitario, peca_id (opcional)
- **os_fotos**: id, os_id, url, legenda
- **lembretes**: id, oficina_id, moto_id, tipo (óleo, revisão, pneu, outro), data_prevista, km_previsto, enviado (bool)
- **financeiro**: id, oficina_id, tipo (`entrada` | `saida`), descricao, valor, data, os_id (opcional), pago (bool)

## 6. Telas do MVP

1. **Login / cadastro da oficina** (e-mail e senha)
2. **Painel inicial**: OS abertas por status, faturamento do mês, lembretes para enviar hoje
3. **Nova OS** (fluxo rápido): buscar moto por placa (se não existir, cadastrar cliente e moto na hora); defeito relatado, km de entrada; serviços e peças (catálogo ou livre); fotos (câmera); botão **"Enviar orçamento por WhatsApp"**
4. **Detalhe da OS**: alterar status, editar itens, "Avisar cliente" (abre WhatsApp com mensagem pronta), registrar pagamento
5. **Página pública do orçamento** (sem login, por `token_publico`): oficina, moto, itens, fotos, total, botões **Aprovar** / **Recusar**
6. **Clientes e motos**: lista, busca por nome ou placa, histórico de serviços
7. **Catálogo de serviços** e **Peças** (estoque simples, alerta de estoque mínimo)
8. **Lembretes**: vencimentos dos próximos 30 dias, botão "Enviar lembrete por WhatsApp"
9. **Financeiro**: entradas, saídas, saldo do mês, contas a receber
10. **Configurações**: dados da oficina, logo, mensagens padrão de WhatsApp, usuários

## 7. Regras de negócio

- Número da OS é sequencial **por oficina**.
- O link do orçamento usa token aleatório e longo. Nunca o id sequencial.
- Ao aprovar pelo link, gravar `aprovado_em` e mudar status para `aprovado`.
- Ao marcar `entregue`, perguntar "Criar lembrete de retorno?" (padrão: troca de óleo em 90 dias ou +1.500 km, editável).
- Ao entregar a OS, gerar entrada no financeiro (pendente ou paga).
- Peças usadas em OS aprovada dão baixa no estoque ao marcar `em_andamento`.
- Telefone salvo só com dígitos e DDD. Link do WhatsApp com prefixo 55.

### Mensagens padrão de WhatsApp (editáveis)

- **Orçamento:** "Olá, {cliente}! O orçamento da sua {moto} ({placa}) está pronto. Veja os detalhes e aprove por aqui: {link}"
- **Pronta:** "Olá, {cliente}! Sua {moto} ({placa}) está pronta para retirada. Valor: R$ {total}."
- **Lembrete:** "Olá, {cliente}! Está chegando a hora da {tipo} da sua {moto}. Quer agendar um horário?"

## 8. Planos (estimativa a validar com clientes)

| Plano | Valor | Limites |
|---|---|---|
| Básico | R$ 79/mês | 2 usuários, OS, orçamento por WhatsApp, histórico |
| Completo | R$ 149/mês | 5 usuários, lembretes, financeiro, relatórios |

Teste grátis de 14 dias, sem cartão. No MVP, cobrança manual (Pix). Depois, gateway (Asaas, Mercado Pago ou similar).

## 9. Etapas de construção

- [x] **Etapa 1:** Projeto base (Vite, React, Tailwind), layout responsivo com menu, login com Supabase Auth, criação da oficina no cadastro
- [x] **Etapa 2:** Tabelas `oficinas`, `usuarios`, `clientes`, `motos` com RLS. Telas de clientes e motos
- [x] **Etapa 3:** Catálogo de serviços e peças
- [x] **Etapa 4:** Nova OS e detalhe da OS (itens, status, número sequencial)
- [x] **Etapa 5:** Fotos da OS (Supabase Storage) e página pública do orçamento com aprovar/recusar
- [x] **Etapa 6:** Botões de WhatsApp com mensagens padrão (wa.me)
- [x] **Etapa 7:** Lembretes de retorno
- [x] **Etapa 8:** Financeiro e painel inicial
- [x] **Etapa 9:** Configurações, permissões da conta titular, polimento mobile
- [x] **Etapa 10:** Controle de assinatura (ativo/bloqueado) e deploy com domínio próprio

### 9.1 Fechamento de etapa (o Claude executa)

1. Testar (build sem erro: `npm run build`) e corrigir.
2. Atualizar este arquivo: marcar a etapa, mudar "Etapa atual", preencher a seção 15.
3. Conferir: migrações em `/supabase/migrations` numeradas, `.env.example` presente, `.env` ignorado, nenhuma chave no código.
4. `git add -A`, commit `Etapa NN concluída`, `git tag etapa-NN`, `git push --follow-tags` (se houver remoto).

> Regra de economia: cada etapa = uma sessão curta. Ao fim, o estado completo está em PROJETO.md (seção 15) + Git. Nada depende do histórico do chat.

## 13. Fora do escopo do MVP

Nota fiscal, integração com fornecedores de peças, app nativo, automação de WhatsApp por API, agendamento online pelo cliente, multi-filial.

## 14. Histórico de decisões

| Data | Decisão |
|---|---|
| 22/11/2026 | Nicho inicial: oficinas de moto pequenas. Sem nota fiscal e sem WhatsApp por API no MVP. |
| 22/11/2026 | Backup principal: Git + GitHub privado, tag `etapa-NN` por etapa. Migrações numeradas, só para frente. |
| 22/11/2026 | Desenvolvimento passa a ser **local, pelo Claude + Remote Desktop Commander** (Windows), sem bolt.new. Retomada por um único comando que lê `CONTINUAR.md`. |
| 23/11/2026 | Assinatura: teste de 14 dias (depois reduzido para 7, ver abaixo), ativação manual (Pix) por SQL no Supabase. Bloqueio no banco por políticas restritivas: oficina inativa só lê. |
| 23/11/2026 | Teste grátis de **7 dias, 1 por pessoa**: migração 0012 (	estes_usados com e-mail canônico sem pontos/+alias e telefone; e-mails descartáveis bloqueados; repetidos nascem loqueado). Recomendado ligar Confirm email no Supabase. |
| 23/11/2026 | Visual cinematogrÃ¡fico (Etapa 10c): tema garagem Ã  noite (asfalto, aÃ§o, tungstÃªnio, sombra azulada), fontes Barlow/Barlow Condensed, granulado e vinheta, tela de entrada com farol e faixas de cinema, menu com Ã­cones SVG. As telas antigas foram remapeadas por CSS em src/index.css (classes bg-white, text-gray-* etc. viram tema escuro). |

## 15. Estado atual do projeto (atualizar a cada etapa)

- **Etapa concluída mais recente:** Etapa 10 (assinatura e deploy: migração 0011 com `teste_ate` (14 dias), checks de `status_assinatura` (`teste`/`ativo`/`bloqueado`) e `plano` (`basico`/`completo`), função `assinatura_ok()` e políticas RESTRITIVAS de insert/update/delete nas 9 tabelas de negócio (oficina sem assinatura válida só lê; validado no banco); `lib/assinatura.ts`; faixa de aviso no Layout (teste: dias restantes; inativa: só consulta, com link de suporte) e cartão Assinatura em Configurações; `netlify.toml`, `vercel.json` e `DEPLOY.md` (publicar, domínio, SQL para ativar/bloquear); `VITE_SUPORTE_WHATSAPP` opcional; build OK; tag `etapa-10`). Antes, Etapa 9 (configurações da oficina e mensagens de WhatsApp editáveis; UPDATE em `oficinas` restrito às colunas de configuração, com plano e assinatura protegidos; `orcamento_publico` devolve a logo; migração 0010 com bucket público `logos`; barra inferior do celular com safe-area; logo na página pública; build OK, sem teste manual; tag `etapa-09`). Antes, Etapa 8 (financeiro e painel: migração 0008 com tabela `financeiro` (RLS só dono, função `sou_dono()`), trigger que cria a entrada pendente "OS #n - cliente" ao marcar a OS como Entregue (uma vez só, validado no banco); tela Financeiro com mês, entradas/saídas/saldo (só o pago), contas a receber, novo lançamento, marcar recebido/pago, apagar; Painel com OS em aberto por status, lembretes de hoje, recebido no mês e a receber (só dono); build OK, sem teste manual; tag `etapa-08`). Antes, Etapa 7 (lembretes de retorno: migração 0007 `lembretes` com RLS; tela Lembretes com atrasados, próximos 30 dias, só por km, WhatsApp, "Já enviei", apagar e novo manual; ao marcar OS como Entregue pergunta se cria lembrete de troca de óleo em 90 dias ou +1.500 km; build OK, sem teste manual; tag `etapa-07`). Antes, Etapa 6 (botões de WhatsApp no OSDetalhe: "Enviar orçamento por WhatsApp" muda status para aguardando aprovação; "Avisar cliente: moto pronta"; `lib/whatsapp.ts`; build OK, sem teste manual; tag `etapa-06`). Antes, Etapa 5 (fotos da OS no Storage + página pública `/orcamento/:token` com Aprovar/Recusar). Migração 0006 aplicada; funções `orcamento_publico` e `responder_orcamento` validadas no banco (aprova uma vez só, grava `aprovado_em`, token inválido não vaza dados). Build OK. Telas ainda sem teste manual no navegador. Tag `etapa-05`.
- **Etapa atual:** MVP completo (Etapas 1 a 10 feitas). Site PUBLICADO em https://oficina-moto-gestao.netlify.app (Netlify, projeto `oficina-moto-gestao`, id `7aa142b1-91e7-4ed4-9304-b2b82e5e76f4`, equipe `carlos-luan`; variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` já definidas lá; deploy por upload via conector Netlify, sem ligação com o GitHub; rotas SPA e bundle conferidos, sem `service_role`). Teste de ponta a ponta no banco passou 21/21 (cadastro, OS, aprovação pública, financeiro, isolamento entre oficinas, bloqueio). Falta: teste visual no navegador/celular, domínio próprio e URL do site no Auth do Supabase. Fase 2 (não iniciada): WhatsApp por API, limite de usuários por plano, cobrança por gateway.
- **Pasta local:** `C:\Users\iaras\oficina-moto`
- **Ambiente:** Windows + PowerShell, Node v26.13.0, npm 11.20.0, git 2.56.1. `gh` não instalado.
- **O que já existe no código:** Vite + React + TS + Tailwind; react-router; `useAuth`, `supabase.ts`, `Layout` (menu), páginas `Login`, `Painel`, `EmBreve`, `Catalogo` (abas `CatalogoServicos` e `CatalogoPecas`), `Clientes` (lista, busca por nome/placa, novo cliente+moto), `ClienteDetalhe` (editar, motos, remover), `OrdensServico`, `NovaOS`, `OSDetalhe` (itens, status, fotos, copiar/abrir link do orçamento), `OrcamentoPublico` (rota pública sem login), `lib/formatos.ts`, `lib/imagem.ts` (reduz foto a 1600px JPEG), `lib/status.ts`, `lib/whatsapp.ts` (wa.me + mensagens padrão), `Lembretes` (página), `lib/lembretes.ts` (tipos, datas AAAA-MM-DD no fuso local), `Financeiro` (página, só dono), `Painel` (resumo real), `Configuracoes` (dados, logo, mensagens e assinatura), `lib/assinatura.ts`
- **Migrações aplicadas no Supabase (NÃO rodar de novo):** `0001_base.sql`, `0002_clientes_motos.sql`, `0003_grants.sql`, `0004_catalogo_pecas.sql`, `0005_ordens_servico.sql`, `0006_fotos_orcamento_publico.sql`, `0007_lembretes.sql`, `0008_financeiro.sql`, `0009_configuracoes.sql`, `0010_logos.sql`, `0011_assinatura.sql`, `0012_teste_7_dias_unico.sql`. Próxima: `0013_...`. O conector Supabase (MCP) está ligado: aplicar migrações com `apply_migration` no projeto `layuhmhkzqttgfhawpsh` e conferir `list_migrations` antes.
- **Supabase:** projeto `layuhmhkzqttgfhawpsh` (https://layuhmhkzqttgfhawpsh.supabase.co), região us-east-2. `.env` local criado (ignorado pelo Git). Chave usada: publishable/anon. Em outro PC: recriar `.env` a partir do `.env.example`. "Confirm email" está DESLIGADO.
- **Repositório GitHub:** https://github.com/cluanpower19/oficina-motos (privado). Branch `main` rastreando `origin/main`.
- **Última tag:** `etapa-10`
- **Git:** identidade local do repo = cluanpower19 / cluanpower19@users.noreply.github.com
- **Pendências:** (1) Teste manual no navegador: Nova OS, itens, status, enviar foto (celular), abrir `/orcamento/<token>` e aprovar/recusar. Testar também os botões de WhatsApp (cliente precisa de telefone com DDD). Testar também Lembretes (novo manual, WhatsApp, "Já enviei") e marcar uma OS como Entregue (pergunta do lembrete e aparece entrada pendente em Financeiro > Contas a receber), lançar uma saída, marcar recebido e ver o Painel. Testar também Etapa 9: salvar dados/logo/mensagens em Configurações e ver a logo em `/orcamento/<token>`. Testar também a Etapa 10: mudar a oficina para `bloqueado` no SQL (ver `DEPLOY.md`) e conferir faixa vermelha e que salvar falha; voltar para `ativo`. Se houver bug, corrigir primeiro. (1b) Site já publicado. Falta: domínio próprio (a compra é do dono) e, em Supabase > Authentication > URL Configuration, pôr a URL do site em Site URL (hoje não afeta o login, pois o e-mail não é confirmado). Para republicar: pedir ao Claude o deploy pelo conector Netlify (siteId acima), ou ligar o repositório no Netlify (Add new project > Import from GitHub) para publicar a cada push. Atenção: o Supabase limita e-mails de cadastro por hora; testes por API de cadastro em massa dão "email rate limit exceeded". (2) Mensagens de WhatsApp editáveis em Configurações (modelos padrão em `lib/whatsapp.ts`). O link do orçamento usa `window.location.origin`: depois do deploy (Etapa 10) o link passa a ser o do domínio real. (3) Segurança (opcional, migração 0009): fixar `search_path` nas funções de trigger e revogar `execute` de `anon` em `minha_oficina_id()`; ativar "Leaked password protection" em Auth. Os avisos sobre `orcamento_publico`/`responder_orcamento` executáveis por anon são intencionais. (4) Usuários de teste podem ser apagados em Authentication > Users.
