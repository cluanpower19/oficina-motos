import { useState } from 'react'
import { Link } from 'react-router-dom'
import TourGuiado from './TourGuiado'
import DemoInterativa from './DemoInterativa'
import './site-publico.css'

const recursos = [
  { numero: '01', titulo: 'Clientes e motocicletas', texto: 'Encontre os dados de cada cliente e de cada moto quando precisar.', detalhe: 'Relacionamento' },
  { numero: '02', titulo: 'Ordens de serviço', texto: 'Veja o que já foi feito, o que está em andamento e o que falta entregar.', detalhe: 'Operação' },
  { numero: '03', titulo: 'Orçamentos por link', texto: 'Mande o link pelo WhatsApp. Seu cliente abre, confere e responde sem criar uma conta.', detalhe: 'Atendimento' },
  { numero: '04', titulo: 'Catálogo de serviços', texto: 'Deixe os serviços que você mais faz salvos e monte orçamentos mais rápido.', detalhe: 'Produtividade' },
  { numero: '05', titulo: 'Peças e estoque', texto: 'Saiba o que tem na prateleira e acompanhe as peças usadas nos serviços.', detalhe: 'Estoque' },
  { numero: '06', titulo: 'Financeiro e lembretes', texto: 'Confira valores a receber e organize os próximos contatos com seus clientes.', detalhe: 'Gestão' },
]

const duvidas = [
  ['O sistema é feito para oficina de motos?', 'Sim. O Ofício do Motor reúne clientes, motocicletas, orçamentos e ordens de serviço em um fluxo pensado para a rotina de uma oficina de motos.'],
  ['O cliente precisa criar uma conta para ver o orçamento?', 'Não. Você envia um link e o cliente pode consultar os itens, ver o total e aprovar ou recusar o orçamento sem criar uma conta.'],
  ['Preciso instalar no computador?', 'Não precisa instalar no computador. O sistema abre pelo navegador. Também existe aplicativo Android para usar no celular.'],
  ['Posso cadastrar meus mecânicos?', 'Sim. O dono pode cadastrar a equipe para acessar a oficina usando o código de convite. A cobrança é por oficina, não por funcionário.'],
  ['Como começo a usar?', 'Escolha um plano e solicite a contratação. Você recebe o contrato para ler e formalizar antes de pagar via PIX. Depois da confirmação do pagamento, a equipe orienta o cadastro e a ativação da oficina.'],
  ['Posso mudar de plano depois?', 'Pode solicitar a mudança pelo módulo Suporte e melhorias, dentro do sistema. A equipe orienta sobre os recursos e as condições do novo plano.'],
]

const navegacao = [
  ['#visao', 'A proposta'],
  ['#como-funciona', 'Como funciona'],
  ['#demo', 'Experimentar'],
  ['#tour', 'Tour guiado'],
  ['#recursos', 'Funcionalidades'],
  ['#planos', 'Planos'],
  ['#duvidas', 'Dúvidas'],
]

function Seta() {
  return <span aria-hidden="true" className="sp-arrow">↗</span>
}

