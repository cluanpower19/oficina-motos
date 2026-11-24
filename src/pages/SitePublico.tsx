import { Link } from 'react-router-dom'
import { Emblema, MotoSilhueta } from '../components/Cenario'

const recursos = [
  { numero: '01', titulo: 'Clientes e motos', texto: 'Encontre rapidamente o cadastro, os dados e o histórico de cada veículo.' },
  { numero: '02', titulo: 'Ordens de serviço', texto: 'Organize os serviços, acompanhe etapas e mantenha cada atendimento registrado.' },
  { numero: '03', titulo: 'Orçamentos por link', texto: 'Compartilhe o orçamento pelo WhatsApp para o cliente consultar e responder.' },
  { numero: '04', titulo: 'Catálogo de serviços', texto: 'Padronize os serviços e agilize a preparação dos orçamentos.' },
  { numero: '05', titulo: 'Peças e estoque', texto: 'Controle produtos, quantidades e utilização de peças nas ordens de serviço.' },
  { numero: '06', titulo: 'Financeiro e lembretes', texto: 'Acompanhe valores a receber e facilite o contato de retorno com seus clientes.' },
]

const duvidas = [
  ['O sistema é para oficina de motos?', 'Sim. O Ofício do Motor foi pensado para a rotina de oficinas de motocicletas.'],
  ['Preciso instalar no computador?', 'O sistema funciona pelo navegador. Também existe aplicativo Android para acesso pelo celular.'],
  ['Posso cadastrar meus mecânicos?', 'Sim. A cobrança é por oficina, não por funcionário. A equipe utiliza o acesso vinculado à oficina.'],
  ['O cliente precisa criar uma conta para ver o orçamento?', 'Não. O orçamento pode ser compartilhado por um link para consulta do cliente.'],
  ['Posso mudar de plano depois?', 'Você pode solicitar a mudança de plano pelo atendimento do Ofício do Motor.'],
]

