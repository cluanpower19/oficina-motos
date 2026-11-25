import { useState } from 'react'
import CatalogoServicos from './CatalogoServicos'
import CatalogoPecas from './CatalogoPecas'
import { useAuth } from '../hooks/useAuth'

export default function Catalogo() {
  const { perfil } = useAuth()
  const completo = perfil?.oficina.plano === 'completo'
  const [aba, setAba] = useState<'servicos' | 'pecas'>('servicos')
  const tab = (ativo: boolean) =>
    `flex-1 rounded-lg px-4 py-3 text-center font-semibold ${ativo ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 shadow'}`

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
      <div className="flex gap-2">
        <button className={tab(aba === 'servicos')} onClick={() => setAba('servicos')}>Serviços</button>
        {completo && <button className={tab(aba === 'pecas')} onClick={() => setAba('pecas')}>Peças e estoque</button>}
      </div>
      {aba === 'servicos' || !completo ? <CatalogoServicos /> : <CatalogoPecas />}
    </div>
  )
}
