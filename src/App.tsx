import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth, erroCriacao } from './hooks/useAuth'
import { supabase } from './lib/supabase'
const Layout = lazy(() => import('./components/Layout'))
const Login = lazy(() => import('./pages/Login'))
const Admin = lazy(() => import('./pages/Admin'))
const Suporte = lazy(() => import('./pages/Suporte'))
const Painel = lazy(() => import('./pages/Painel'))
const Configuracoes = lazy(() => import('./pages/Configuracoes'))
const Clientes = lazy(() => import('./pages/Clientes'))
const ClienteDetalhe = lazy(() => import('./pages/ClienteDetalhe'))
const Catalogo = lazy(() => import('./pages/Catalogo'))
const OrdensServico = lazy(() => import('./pages/OrdensServico'))
const NovaOS = lazy(() => import('./pages/NovaOS'))
const OSDetalhe = lazy(() => import('./pages/OSDetalhe'))
const OrcamentoPublico = lazy(() => import('./pages/OrcamentoPublico'))
const Lembretes = lazy(() => import('./pages/Lembretes'))
const Financeiro = lazy(() => import('./pages/Financeiro'))
const RecursoPlano = lazy(() => import('./components/RecursoPlano'))
const SitePublico = lazy(() => import('./pages/SitePublico'))
const Contratacao = lazy(() => import('./pages/Contratacao'))
const CadastroOficina = lazy(() => import('./pages/CadastroOficina'))

function Rotas() {
  const { session, perfil, carregando, recuperacao, recarregarPerfil } = useAuth()
  const location = useLocation()
  const [ehAdmin, setEhAdmin] = useState(false)
  const [verificandoAdmin, setVerificandoAdmin] = useState(true)
  const [tentandoPerfil, setTentandoPerfil] = useState(false)
  const planoCompleto = perfil?.oficina.plano === 'completo'

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
  if (!session) return location.pathname === '/' ? <SitePublico /> : location.pathname === '/cadastro' ? <CadastroOficina /> : <Login />

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
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-gray-700">
        <div className="max-w-md">
          <h1 className="text-xl font-bold">Cadastro da oficina não concluído</h1>
          <p className="mt-2 text-sm">Não foi possível criar ou vincular uma oficina à sua conta. Se acabou de se cadastrar, confirme seu e-mail e entre novamente. Se já confirmou, confira a mensagem abaixo.</p>
          {erroCriacao && <p className="mt-3 text-sm font-semibold text-red-600">{erroCriacao}</p>}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button disabled={tentandoPerfil} onClick={async () => { setTentandoPerfil(true); try { await recarregarPerfil() } finally { setTentandoPerfil(false) } }} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-black disabled:opacity-60">{tentandoPerfil ? 'Verificando...' : 'Tentar novamente'}</button>
            <button onClick={() => void supabase.auth.signOut()} className="rounded-lg border border-gray-300 px-5 py-2 font-semibold text-gray-700">Sair</button>
          </div>
        </div>
      </div>
    )
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
      <Suspense fallback={<div className="p-8 text-gray-600">Carregando módulo...</div>}>
        <Routes>
          <Route path="/contratar" element={<Contratacao />} />
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
      </Suspense>
    </BrowserRouter>
  )
}