export default function SitePublico() {
  const [menuAberto, setMenuAberto] = useState(false)
  const fecharMenu = () => setMenuAberto(false)

  return (
    <div className="site-publico">
      <header className="sp-header">
        <a href="#inicio" className="sp-brand" aria-label="Ofício do Motor — início" onClick={fecharMenu}>
          <span className="sp-brand-mark">OM<span>·</span></span>
          <span className="sp-brand-copy"><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span>
        </a>
        <nav id="sp-site-nav" className={`sp-nav ${menuAberto ? 'is-open' : ''}`} aria-label="Navegação principal">
          {navegacao.map(([href, label]) => <a href={href} key={href} onClick={fecharMenu}>{label}</a>)}
        </nav>
        <div className="sp-header-actions">
          <button type="button" className="sp-menu-toggle" aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuAberto} aria-controls="sp-site-nav" onClick={() => setMenuAberto((v) => !v)}>
            <span /><span /><span />
          </button>
          <Link to="/entrar" className="sp-header-cta" aria-label="Já sou cliente? Entrar">Entrar <Seta /></Link>
        </div>
      </header>

      <main>
        <section id="inicio" className="sp-hero">
          <img className="sp-hero-photo" src="/img/moto-cafe.jpg" alt="Motocicleta clássica em uma garagem, sob iluminação dramática" fetchPriority="high" />
          <div className="sp-hero-shade" />
          <div className="sp-hero-grain" aria-hidden="true" />
          <div className="sp-hero-content">
            <p className="sp-eyebrow"><span /> FEITO PARA QUEM VIVE A OFICINA</p>
            <h1>Sua oficina tem muito trabalho.<br /><em>A gente ajuda a organizar.</em></h1>
            <p className="sp-hero-lead">Você cuida das motos e dos clientes. O Ofício do Motor ajuda a deixar o resto em ordem, sem complicar seu dia.</p>
            <div className="sp-hero-actions">
              <a href="#demo" className="sp-button sp-button-primary">Experimentar o sistema <Seta /></a>
              <a href="#como-funciona" className="sp-button sp-button-ghost">Entender como funciona <span aria-hidden="true">↓</span></a>
            </div>
            <div className="sp-hero-foot"><span>01 / SUA OFICINA, MAIS ORGANIZADA</span><span>CLIENTES · MOTOS · SERVIÇOS</span></div>
          </div>
          <div className="sp-hero-side-note"><span className="sp-side-line" /> FEITO PARA QUEM CUIDA DE MOTOS</div>
        </section>

        <section className="sp-intro" id="visao">
          <div className="sp-section-kicker"><span>01</span> MAIS TEMPO PARA O QUE IMPORTA</div>
          <div className="sp-intro-grid">
            <h2>Menos tempo atrás de informação.<br /><em>Mais tempo na oficina.</em></h2>
            <div className="sp-intro-copy"><p>A gente sabe: oficina tem serviço chegando, cliente perguntando e prazo para cumprir. Organizar tudo isso não deveria dar ainda mais trabalho.</p><p>Por isso, reunimos clientes, motos, orçamentos e ordens de serviço em um só lugar. Assim, fica mais fácil saber o que está acontecendo em cada atendimento.</p><a className="sp-text-link" href="#como-funciona">Veja o fluxo de trabalho <Seta /></a></div>
          </div>
        </section>

        <section id="como-funciona" className="sp-flow">
          <div className="sp-section-kicker"><span>02</span> UM FLUXO SIMPLES DE ACOMPANHAR</div>
          <div className="sp-flow-heading"><h2>Da chegada da moto<br /><em>até a entrega.</em></h2><p>As informações ficam conectadas. Você registra o atendimento uma vez e acompanha a evolução sem precisar reconstruir a história em vários lugares.</p></div>
          <div className="sp-flow-grid">
            <article className="sp-flow-card"><span>01</span><div className="sp-flow-icon" aria-hidden="true">⌕</div><h3>Cadastre cliente e moto</h3><p>Guarde os dados e encontre o histórico pelo nome do cliente ou pela placa.</p><small>CLIENTES · MOTOCICLETAS</small></article>
            <article className="sp-flow-card"><span>02</span><div className="sp-flow-icon" aria-hidden="true">▤</div><h3>Monte a ordem de serviço</h3><p>Adicione serviços, valores e atualize o status conforme o trabalho avança.</p><small>ORÇAMENTO · EXECUÇÃO</small></article>
            <article className="sp-flow-card"><span>03</span><div className="sp-flow-icon" aria-hidden="true">↗</div><h3>Compartilhe com o cliente</h3><p>Envie o orçamento por link no WhatsApp. O cliente consulta e responde sem criar conta.</p><small>APROVAÇÃO · ENTREGA</small></article>
          </div>
          <div className="sp-flow-foot"><span>UM ATENDIMENTO, DO COMEÇO AO FIM.</span><a href="#tour">Veja esse fluxo no tour guiado <Seta /></a></div>
        </section>

        <section className="sp-editorial">
          <div className="sp-editorial-photo"><img src="/img/oficina-noite.jpg" alt="Mecânico trabalhando na manutenção de uma motocicleta em uma oficina" loading="lazy" /><span className="sp-photo-caption">A ROTINA REAL DA OFICINA, COM MAIS CONTROLE.</span></div>
          <div className="sp-editorial-copy"><div className="sp-section-kicker"><span>03</span> PARA FACILITAR SUA ROTINA</div><h2>Você já tem trabalho demais.<br /><em>Deixe a organização mais leve.</em></h2><p>Chega de procurar informação em papel, conversa de WhatsApp e caderno. Deixe os dados dos clientes, as motos e os serviços reunidos para encontrar tudo mais fácil.</p><div className="sp-proof-list"><div><b>01</b><span>O histórico de cada cliente e moto</span></div><div><b>02</b><span>Cada serviço no seu lugar</span></div><div><b>03</b><span>Orçamentos para enviar pelo WhatsApp</span></div></div></div>
        </section>

        <DemoInterativa />

        <TourGuiado />

        <section className="sp-trust-strip" aria-label="Destaques do Ofício do Motor">
          <div><b>SEM CONTA PARA O CLIENTE</b><span>O orçamento abre pelo link.</span></div>
          <div><b>HISTÓRICO POR PLACA</b><span>Encontre o atendimento da moto.</span></div>
          <div><b>STATUS DA ORDEM</b><span>Acompanhe cada etapa do serviço.</span></div>
          <div><b>SUPORTE NO SISTEMA</b><span>Envie dúvidas e acompanhe respostas.</span></div>
        </section>

        <section id="recursos" className="sp-features">
          <div className="sp-section-kicker"><span>05</span> O QUE VOCÊ PRECISA NO DIA A DIA</div>
          <div className="sp-section-heading"><h2>Do primeiro atendimento<br /><em>até a entrega da moto.</em></h2><p>O que você precisa para cuidar dos clientes, acompanhar os serviços e manter a oficina em ordem.</p></div>
          <div className="sp-feature-grid">
            {recursos.map((r) => <article className="sp-feature" key={r.numero}><div className="sp-feature-top"><span>{r.numero}</span><small>{r.detalhe}</small></div><h3>{r.titulo}</h3><p>{r.texto}</p><div className="sp-feature-rule" /></article>)}
          </div>
          <div className="sp-feature-bottom"><span>TUDO JUNTO, SEM COMPLICAÇÃO.</span><a href="#planos">Compare os planos <Seta /></a></div>
        </section>

        <section className="sp-photo-break" aria-label="Oficina e motocicleta">
          <img src="/img/bancada.jpg" alt="Profissional preparando uma motocicleta em uma oficina" loading="lazy" />
          <div className="sp-photo-break-overlay" />
          <div className="sp-photo-break-copy"><span>OFÍCIO DO MOTOR / FILOSOFIA</span><p>O trabalho é artesanal.<br /><em>A organização pode ser extraordinária.</em></p></div>
        </section>

        <section id="planos" className="sp-pricing">
          <div className="sp-section-kicker"><span>06</span> ESCOLHA O QUE FAZ SENTIDO</div>
          <div className="sp-section-heading"><h2>Um plano para o momento<br /><em>da sua oficina.</em></h2><p>Você paga por oficina e pode incluir sua equipe, sem cobrança por funcionário.</p></div>
          <div className="sp-plan-grid">
            <article className="sp-plan"><div className="sp-plan-label">ESSENCIAL</div><h3>Básico</h3><p className="sp-plan-price">R$ 49,90 <small>/ mês</small></p><p className="sp-plan-desc">Para colocar os atendimentos e serviços em ordem.</p><ul><li>Cadastro de clientes e motos</li><li>Ordens de serviço</li><li>Orçamentos por link</li><li>Catálogo de serviços</li><li>Acesso para equipe incluído</li></ul><Link to="/contratar?plano=basico" className="sp-button sp-button-outline">Solicitar contratação <Seta /></Link></article>
            <article className="sp-plan sp-plan-featured"><div className="sp-plan-label">GESTÃO AMPLIADA</div><h3>Completo</h3><p className="sp-plan-price">R$ 79,90 <small>/ mês</small></p><p className="sp-plan-desc">Para quem quer cuidar também das peças e do financeiro.</p><ul><li>Tudo do plano Básico</li><li>Controle de peças e estoque</li><li>Lembretes de manutenção</li><li>Controle financeiro</li><li>Fotos nas ordens de serviço</li><li>Acesso para equipe incluído</li></ul><Link to="/contratar?plano=completo" className="sp-button sp-button-primary">Solicitar contratação <Seta /></Link></article>
          </div>
          <p className="sp-pricing-note">Valores mensais via PIX. Vencimento na data de ativação, com cinco dias corridos de tolerância. Sem fidelidade ou multa de cancelamento. O contrato é enviado para leitura e formalização antes do pagamento.</p>
          <div className="sp-start-panel"><div><span>PRONTO PARA DAR O PRÓXIMO PASSO?</span><h3>Receba o contrato antes de pagar.</h3><p>Escolha seu plano, confira as condições e formalize a contratação. O cadastro da oficina é orientado após a confirmação do PIX.</p></div><Link to="/contratar" className="sp-button sp-button-primary">Solicitar contratação <Seta /></Link></div>
        </section>

        <section id="duvidas" className="sp-faq">
          <div className="sp-section-kicker"><span>07</span> AINDA TEM DÚVIDAS?</div>
          <div className="sp-faq-grid"><h2>Vamos conversar<br /><em>antes de começar?</em></h2><div className="sp-faq-list">{duvidas.map(([q, a]) => <details key={q}><summary>{q}<span>＋</span></summary><p>{a}</p></details>)}</div></div>
        </section>

        <section className="sp-final">
          <img src="/img/moto-cafe.jpg" alt="" loading="lazy" />
          <div className="sp-final-overlay" />
          <div className="sp-final-content"><div className="sp-section-kicker"><span>08</span> VAMOS COMEÇAR?</div><h2>Você cuida das motos.<br /><em>A gente ajuda com a organização.</em></h2><p>Experimente a demonstração, escolha seu plano e receba o contrato para conferir antes de qualquer pagamento.</p><div className="sp-hero-actions"><Link to="/contratar" className="sp-button sp-button-primary">Solicitar contratação <Seta /></Link><a href="#tour" className="sp-button sp-button-ghost">Rever o tour guiado</a><Link to="/entrar" className="sp-button sp-button-ghost">Já sou cliente · Entrar <Seta /></Link></div></div>
        </section>
      </main>

      <footer className="sp-footer"><a href="#inicio" className="sp-brand"><span className="sp-brand-mark">OM<span>·</span></span><span className="sp-brand-copy"><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span></a><p>© {new Date().getFullYear()} Ofício do Motor. Feito para facilitar a rotina da sua oficina.</p><a href="#inicio">VOLTAR AO TOPO ↑</a></footer>
    </div>
  )
}
