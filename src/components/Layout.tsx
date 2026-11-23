import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const itens = [
  { to: '/', label: 'Painel', icone: '🏠' },
  { to: '/os', label: 'OS', icone: '🔧' },
  { to: '/clientes', label: 'Clientes', icone: '👤' },
  { to: '/catalogo', label: 'Catálogo', icone: '📦' },
  { to: '/lembretes', label: 'Lembretes', icone: '🔔' },
  { to: '/financeiro', label: 'Financeiro', icone: '💰' },
  { to: '/configuracoes', label: 'Config.', icone: '⚙️' },
]

export default function Layout() {
  const { perfil, sair } = useAuth()

  return (
    <div className="min-h-full md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col bg-gray-800 text-white">
        <div className="px-5 py-6 text-xl font-bold text-orange-400">🏍️ Oficina Moto</div>
        <nav className="flex-1 space-y-1 px-3">
          {itens.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-base ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-200 hover:bg-gray-700'
                }`
              }
            >
              <span>{i.icone}</span>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={sair} className="m-3 rounded-lg bg-gray-700 px-4 py-3 text-left hover:bg-gray-600">
          Sair
        </button>
      </aside>

      <div className="flex-1 pb-24 md:pb-0">
        <header className="flex items-center justify-between bg-gray-800 px-4 py-3 text-white md:hidden">
          <span className="font-bold text-orange-400">{perfil?.oficina.nome ?? 'Oficina Moto'}</span>
          <button onClick={sair} className="rounded bg-gray-700 px-3 py-2 text-sm">Sair</button>
        </header>
        <main className="mx-auto max-w-5xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-7 bg-gray-800 text-white md:hidden">
        {itens.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end={i.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 text-[11px] ${isActive ? 'text-orange-400' : 'text-gray-300'}`
            }
          >
            <span className="text-xl">{i.icone}</span>
            {i.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
