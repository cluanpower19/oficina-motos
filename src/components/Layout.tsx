import type { ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { calcularAssinatura, linkSuporte } from '../lib/assinatura'
import { Emblema } from './Cenario'

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const icones: Record<string, ReactNode> = {
  painel: <Svg><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Svg>,
  os: <Svg><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3.5 17.2a1.8 1.8 0 0 0 2.6 2.6l5.8-5.8a4 4 0 0 0 5.1-5.4l-2.4 2.4-2.2-.6-.6-2.2 2.4-2.4z" /></Svg>,
  clientes: <Svg><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.8-3.6 3.8-5.4 7.5-5.4s6.7 1.8 7.5 5.4" /></Svg>,
  catalogo: <Svg><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></Svg>,
  lembretes: <Svg><path d="M6 16V11a6 6 0 1 1 12 0v5l1.6 2H4.4L6 16z" /><path d="M10 21a2 2 0 0 0 4 0" /></Svg>,
  financeiro: <Svg><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9.5v.01M18 14.5v.01" /></Svg>,
  suporte: <Svg><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" /></Svg>,
  config: <Svg><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Svg>,
}

const todos = [
  { to: '/', label: 'Painel', icone: 'painel' },
  { to: '/os', label: 'OS', icone: 'os' },
  { to: '/clientes', label: 'Clientes', icone: 'clientes' },
  { to: '/catalogo', label: 'Catálogo', icone: 'catalogo' },
  { to: '/lembretes', label: 'Lembretes', icone: 'lembretes' },
  { to: '/financeiro', label: 'Financeiro', icone: 'financeiro' },
  { to: '/configuracoes', label: 'Config.', icone: 'config' },
  { to: '/suporte', label: 'Suporte', icone: 'suporte' },
]

export default function Layout() {
  const { perfil, sair } = useAuth()
  const assin = calcularAssinatura(perfil!.oficina.status_assinatura, perfil!.oficina.teste_ate, perfil!.oficina.vencimento_assinatura, perfil!.oficina.cancelamento_agendado)
  const suporte = linkSuporte(perfil!.oficina.nome)
  const faixa = assin.status === 'teste'
    ? 'Teste grátis: faltam ' + assin.diasRestantes + ' dia(s). Aproveite os recursos do seu plano.'
    : assin.emTolerancia
      ? 'Pagamento vencido: restam ' + assin.diasRestantes + ' dia(s) de tolerância. Regularize para evitar o bloqueio de alterações.'
      : !assin.ativa
      ? (perfil!.oficina.status_assinatura === 'teste'
          ? 'Seu teste grátis terminou. Você pode consultar os dados, mas não pode salvar alterações.'
          : 'Assinatura inativa: você pode consultar os dados, mas não pode salvar alterações.')
      : assin.vencimentoPendente
        ? 'Acesso ativo sem vencimento cadastrado. Entre em contato com o suporte para regularizar a assinatura.'
        : ''
  const planoCompleto = perfil!.oficina.plano === 'completo'
  const itens = todos.filter((i) => planoCompleto || !['/financeiro', '/lembretes'].includes(i.to))

  return (
    <div className="min-h-full md:flex">
      <aside className="menu-lateral hidden md:flex md:w-64 md:flex-col text-white">
        <div className="px-5 pb-5 pt-7">
          <div className="marca">
            <Emblema tamanho={46} />
            <div className="marca-nome">
              Ofício
              <small>do motor · Gestão</small>
            </div>
          </div>
          <p className="mt-5 truncate text-sm text-gray-600">{perfil?.oficina.nome}</p>
        </div>
        <div className="listra-perigo mx-5 mb-4 rounded-sm" />
        <nav className="flex-1 space-y-1 px-3">
          {itens.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `item-menu ${isActive ? 'ativo' : ''}`}>
              {icones[i.icone]}
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="rodape-menu">
          <span className="lampada" />
          {assin.ativa ? 'Oficina aberta' : 'Somente consulta'}
        </div>
        <button onClick={sair} className="item-menu m-3 mt-0">
          Sair
        </button>
      </aside>

      <div className="area-principal flex-1 pb-24 md:pb-0">
        <div className="topo-desktop">
          <span className="titulo text-lg uppercase tracking-widest text-gray-600">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </span>
          <span className="chip-usuario">
            <b>{(perfil?.nome ?? 'O').slice(0, 1).toUpperCase()}</b>
            {perfil?.nome}
          </span>
        </div>
        <header className="flex items-center justify-between border-b border-[#2c3542] bg-[#0b1016] px-4 py-3 text-white md:hidden">
          <span className="flex min-w-0 items-center gap-2"><Emblema tamanho={32} /><span className="titulo truncate text-xl text-orange-400">{perfil?.oficina.nome ?? 'Ofício do motor'}</span></span>
          <button onClick={sair} className="rounded-md border border-[#364152] px-3 py-1.5 text-sm text-gray-300">Sair</button>
        </header>
        {faixa && (
          <div className={`px-4 py-2 text-sm ${assin.ativa ? 'bg-yellow-100 text-yellow-900' : 'bg-red-600 text-white'}`}>
            {faixa}
            {!assin.ativa && suporte && (
              <>
                {' '}
                <a href={suporte} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                  Falar com o suporte
                </a>
              </>
            )}
          </div>
        )}
        <main className="mx-auto max-w-5xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <nav className="barra-celular fixed inset-x-0 bottom-0 z-10 flex justify-around pb-[env(safe-area-inset-bottom)] md:hidden">
        {itens.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `aba-celular ${isActive ? 'ativo' : ''}`}>
            {icones[i.icone]}
            {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
