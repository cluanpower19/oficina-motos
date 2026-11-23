import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth, erroCriacao } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Painel from './pages/Painel'
import Configuracoes from './pages/Configuracoes'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import Catalogo from './pages/Catalogo'
import OrdensServico from './pages/OrdensServico'
import NovaOS from './pages/NovaOS'
import OSDetalhe from './pages/OSDetalhe'
import OrcamentoPublico from './pages/OrcamentoPublico'
import Lembretes from './pages/Lembretes'
import Financeiro from './pages/Financeiro'

function Rotas() {
  const { session, perfil, carregando } = useAuth()

  // O link de recuperação do Supabase retorna à página inicial com type=recovery no fragmento.
  if (window.location.hash.includes('type=recovery')) return <Login />

  if (carregando) return <div className="p-8 text-gray-600">Carregando...</div>
  if (!session) return <Login />
  if (!perfil) {
    return <div className="p-8 text-gray-600">Não foi possível carregar sua oficina. Saia e entre novamente.{erroCriacao && <p className="mt-2 font-semibold text-red-600">{erroCriacao}</p>}</div>
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Painel />} />
        <Route path="os" element={<OrdensServico />} />
        <Route path="os/nova" element={<NovaOS />} />
        <Route path="os/:id" element={<OSDetalhe />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetalhe />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="lembretes" element={<Lembretes />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route path="/orcamento/:token" element={<OrcamentoPublico />} />
        <Route
          path="*"
          element={
            <AuthProvider>
              <Rotas />
            </AuthProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

