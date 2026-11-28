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
  const contato = linkWhatsAppComercial('Olá! Tenho dúvidas sobre o plano ' + escolhido.nome + ' do Ofício do Motor.')

  return (
    <main className="sp-contract">
      <header className="sp-contract-header">
        <Link to="/" className="sp-contract-brand" aria-label="Ofício do Motor — página inicial">
          <img className="sp-contract-mark" src="/marca-oficio.svg" alt="" />
          <span><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span>
        </Link>
        <Link to="/entrar" className="sp-contract-login">Já sou cliente — Entrar</Link>
      </header>
      <section className="sp-contract-hero">
        <div className="sp-contract-kicker"><span /> TESTE GRÁTIS POR 7 DIAS</div>
        <h1>Conheça o sistema<br /><em>na rotina da sua oficina.</em></h1>
        <p>Escolha seu plano, crie sua conta e experimente os recursos por sete dias. Sem cartão e sem pagamento antecipado.</p>
      </section>
      <section className="sp-contract-content">
        <div className="sp-contract-plan">
          <div className="sp-contract-plan-copy">
            <span className="sp-contract-label">PLANO ESCOLHIDO</span>
            <h2>{escolhido.nome}</h2>
            <p>{escolhido.descricao}</p>
            <div className="sp-contract-price">{escolhido.preco}<small> / mês após o teste</small></div>
          </div>
          <div className="sp-contract-switch" aria-label="Escolher outro plano">
            <span>Comparar planos</span>
            <Link to="/contratar?plano=basico" aria-current={plano === 'basico' ? 'page' : undefined} className={plano === 'basico' ? 'selected' : ''}>Básico</Link>
            <Link to="/contratar?plano=completo" aria-current={plano === 'completo' ? 'page' : undefined} className={plano === 'completo' ? 'selected' : ''}>Completo</Link>
          </div>
          <Link className="sp-contract-cta" to={'/cadastro?plano=' + plano}>Criar conta e começar grátis <span>→</span></Link>
          <small className="sp-contract-contact">Sem cartão, sem cobrança antecipada e sem compromisso.</small>
        </div>
        <div className="sp-contract-terms">
          <div className="sp-contract-section-title"><span>01 / COMO FUNCIONA</span><h2>Sete dias para experimentar.</h2></div>
          <div className="sp-contract-term-grid">
            <article><b>Início do teste</b><p>O prazo começa depois que você confirma o e-mail e entra pela primeira vez no sistema.</p></article>
            <article><b>Sem pagamento antecipado</b><p>Não pedimos cartão, PIX ou dados bancários para criar a conta e experimentar.</p></article>
            <article><b>Recursos do plano</b><p>Durante o teste, você usa os recursos do plano escolhido: Básico ou Completo.</p></article>
            <article><b>Depois dos sete dias</b><p>Sem ativação de uma assinatura paga, novas inclusões e alterações ficam suspensas. Seus dados continuam disponíveis para consulta.</p></article>
            <article><b>Pagamento</b><p>O plano mensal custa {escolhido.preco}. A ativação paga ocorre após a confirmação do pagamento.</p></article>
            <article><b>Cancelamento</b><p>O teste não gera cobrança automática. Você decide se deseja continuar depois de conhecer o sistema.</p></article>
          </div>
        </div>
        <div className="sp-contract-steps">
          <div className="sp-contract-section-title"><span>02 / PRIMEIROS PASSOS</span><h2>Da conta ao primeiro atendimento.</h2></div>
          <ol>
            <li><b>Escolha seu plano</b><span>Você já selecionou {escolhido.nome}; pode trocar antes de criar a conta.</span></li>
            <li><b>Cadastre seus dados</b><span>Informe oficina, responsável, telefone, e-mail e senha.</span></li>
            <li><b>Confirme seu e-mail</b><span>Abra o link enviado para seu endereço. O teste ainda não começa antes disso.</span></li>
            <li><b>Entre e experimente</b><span>No primeiro acesso confirmado, a oficina é criada e os sete dias começam.</span></li>
          </ol>
        </div>
        <aside className="sp-contract-notice"><strong>Sem cobrança surpresa.</strong> O cadastro inicia somente o teste grátis. Nenhum pagamento é solicitado nesta etapa. Se quiser conversar com a equipe antes de começar, <a href={contato} target="_blank" rel="noopener noreferrer">fale com o atendimento</a>.</aside>
        <div className="sp-contract-bottom">
          <Link to="/" className="sp-contract-back">← Voltar ao site</Link>
          <Link to={'/cadastro?plano=' + plano} className="sp-contract-cta">Começar teste grátis <span>→</span></Link>
        </div>
      </section>
      <footer className="sp-contract-footer"><span>OFÍCIO DO MOTOR</span><span>Gestão para oficinas de motocicletas</span><span>© {new Date().getFullYear()}</span></footer>
    </main>
  )
}
