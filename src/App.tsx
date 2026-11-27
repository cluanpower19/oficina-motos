import { lazy, Suspense, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { linkWhatsAppComercial } from './lib/comercial'
import { AuthProvider, useAuth, erroCriacao } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import './pages/cadastro-oficina.css'
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
  const navigate = useNavigate()
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
  if (!session) {
    // No APK, a rota inicial deve abrir o login; a página pública fica apenas no navegador.
    if (location.pathname === '/' && !Capacitor.isNativePlatform()) return <SitePublico />
    if (/^\/cadastro\/?$/.test(location.pathname)) {
      if (Capacitor.isNativePlatform()) return <Navigate to="/entrar" replace />
      return <CadastroOficina />
    }
    return <Login />
  }

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
    const testeJaUtilizado = erroCriacao.toLocaleLowerCase('pt-BR').includes('já foi usado para iniciar um teste')
    const contato = linkWhatsAppComercial('Olá! Preciso de ajuda com o cadastro do Ofício do Motor.')
    return (
      <main className="cadastro-erro min-h-screen flex items-center justify-center px-4 py-10">
        <section className="cadastro-erro-card w-full max-w-xl rounded-3xl p-7 sm:p-10">
          <div className="cadastro-erro-marca">OFÍCIO DO MOTOR <span>•</span> GESTÃO DE OFICINAS</div>
          <div className="cadastro-erro-icone" aria-hidden="true">!</div>
          <p className="cadastro-erro-etiqueta">ATENÇÃO AO CADASTRO</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Cadastro da oficina não concluído</h1>
          <p className="mt-4 leading-relaxed">Não foi possível criar ou vincular uma oficina à sua conta.</p>
          {erroCriacao ? (
            <div role="alert" className="cadastro-erro-mensagem mt-5 rounded-2xl p-4 sm:p-5">
              <strong className="block mb-1">{testeJaUtilizado ? 'Teste grátis já utilizado' : 'O que aconteceu'}</strong>
              <span>{erroCriacao}</span>
            </div>
          ) : (
            <p className="mt-4 text-sm">Se você acabou de confirmar o e-mail, saia da conta e entre novamente. Se o problema continuar, fale com nossa equipe.</p>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {testeJaUtilizado ? (
              <a href={contato} target="_blank" rel="noopener noreferrer" className="cadastro-erro-primario">Falar com a equipe</a>
            ) : (
              <button disabled={tentandoPerfil} onClick={async () => { setTentandoPerfil(true); try { await recarregarPerfil() } finally { setTentandoPerfil(false) } }} className="cadastro-erro-primario disabled:opacity-60">{tentandoPerfil ? 'Verificando...' : 'Verificar novamente'}</button>
            )}
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/entrar") }} className="cadastro-erro-secundario">Sair da conta</button>
          </div>
          <p className="mt-6 text-xs leading-relaxed">Se você já possui uma conta, não precisa criar outra. Entre com seu e-mail cadastrado.</p>
        </section>
      </main>
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
