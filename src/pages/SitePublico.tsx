import { useState } from 'react'
import { Link } from 'react-router-dom'
import TourGuiado from './TourGuiado'
import DemoInterativa from './DemoInterativa'
import './site-publico.css'

const recursos = [
  { numero: '01', titulo: 'Clientes e motocicletas', texto: 'Cadastre clientes e motos e encontre o histórico pelo nome ou pela placa.', detalhe: 'Relacionamento' },
  { numero: '02', titulo: 'Ordens de serviço', texto: 'Acompanhe cada serviço, do orçamento à entrega da motocicleta.', detalhe: 'Operação' },
  { numero: '03', titulo: 'Orçamentos por link', texto: 'Envie o orçamento pelo WhatsApp. O cliente consulta e responde sem criar uma conta.', detalhe: 'Atendimento' },
  { numero: '04', titulo: 'Catálogo de serviços', texto: 'Salve os serviços mais usados e monte novos orçamentos com menos etapas.', detalhe: 'Produtividade' },
  { numero: '05', titulo: 'Peças e estoque', texto: 'Acompanhe as peças disponíveis e o que foi usado em cada serviço.', detalhe: 'Estoque' },
  { numero: '06', titulo: 'Financeiro e lembretes', texto: 'Veja o que tem a receber e organize os próximos contatos com seus clientes.', detalhe: 'Gestão' },
]

const duvidas = [
  ['O sistema foi feito para oficina de motos?', 'Sim. Clientes, motocicletas, orçamentos e ordens de serviço foram reunidos para acompanhar a rotina de uma oficina de motos.'],
  ['Meu cliente precisa criar uma conta para ver o orçamento?', 'Não. Você envia um link pelo WhatsApp. O cliente abre, confere os itens e o total e pode aprovar ou recusar, sem fazer cadastro.'],
  ['Preciso instalar no computador?', 'Não. Você acessa pelo navegador, sem instalar nada no computador. Também há aplicativos para Windows e Android.'],
  ['Posso incluir meus mecânicos?', 'Sim. Convide sua equipe para acessar a oficina com um código. A cobrança é por oficina, não por funcionário.'],
  ['Como funciona o teste grátis?', 'Escolha um plano, crie sua conta e confirme seu e-mail. Os sete dias começam no primeiro acesso depois da confirmação. Não pedimos cartão nem pagamento antecipado.'],
  ['Posso mudar de plano depois?', 'Pode solicitar a mudança pelo suporte, dentro do próprio sistema. A equipe orienta você sobre os recursos e as condições.'],
]

