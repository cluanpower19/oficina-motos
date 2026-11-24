import { Link } from 'react-router-dom'
import TourGuiado from './TourGuiado'
import './site-publico.css'

const recursos = [
  { numero: '01', titulo: 'Clientes e motocicletas', texto: 'Encontre os dados de cada cliente e de cada moto quando precisar.', detalhe: 'Relacionamento' },
  { numero: '02', titulo: 'Ordens de serviço', texto: 'Veja o que já foi feito, o que está em andamento e o que falta entregar.', detalhe: 'Operação' },
  { numero: '03', titulo: 'Orçamentos por link', texto: 'Mande o link pelo WhatsApp. Seu cliente abre e confere o orçamento sem complicação.', detalhe: 'Atendimento' },
  { numero: '04', titulo: 'Catálogo de serviços', texto: 'Deixe os serviços que você mais faz salvos e monte orçamentos mais rápido.', detalhe: 'Produtividade' },
  { numero: '05', titulo: 'Peças e estoque', texto: 'Saiba o que tem na prateleira e quais peças foram usadas em cada serviço.', detalhe: 'Estoque' },
  { numero: '06', titulo: 'Financeiro e lembretes', texto: 'Confira o que tem para receber e não deixe passar a hora de falar com um cliente.', detalhe: 'Gestão' },
]

const duvidas = [
  ['O sistema é feito para oficina de motos?', 'Sim! O sistema foi pensado para a rotina de quem trabalha com motos.'],
  ['Preciso instalar no computador?', 'Não precisa instalar no computador. É só abrir pelo navegador. Também temos aplicativo Android para usar no celular.'],
  ['Posso cadastrar meus mecânicos?', 'Pode, sim. Você paga por oficina, não por funcionário. Assim, sua equipe também pode usar o sistema.'],
  ['O cliente precisa criar uma conta para ver o orçamento?', 'Não precisa criar conta. É só enviar o link do orçamento para ele consultar.'],
  ['Posso mudar de plano depois?', 'Claro. É só chamar a nossa equipe que a gente orienta você na mudança.'],
]

function Seta() {
  return <span aria-hidden="true" className="sp-arrow">↗</span>
}

