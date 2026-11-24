import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, erroCriacao } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Suporte from './pages/Suporte'
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
import RecursoPlano from './components/RecursoPlano'

function Rotas() {
  const { session, perfil, carregando, recuperacao } = useAuth()
  const location = useLocation()
  const [ehAdmin, setEhAdmin] = useState(false)
  const [verificandoAdmin, setVerificandoAdmin] = useState(true)
  const planoCompleto = perfil?.oficina.plano === 'completo' && perfil.oficina.status_assinatura === 'ativo'

  useEffect(() => {
    let ativo = true
    if (!session) {
      setEhAdmin(false)
      setVerificandoAdmin(false)
      return () => { ativo = false }
    }
    setVerificandoAdmin(true)
    supabase.rpc('admin_eh_admin').then(({ data, error }) => {
      if (!ativo) return
      setEhAdmin(!error && data === true)
      setVerificandoAdmin(false)
    })
    return () => { ativo = false }
  }, [session?.user.id])

  // O SDK pode limpar o fragmento após processar o link; o evento PASSWORD_RECOVERY é a fonte confiável.
  if (recuperacao || window.location.hash.includes('type=recovery')) return <Login redefinir />

  if (carregando) return <div className="p-8 text-gray-600">Carregando...</div>
  if (!session) return <Login />

  if (/\/admin(?:\/(?:solicitacoes|recursos))?\/?$/.test(location.pathname)) {
    if (verificandoAdmin) return <div className="min-h-screen bg-[#0b1016] p-8 text-gray-300">Verificando acesso administrativo...</div>
    if (ehAdmin) return <Admin />
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1016] p-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-gray-400">Esta área é exclusiva da administração do Ofício do Motor.</p>
          <button onClick={() => void supabase.auth.signOut()} className="mt-5 rounded-lg bg-orange-500 px-5 py-2 font-semibold text-black">Sair</button>
        </div>
      </div>
    )
  }

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
        <Route path="lembretes" element={planoCompleto ? <Lembretes /> : <RecursoPlano />} />
        <Route path="financeiro" element={planoCompleto ? <Financeiro /> : <RecursoPlano />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="suporte" element={<Suporte />} />
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
