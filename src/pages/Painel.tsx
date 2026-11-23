import { useAuth } from '../hooks/useAuth'

export default function Painel() {
  const { perfil } = useAuth()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-gray-800">{perfil?.oficina.nome}</h1>
      <p className="text-gray-600">Olá, {perfil?.nome}! O painel será preenchido nas próximas etapas.</p>
    </div>
  )
}
