import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Painel from './pages/Painel'
import EmBreve from './pages/EmBreve'

function Rotas() {
  const { session, perfil, carregando } = useAuth()

  if (carregando) return <div className="p-8 text-gray-600">Carregando...</div>
  if (!session) return <Login />
  if (!perfil) {
    return <div className="p-8 text-gray-600">Não foi possível carregar sua oficina. Saia e entre novamente.</div>
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Painel />} />
        <Route path="os" element={<EmBreve titulo="Ordens de Serviço" />} />
        <Route path="clientes" element={<EmBreve titulo="Clientes" />} />
        <Route path="lembretes" element={<EmBreve titulo="Lembretes" />} />
        <Route path="financeiro" element={<EmBreve titulo="Financeiro" />} />
        <Route path="configuracoes" element={<EmBreve titulo="Configurações" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rotas />
      </AuthProvider>
    </BrowserRouter>
  )
}