export default function SitePublico() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#080d14] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080d14]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <Emblema tamanho={44} />
            <span className="leading-tight"><strong className="block text-lg tracking-wide">OFÍCIO DO MOTOR</strong><small className="text-[10px] uppercase tracking-[.22em] text-orange-400">Gestão para oficinas</small></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a href="#beneficios" className="hover:text-orange-300">Benefícios</a>
            <a href="#funcionalidades" className="hover:text-orange-300">Funcionalidades</a>
            <a href="#planos" className="hover:text-orange-300">Planos</a>
            <a href="#duvidas" className="hover:text-orange-300">Dúvidas</a>
          </nav>
          <Link to="/entrar" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-[#17130f]">Acessar sistema</Link>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative isolate border-b border-white/5">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_30%,rgba(242,160,61,.15),transparent_42%),radial-gradient(ellipse_at_15%_75%,rgba(31,111,120,.18),transparent_40%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-[1.02fr_.98fr] md:px-8 md:py-24">
            <div className="space-y-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em] text-orange-300"><span className="h-2 w-2 rounded-full bg-orange-400" /> Gestão feita para oficina de motos</p>
              <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-tight text-white md:text-6xl">Sua oficina organizada. <span className="text-orange-400">Seus serviços sob controle.</span></h1>
              <p className="max-w-xl text-lg leading-8 text-slate-300">Chega de depender de papel, conversas perdidas e anotações espalhadas. Organize clientes, motos, orçamentos e ordens de serviço em um só lugar.</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/entrar" className="rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-[#17130f] shadow-lg shadow-orange-950/30">Quero conhecer o sistema <span aria-hidden="true">→</span></Link>
                <a href="#funcionalidades" className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold text-white hover:bg-white/5">Ver funcionalidades</a>
                <a href="/downloads/OficioDoMotor.apk" className="rounded-xl border border-orange-400/30 px-6 py-3.5 font-semibold text-orange-200 hover:bg-orange-400/10">Baixar Android ↓</a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-slate-400"><span>✓ Cobrança por oficina</span><span>✓ Equipe incluída</span><span>✓ Acesso pelo navegador</span></div>
            </div>
            <div className="relative">
              <div className="absolute inset-8 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#1a2632] to-[#0c121a] p-4 shadow-2xl shadow-black/50 md:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2"><Emblema tamanho={30}/><span className="text-xs font-bold tracking-wider">OFÍCIO DO MOTOR</span></div><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">GESTÃO EM DIA</span></div>
                <MotoSilhueta className="my-4 w-full drop-shadow-[0_15px_30px_rgba(0,0,0,.55)]" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="block text-[10px] text-slate-400">Clientes</span><strong className="mt-1 block text-xl text-white">Organizados</strong></div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="block text-[10px] text-slate-400">Serviços</span><strong className="mt-1 block text-xl text-white">Acompanhados</strong></div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3"><span className="block text-[10px] text-slate-400">Orçamentos</span><strong className="mt-1 block text-xl text-white">Compartilhados</strong></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Menos improviso. Mais controle.</p><h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">A rotina da oficina não precisa ficar na sua cabeça.</h2><p className="mt-4 leading-7 text-slate-400">Quando as informações ficam espalhadas, é fácil perder tempo procurando dados, esquecer retornos ou não saber em que etapa está cada serviço. O sistema reúne os registros para você acompanhar o trabalho com mais clareza.</p></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[['Chega de procurar informação','Consulte clientes, motos e histórico em um só lugar.'],['Orçamentos mais claros','Registre o que será feito e compartilhe o orçamento por link.'],['Acompanhe cada serviço','Tenha as ordens de serviço organizadas e saiba o que está em andamento.']].map(([t,d],i)=><article key={t} className="rounded-2xl border border-white/10 bg-[#111a25] p-6"><span className="text-sm font-black text-orange-400">0{i+1}</span><h3 className="mt-4 text-xl font-bold text-white">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{d}</p></article>)}
          </div>
        </section>

        <section id="funcionalidades" className="border-y border-white/5 bg-[#0d141d]">
          <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
            <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">O que você consegue fazer</p><h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">As ferramentas essenciais para cuidar da oficina.</h2><p className="mt-4 leading-7 text-slate-400">Recursos para organizar o atendimento, acompanhar os serviços e ter uma visão melhor da operação.</p></div>
            <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recursos.map((r)=><article key={r.numero} className="rounded-2xl border border-white/10 bg-[#121c28] p-5 transition hover:-translate-y-1 hover:border-orange-400/30"><span className="text-xs font-bold tracking-widest text-orange-400">{r.numero}</span><h3 className="mt-3 text-lg font-bold text-white">{r.titulo}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{r.texto}</p></article>)}
            </div>
          </div>
        </section>

        <section id="planos" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Planos simples</p><h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Um plano que acompanha o tamanho da sua oficina.</h2><p className="mt-4 text-slate-400">Uma mensalidade por oficina. Cadastre sua equipe sem pagar por cada funcionário.</p></div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-[#111a25] p-7"><p className="text-sm font-bold text-slate-300">Básico</p><p className="mt-3 text-4xl font-black text-white">R$ 49,90<span className="text-sm font-medium text-slate-400"> / mês</span></p><p className="mt-2 text-sm text-slate-400">Para organizar o atendimento e os serviços do dia a dia.</p><ul className="mt-6 space-y-3 text-sm text-slate-300"><li>✓ Cadastro de clientes e motos</li><li>✓ Ordens de serviço</li><li>✓ Orçamentos por link</li><li>✓ Catálogo de serviços</li><li>✓ Acesso para equipe incluído</li></ul><Link to="/entrar" className="mt-7 block rounded-xl border border-white/15 px-4 py-3 text-center font-bold hover:bg-white/5">Conhecer o Básico</Link></article>
            <article className="relative rounded-2xl border border-orange-400/50 bg-gradient-to-b from-[#252016] to-[#111a25] p-7 shadow-xl shadow-orange-950/10"><span className="absolute -top-3 right-6 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#17130f]">Mais recursos</span><p className="text-sm font-bold text-orange-300">Completo</p><p className="mt-3 text-4xl font-black text-white">R$ 79,90<span className="text-sm font-medium text-slate-400"> / mês</span></p><p className="mt-2 text-sm text-slate-400">Para quem também precisa acompanhar estoque e financeiro.</p><ul className="mt-6 space-y-3 text-sm text-slate-300"><li>✓ Tudo do Básico</li><li>✓ Controle de peças e estoque</li><li>✓ Lembretes de manutenção</li><li>✓ Controle financeiro</li><li>✓ Fotos nas ordens de serviço</li><li>✓ Acesso para equipe incluído</li></ul><Link to="/entrar" className="mt-7 block rounded-xl bg-orange-500 px-4 py-3 text-center font-bold text-[#17130f]">Conhecer o Completo</Link></article>
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-500">Preços sugeridos de lançamento. A contratação e ativação são confirmadas pela equipe. Recursos e condições podem ser ajustados antes da publicação comercial definitiva.</p>
          <p className="mt-5 text-center text-sm text-slate-400">Precisa de uma função específica? <Link to="/entrar" className="font-semibold text-orange-300 underline underline-offset-4">Converse com a nossa equipe</Link> sobre uma implementação personalizada.</p>
        </section>

        <section id="duvidas" className="border-y border-white/5 bg-[#0d141d]">
          <div className="mx-auto max-w-4xl px-5 py-16 md:px-8 md:py-20"><p className="text-xs font-bold uppercase tracking-[.2em] text-orange-400">Perguntas frequentes</p><h2 className="mt-3 text-3xl font-bold text-white">Antes de começar</h2><div className="mt-7 divide-y divide-white/10">{duvidas.map(([q,a])=><details key={q} className="group py-5"><summary className="cursor-pointer list-none font-semibold text-white marker:hidden">{q}<span className="float-right text-orange-400 transition group-open:rotate-45">＋</span></summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{a}</p></details>)}</div></div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8"><div className="rounded-3xl border border-orange-400/20 bg-[radial-gradient(ellipse_at_90%_10%,rgba(242,160,61,.16),transparent_45%),linear-gradient(120deg,#182432,#101721)] p-8 text-center md:p-12"><Emblema tamanho={52}/><h2 className="mt-5 text-3xl font-bold text-white md:text-4xl">Dê o próximo passo para organizar sua oficina.</h2><p className="mx-auto mt-4 max-w-2xl text-slate-300">Conheça o Ofício do Motor e veja como simplificar o controle dos seus atendimentos.</p><Link to="/entrar" className="mt-7 inline-flex rounded-xl bg-orange-500 px-7 py-3.5 font-bold text-[#17130f]">Acessar / criar minha conta</Link></div></section>
      </main>
      <footer className="border-t border-white/10 bg-[#070b10]"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-8"><span>© {new Date().getFullYear()} Ofício do Motor. Gestão para oficinas de motocicletas.</span><span>Organização, clareza e controle para o dia a dia.</span></div></footer>
    </div>
  )
}
