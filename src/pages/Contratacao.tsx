import { Link, useSearchParams } from 'react-router-dom'
import { linkWhatsAppComercial } from '../lib/comercial'
import './contratacao.css'

type Plano = 'basico' | 'completo'

const planos: Record<Plano, { nome: string; preco: string; descricao: string }> = {
  basico: { nome: 'Básico', preco: 'R$ 49,90', descricao: 'Clientes, motocicletas, ordens de serviço e orçamentos por link.' },
  completo: { nome: 'Completo', preco: 'R$ 79,90', descricao: 'Tudo do Básico, mais estoque, lembretes e controle financeiro.' },
}

export default function Contratacao() {
  const [params] = useSearchParams()
  const plano: Plano = params.get('plano') === 'completo' ? 'completo' : 'basico'
  const escolhido = planos[plano]
  const mensagem = [
    'Olá! Quero solicitar a contratação do Ofício do Motor.',
    `Plano escolhido: ${escolhido.nome} (${escolhido.preco}/mês).`,
    'Gostaria de receber o contrato para leitura e formalização, além das instruções para pagamento via PIX.',
    'Se necessário, podem me orientar sobre os dados para preencher o contrato.'
  ].join('\n')
  const contato = linkWhatsAppComercial(mensagem)

  return (
    <main className="sp-contract">
      <header className="sp-contract-header">
        <Link to="/" className="sp-contract-brand" aria-label="Ofício do Motor — página inicial">
          <span className="sp-contract-mark">OM<span>·</span></span>
          <span><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span>
        </Link>
        <Link to="/entrar" className="sp-contract-login">Já sou cliente · Entrar ↗</Link>
      </header>

      <section className="sp-contract-hero">
        <div className="sp-contract-kicker"><span /> CONTRATAÇÃO COM TRANSPARÊNCIA</div>
        <h1>Um bom acordo<br /><em>começa com clareza.</em></h1>
        <p>Escolha seu plano, receba o contrato para ler com calma e conheça todas as condições antes de fazer qualquer pagamento.</p>
      </section>

      <section className="sp-contract-content">
        <div className="sp-contract-plan">
          <div className="sp-contract-plan-copy">
            <span className="sp-contract-label">PLANO SELECIONADO</span>
            <h2>{escolhido.nome}</h2>
            <p>{escolhido.descricao}</p>
            <div className="sp-contract-price">{escolhido.preco}<small> / mês</small></div>
          </div>
          <div className="sp-contract-switch" aria-label="Escolher outro plano">
            <span>Comparar planos</span>
            <Link to="/contratar?plano=basico" aria-current={plano === 'basico' ? 'page' : undefined} className={plano === 'basico' ? 'selected' : ''}>Básico</Link>
            <Link to="/contratar?plano=completo" aria-current={plano === 'completo' ? 'page' : undefined} className={plano === 'completo' ? 'selected' : ''}>Completo</Link>
          </div>
          <a className="sp-contract-cta" href={contato} target="_blank" rel="noopener noreferrer">Solicitar contrato e instruções do PIX <span>↗</span></a>
          <small className="sp-contract-contact">Atendimento comercial pelo WhatsApp: (79) 99842-4306</small>
        </div>

        <div className="sp-contract-terms">
          <div className="sp-contract-section-title"><span>01 / CONDIÇÕES</span><h2>O que você precisa saber.</h2></div>
          <div className="sp-contract-term-grid">
            <article><b>Pagamento</b><p>Mensal, via PIX. A equipe confirma os dados e encaminha as instruções de pagamento após a formalização do contrato.</p></article>
            <article><b>Vencimento</b><p>Na mesma data da ativação em cada mês. Quando a data não existir em determinado mês, o vencimento será no último dia daquele mês.</p></article>
            <article><b>Prazo de tolerância</b><p>São concedidos cinco dias corridos após o vencimento. Depois desse prazo, o acesso poderá ser suspenso temporariamente para novas alterações, mantendo a consulta dos dados até a confirmação do pagamento.</p></article>
            <article><b>Cancelamento</b><p>Sem fidelidade e sem multa de cancelamento. A solicitação deve ser feita antes do próximo vencimento para evitar a renovação do período seguinte.</p></article>
            <article><b>Ativação</b><p>Após o aceite do contrato e a confirmação do PIX, a equipe orienta a criação do cadastro e a liberação da oficina.</p></article>
            <article><b>Cadastro após a contratação</b><p>O cadastro da oficina é iniciado depois que o contrato estiver formalizado e o pagamento confirmado. A equipe orienta os próximos passos.</p></article>
          </div>
        </div>

        <div className="sp-contract-steps">
          <div className="sp-contract-section-title"><span>02 / ETAPAS</span><h2>Da escolha à primeira entrada.</h2></div>
          <ol>
            <li><b>Escolha o plano</b><span>Você já selecionou uma opção nesta página.</span></li>
            <li><b>Receba e confira o contrato</b><span>A identificação do prestador, seu plano, os valores e as regras estarão descritos no documento.</span></li>
            <li><b>Formalize e pague via PIX</b><span>O pagamento só é solicitado depois que você puder ler e aceitar as condições.</span></li>
            <li><b>Faça o cadastro e comece</b><span>Com o pagamento confirmado, a equipe orienta a criação da conta e a ativação da oficina.</span></li>
          </ol>
        </div>

        <aside className="sp-contract-notice">
          <strong>Sem cobrança surpresa.</strong> Esta solicitação abre uma conversa com o atendimento comercial. Ela não cria uma conta, não registra uma assinatura e não realiza pagamento. O contrato será disponibilizado para sua leitura e formalização antes de qualquer cobrança.
        </aside>
        <div className="sp-contract-bottom">
          <Link to="/" className="sp-contract-back">← Voltar ao site</Link>
          <a href={contato} target="_blank" rel="noopener noreferrer" className="sp-contract-cta">Continuar pelo WhatsApp <span>↗</span></a>
        </div>
      </section>
      <footer className="sp-contract-footer"><span>OFÍCIO DO MOTOR</span><span>Gestão para oficinas de motocicletas</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  )
}