const navegacao = [
  ['#visao', 'Benefícios'],
  ['#como-funciona', 'Como funciona'],
  ['#demo', 'Demonstração'],
  ['#tour', 'Tour'],
  ['#recursos', 'Recursos'],
  ['#planos', 'Planos'],
  ['#duvidas', 'Perguntas'],
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
            <p className="sp-eyebrow"><span /> GESTÃO FEITA PARA A ROTINA DA OFICINA</p>
            <h1>Sua oficina em ordem.<br /><em>Seu dia mais leve.</em></h1>
            <p className="sp-hero-lead">Clientes, motos, orçamentos e ordens de serviço ficam no mesmo lugar. Você acompanha cada atendimento sem se perder em papéis ou conversas.</p>
            <div className="sp-hero-actions">
              <a href="#demo" className="sp-button sp-button-primary">Conhecer o sistema <Seta /></a>
              <a href="#como-funciona" className="sp-button sp-button-ghost">Entender como funciona <span aria-hidden="true">↓</span></a>
            </div>
            <div className="sp-hero-foot"><span>7 DIAS GRÁTIS · SEM CARTÃO</span><span>CLIENTES · MOTOS · ORÇAMENTOS · SERVIÇOS</span></div>
          </div>
          <div className="sp-hero-side-note"><span className="sp-side-line" /> FEITO PARA QUEM CUIDA DE MOTOS</div>
        </section>

        <section className="sp-intro" id="visao">
          <div className="sp-section-kicker"><span>01</span> INFORMAÇÃO NO LUGAR CERTO</div>
          <div className="sp-intro-grid">
            <h2>Saiba o que está acontecendo.<br /><em>Sem perder tempo procurando.</em></h2>
            <div className="sp-intro-copy"><p>Na correria da oficina, uma informação perdida pode atrasar o serviço. Por isso, clientes, motos, orçamentos e ordens ficam reunidos em um só lugar.</p><p>Consulte o histórico, veja o que já foi combinado e acompanhe o que falta fazer. Você e sua equipe trabalham com a mesma informação.</p><a className="sp-text-link" href="#como-funciona">Entenda o passo a passo <Seta /></a></div>
          </div>
        </section>

        <section id="como-funciona" className="sp-flow">
          <div className="sp-section-kicker"><span>02</span> DO PRIMEIRO CONTATO À ENTREGA</div>
          <div className="sp-flow-heading"><h2>Um caminho claro,<br /><em>do início ao fim.</em></h2><p>Registre o atendimento, monte o orçamento e acompanhe cada etapa. Assim, fica mais fácil saber qual é o próximo passo.</p></div>
          <div className="sp-flow-grid">
            <article className="sp-flow-card"><span>01</span><div className="sp-flow-icon" aria-hidden="true">⌕</div><h3>Registre o cliente e a moto</h3><p>Cadastre os dados uma vez e encontre o histórico pelo nome ou pela placa.</p><small>CLIENTES · MOTOCICLETAS</small></article>
            <article className="sp-flow-card"><span>02</span><div className="sp-flow-icon" aria-hidden="true">▤</div><h3>Monte a ordem de serviço</h3><p>Inclua serviços e valores e atualize a ordem conforme o trabalho avança.</p><small>ORÇAMENTO · EXECUÇÃO</small></article>
            <article className="sp-flow-card"><span>03</span><div className="sp-flow-icon" aria-hidden="true">↗</div><h3>Compartilhe com o cliente</h3><p>Compartilhe o link pelo WhatsApp. O cliente confere o orçamento e responde sem criar conta.</p><small>APROVAÇÃO · ENTREGA</small></article>
          </div>
          <div className="sp-flow-foot"><span>UM ATENDIMENTO, DO COMEÇO AO FIM.</span><a href="#tour">Veja esse fluxo no tour guiado <Seta /></a></div>
        </section>

        <section className="sp-editorial">
          <div className="sp-editorial-photo"><img src="/img/oficina-noite.jpg" alt="Mecânico trabalhando na manutenção de uma motocicleta em uma oficina" loading="lazy" /><span className="sp-photo-caption">A ROTINA REAL DA OFICINA, COM MAIS CONTROLE.</span></div>
          <div className="sp-editorial-copy"><div className="sp-section-kicker"><span>03</span> MENOS PAPELADA NO DIA A DIA</div><h2>Mais clareza para tocar a oficina.<br /><em>Menos tempo procurando informação.</em></h2><p>Encontre os dados do cliente, o histórico da moto e o que foi combinado para cada serviço. Tudo fica registrado para você não depender de papéis, cadernos ou conversas antigas.</p><div className="sp-proof-list"><div><b>01</b><span>O histórico de cada cliente e moto</span></div><div><b>02</b><span>Cada serviço no seu lugar</span></div><div><b>03</b><span>Orçamentos para enviar pelo WhatsApp</span></div></div></div>
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
          <div className="sp-section-kicker"><span>05</span> FERRAMENTAS PARA O TRABALHO DE TODO DIA</div>
          <div className="sp-section-heading"><h2>O essencial para cuidar<br /><em>de cada atendimento.</em></h2><p>Recursos práticos para acompanhar clientes, serviços, peças e o financeiro da oficina.</p></div>
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
          <div className="sp-section-kicker"><span>06</span> PLANOS SIMPLES, SEM SURPRESA</div>
          <div className="sp-section-heading"><h2>Comece pelo essencial.<br /><em>Amplie quando precisar.</em></h2><p>Escolha o plano que combina com a sua rotina. O valor é por oficina, sem cobrança por funcionário.</p></div>
          <div className="sp-plan-grid">
            <article className="sp-plan"><div className="sp-plan-label">ESSENCIAL</div><h3>Básico</h3><p className="sp-plan-price">R$ 49,90 <small>/ mês</small></p><p className="sp-plan-desc">Para organizar clientes, motos e ordens de serviço.</p><ul><li>Cadastro de clientes e motos</li><li>Ordens de serviço</li><li>Orçamentos por link</li><li>Catálogo de serviços</li><li>Acesso para equipe incluído</li></ul><Link to="/cadastro?plano=basico" className="sp-button sp-button-outline">Testar o Básico por 7 dias <Seta /></Link></article>
            <article className="sp-plan sp-plan-featured"><div className="sp-plan-label">GESTÃO AMPLIADA</div><h3>Completo</h3><p className="sp-plan-price">R$ 79,90 <small>/ mês</small></p><p className="sp-plan-desc">Para acompanhar também o estoque, os lembretes e o financeiro.</p><ul><li>Tudo do plano Básico</li><li>Controle de peças e estoque</li><li>Lembretes de manutenção</li><li>Controle financeiro</li><li>Fotos nas ordens de serviço</li><li>Acesso para equipe incluído</li></ul><Link to="/cadastro?plano=completo" className="sp-button sp-button-primary">Testar o Completo por 7 dias <Seta /></Link></article>
          </div>
          <p className="sp-pricing-note">Use o plano escolhido por sete dias, sem cartão e sem pagamento antecipado. O teste começa depois que você confirma o e-mail e faz o primeiro acesso. Ao final, você decide se quer continuar com a assinatura mensal.</p>
          <div className="sp-start-panel"><div><span>COMECE SEM COMPROMISSO</span><h3>Conheça o sistema por 7 dias.</h3><p>Escolha um plano e use os recursos na rotina da sua oficina. Não pedimos cartão nem pagamento antecipado.</p></div><Link to="/cadastro" className="sp-button sp-button-primary">Criar minha conta <Seta /></Link></div>
        </section>

        <section id="duvidas" className="sp-faq">
          <div className="sp-section-kicker"><span>07</span> PERGUNTAS FREQUENTES</div>
          <div className="sp-faq-grid"><h2>Respostas claras<br /><em>para decidir com calma.</em></h2><div className="sp-faq-list">{duvidas.map(([q, a]) => <details key={q}><summary>{q}<span>＋</span></summary><p>{a}</p></details>)}</div></div>
        </section>

        <section className="sp-final">
          <img src="/img/moto-cafe.jpg" alt="" loading="lazy" />
          <div className="sp-final-overlay" />
          <div className="sp-final-content"><div className="sp-section-kicker"><span>08</span> SUA OFICINA PODE FICAR MAIS ORGANIZADA</div><h2>Cuide dos serviços.<br /><em>Deixe o controle com o sistema.</em></h2><p>Experimente por sete dias, sem cartão e sem pagamento antecipado. Veja como o sistema funciona na rotina da sua oficina.</p><div className="sp-hero-actions"><Link to="/cadastro" className="sp-button sp-button-primary">Começar grátis <Seta /></Link><a href="#tour" className="sp-button sp-button-ghost">Rever o tour guiado</a><Link to="/entrar" className="sp-button sp-button-ghost">Já sou cliente · Entrar <Seta /></Link></div></div>
        </section>
      </main>

      <footer className="sp-footer"><a href="#inicio" className="sp-brand"><span className="sp-brand-mark">OM<span>·</span></span><span className="sp-brand-copy"><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span></a><p>© {new Date().getFullYear()} Ofício do Motor. Organização simples para acompanhar cada serviço, do começo à entrega.</p><a href="#inicio">VOLTAR AO TOPO ↑</a></footer>
    </div>
  )
}