export default function SitePublico() {
  return (
    <div className="site-publico">
      <header className="sp-header">
        <a href="#inicio" className="sp-brand" aria-label="Ofício do Motor — início">
          <span className="sp-brand-mark">OM<span>·</span></span>
          <span className="sp-brand-copy"><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span>
        </a>
        <nav className="sp-nav" aria-label="Navegação principal">
          <a href="#visao">A proposta</a>
          <a href="#tour">Tour guiado</a>
          <a href="#recursos">Funcionalidades</a>
          <a href="#planos">Planos</a>
          <a href="#duvidas">Dúvidas</a>
        </nav>
        <Link to="/entrar" className="sp-header-cta" aria-label="Já sou cliente? Entrar">Entrar <Seta /></Link>
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
              <a href="#tour" className="sp-button sp-button-primary">Fazer um tour pelo sistema <Seta /></a>
              <a href="#recursos" className="sp-button sp-button-ghost">Explorar funcionalidades <span aria-hidden="true">↓</span></a>
            </div>
            <div className="sp-hero-foot"><span>01 / SUA OFICINA, MAIS ORGANIZADA</span><span>CLIENTES · MOTOS · SERVIÇOS</span></div>
          </div>
          <div className="sp-hero-side-note"><span className="sp-side-line" /> FEITO PARA QUEM CUIDA DE MOTOS</div>
        </section>

        <section className="sp-intro" id="visao">
          <div className="sp-section-kicker"><span>01</span> MAIS TEMPO PARA O QUE IMPORTA</div>
          <div className="sp-intro-grid">
            <h2>Menos tempo atrás de informação.<br /><em>Mais tempo na oficina.</em></h2>
            <div className="sp-intro-copy"><p>A gente sabe: oficina tem serviço chegando, cliente perguntando e prazo para cumprir. Organizar tudo isso não deveria dar ainda mais trabalho.</p><p>Por isso, reunimos clientes, motos, orçamentos e ordens de serviço em um só lugar. Assim, fica mais fácil saber o que está acontecendo em cada atendimento.</p><a className="sp-text-link" href="#recursos">Veja como funciona na prática <Seta /></a></div>
          </div>
        </section>

        <section className="sp-editorial">
          <div className="sp-editorial-photo"><img src="/img/oficina-noite.jpg" alt="Mecânico trabalhando na manutenção de uma motocicleta em uma oficina" loading="lazy" /><span className="sp-photo-caption">A ROTINA REAL DA OFICINA, COM MAIS CONTROLE.</span></div>
          <div className="sp-editorial-copy"><div className="sp-section-kicker"><span>02</span> PARA FACILITAR SUA ROTINA</div><h2>Você já tem trabalho demais.<br /><em>Deixe a organização mais leve.</em></h2><p>Chega de procurar informação em papel, conversa de WhatsApp e caderno. Deixe os dados dos clientes, as motos e os serviços reunidos para encontrar tudo mais fácil.</p><div className="sp-proof-list"><div><b>01</b><span>O histórico de cada cliente e moto</span></div><div><b>02</b><span>Cada serviço no seu lugar</span></div><div><b>03</b><span>Orçamentos para enviar pelo WhatsApp</span></div></div></div>
        </section>

        <TourGuiado />

        <section id="recursos" className="sp-features">
          <div className="sp-section-kicker"><span>04</span> O QUE VOCÊ PRECISA NO DIA A DIA</div>
          <div className="sp-section-heading"><h2>Do primeiro atendimento<br /><em>até a entrega da moto.</em></h2><p>O que você precisa para cuidar dos clientes, acompanhar os serviços e manter a oficina em ordem.</p></div>
          <div className="sp-feature-grid">
            {recursos.map((r) => <article className="sp-feature" key={r.numero}><div className="sp-feature-top"><span>{r.numero}</span><small>{r.detalhe}</small></div><h3>{r.titulo}</h3><p>{r.texto}</p><div className="sp-feature-rule" /></article>)}
          </div>
          <div className="sp-feature-bottom"><span>TUDO JUNTO, SEM COMPLICAÇÃO.</span><a href="#planos">Veja os planos <Seta /></a></div>
        </section>

        <section className="sp-photo-break" aria-label="Oficina e motocicleta">
          <img src="/img/bancada.jpg" alt="Profissional preparando uma motocicleta em uma oficina" loading="lazy" />
          <div className="sp-photo-break-overlay" />
          <div className="sp-photo-break-copy"><span>OFÍCIO DO MOTOR / FILOSOFIA</span><p>O trabalho é artesanal.<br /><em>A organização pode ser extraordinária.</em></p></div>
        </section>

        <section id="planos" className="sp-pricing">
          <div className="sp-section-kicker"><span>05</span> ESCOLHA O QUE FAZ SENTIDO</div>
          <div className="sp-section-heading"><h2>Um plano para o momento<br /><em>da sua oficina.</em></h2><p>Você paga por oficina e pode incluir sua equipe, sem cobrança por funcionário.</p></div>
          <div className="sp-plan-grid">
            <article className="sp-plan"><div className="sp-plan-label">ESSENCIAL</div><h3>Básico</h3><p className="sp-plan-price">R$ 49,90 <small>/ mês</small></p><p className="sp-plan-desc">Para colocar os atendimentos e serviços em ordem.</p><ul><li>Cadastro de clientes e motos</li><li>Ordens de serviço</li><li>Orçamentos por link</li><li>Catálogo de serviços</li><li>Acesso para equipe incluído</li></ul><a href="#tour" className="sp-button sp-button-outline">Conhecer o plano Básico <Seta /></a></article>
            <article className="sp-plan sp-plan-featured"><div className="sp-plan-label">GESTÃO AMPLIADA</div><h3>Completo</h3><p className="sp-plan-price">R$ 79,90 <small>/ mês</small></p><p className="sp-plan-desc">Para quem quer cuidar também das peças e do financeiro.</p><ul><li>Tudo do plano Básico</li><li>Controle de peças e estoque</li><li>Lembretes de manutenção</li><li>Controle financeiro</li><li>Fotos nas ordens de serviço</li><li>Acesso para equipe incluído</li></ul><a href="#tour" className="sp-button sp-button-primary">Conhecer o plano Completo <Seta /></a></article>
          </div>
          <p className="sp-pricing-note">Preços sugeridos de lançamento. A contratação e ativação são confirmadas pela equipe. Recursos e condições podem ser ajustados antes da publicação comercial definitiva.</p>
          <p className="sp-custom">Quer tirar uma dúvida antes de decidir? <a href="#duvidas">Veja as respostas mais comuns.</a></p>
        </section>

        <section id="duvidas" className="sp-faq">
          <div className="sp-section-kicker"><span>06</span> AINDA TEM DÚVIDAS?</div>
          <div className="sp-faq-grid"><h2>Vamos conversar<br /><em>antes de começar?</em></h2><div className="sp-faq-list">{duvidas.map(([q, a]) => <details key={q}><summary>{q}<span>＋</span></summary><p>{a}</p></details>)}</div></div>
        </section>

        <section className="sp-final">
          <img src="/img/moto-cafe.jpg" alt="" loading="lazy" />
          <div className="sp-final-overlay" />
          <div className="sp-final-content"><div className="sp-section-kicker"><span>07</span> VAMOS COMEÇAR?</div><h2>Você cuida das motos.<br /><em>A gente ajuda com a organização.</em></h2><p>Dê uma olhada no sistema e veja se ele combina com o jeito que sua oficina trabalha. Se precisar, estamos por aqui.</p><div className="sp-hero-actions"><a href="#tour" className="sp-button sp-button-primary">Conhecer o sistema por dentro <Seta /></a><Link to="/entrar" className="sp-button sp-button-ghost">Já tenho cadastro · Entrar <Seta /></Link></div></div>
        </section>
      </main>

      <footer className="sp-footer"><a href="#inicio" className="sp-brand"><span className="sp-brand-mark">OM<span>·</span></span><span className="sp-brand-copy"><strong>OFÍCIO DO MOTOR</strong><small>GESTÃO PARA OFICINAS DE MOTOS</small></span></a><p>© {new Date().getFullYear()} Ofício do Motor. Feito para facilitar a rotina da sua oficina.</p><a href="#inicio">VOLTAR AO TOPO ↑</a></footer>
    </div>
  )
}
