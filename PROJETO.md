# PROJETO.md: Sistema de Gestão para Oficinas de Moto

> Fonte da verdade do projeto. Fica na **raiz do repositório**.
> Como continuar em qualquer conta/computador: veja **CONTINUAR.md**.

## 1. Resumo

Sistema web (SaaS por assinatura mensal) para **oficinas de moto pequenas** (1 a 5 mecânicos).
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
- **usuarios**: id (Auth), oficina_id, nome, papel (`dono` | `mecanico`)
- **clientes**: id, oficina_id, nome, telefone (com DDD), observacoes
- **motos**: id, oficina_id, cliente_id, placa, marca, modelo, ano, cor, km_atual
- **servicos_catalogo**: id, oficina_id, nome, valor_padrao
- **pecas**: id, oficina_id, nome, codigo (opcional), preco_venda, quantidade_estoque, estoque_minimo
- **ordens_servico**: id, oficina_id, numero (sequencial por oficina), cliente_id, moto_id, mecanico_id, defeito_relatado, km_entrada, status, valor_total, token_publico, aprovado_em, entregue_em
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
- Mecânico vê e edita OS, mas não vê o financeiro. Dono vê tudo.
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
- [ ] **Etapa 4:** Nova OS e detalhe da OS (itens, status, número sequencial)
- [ ] **Etapa 5:** Fotos da OS (Supabase Storage) e página pública do orçamento com aprovar/recusar
- [ ] **Etapa 6:** Botões de WhatsApp com mensagens padrão (wa.me)
- [ ] **Etapa 7:** Lembretes de retorno
- [ ] **Etapa 8:** Financeiro e painel inicial
- [ ] **Etapa 9:** Configurações, permissões (dono x mecânico), polimento mobile
- [ ] **Etapa 10:** Controle de assinatura (ativo/bloqueado) e deploy com domínio próprio

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

## 15. Estado atual do projeto (atualizar a cada etapa)

- **Etapa concluída mais recente:** Etapa 3 (catálogo de serviços e peças com alerta de estoque baixo, testada e funcionando). Tag `etapa-03`.
- **Etapa atual:** 4 (Nova OS e detalhe da OS: itens, status, número sequencial). Ainda não iniciada.
- **Pasta local:** `C:\Users\iaras\oficina-moto`
- **Ambiente:** Windows + PowerShell, Node v26.13.0, npm 11.20.0, git 2.56.1. `gh` não instalado.
- **O que já existe no código:** Vite + React + TS + Tailwind; react-router; `useAuth`, `supabase.ts`, `Layout` (menu), páginas `Login`, `Painel`, `EmBreve`, `Catalogo` (abas `CatalogoServicos` e `CatalogoPecas`), `Clientes` (lista, busca por nome/placa, novo cliente+moto), `ClienteDetalhe` (editar, motos, remover), `lib/formatos.ts`
- **Migrações aplicadas no Supabase (NÃO rodar de novo):** `0001_base.sql`, `0002_clientes_motos.sql`, `0003_grants.sql`, `0004_catalogo_pecas.sql`. Próxima: `0005_...` (nova tabela precisa de RLS + grants para `authenticated`).
- **Supabase:** projeto `layuhmhkzqttgfhawpsh` (https://layuhmhkzqttgfhawpsh.supabase.co), região us-east-2. `.env` local criado (ignorado pelo Git). Chave usada: publishable/anon. Em outro PC: recriar `.env` a partir do `.env.example`. "Confirm email" está DESLIGADO.
- **Repositório GitHub:** https://github.com/cluanpower19/oficina-motos (privado). Branch `main` rastreando `origin/main`.
- **Última tag:** `etapa-03`
- **Git:** identidade local do repo = cluanpower19 / cluanpower19@users.noreply.github.com
- **Pendências:** (1) Começar a Etapa 4: migração 0005 (`ordens_servico`, `os_itens`, número sequencial por oficina, `token_publico`), telas Nova OS (busca moto por placa, serviços/peças do catálogo ou livres) e Detalhe da OS (status, itens). Baixa de estoque só ao marcar `em_andamento`. (2) Usuários de teste podem ser apagados em Authentication > Users.
