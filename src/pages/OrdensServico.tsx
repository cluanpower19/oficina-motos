import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarMoeda, formatarPlaca } from '../lib/formatos'
import { COR, ROTULO, STATUS, type StatusOS } from '../lib/status'
import { botao } from './Clientes'

type OS = {
  id: string
  numero: number
  status: StatusOS
  valor_total: number
  criado_em: string
  clientes: { nome: string } | null
  motos: { placa: string; modelo: string | null } | null
}

export default function OrdensServico() {
  const [lista, setLista] = useState<OS[]>([])
  const [filtro, setFiltro] = useState<'abertas' | StatusOS | 'todas'>('abertas')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    supabase
      .from('ordens_servico')
      .select('id, numero, status, valor_total, criado_em, clientes(nome), motos(placa, modelo)')
      .order('numero', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setErro(error.message)
        else setLista((data ?? []) as unknown as OS[])
        setCarregando(false)
      })
  }, [])

  const visiveis = lista.filter((o) =>
    filtro === 'todas' ? true : filtro === 'abertas' ? o.status !== 'entregue' && o.status !== 'cancelado' : o.status === filtro,
  )
  const chip = (ativo: boolean) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm ${ativo ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 shadow'}`

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Ordens de Serviço</h1>
        <Link to="/os/nova" className={botao}>+ Nova OS</Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button className={chip(filtro === 'abertas')} onClick={() => setFiltro('abertas')}>Abertas</button>
        {STATUS.map((s) => (
          <button key={s} className={chip(filtro === s)} onClick={() => setFiltro(s)}>{ROTULO[s]}</button>
        ))}
        <button className={chip(filtro === 'todas')} onClick={() => setFiltro('todas')}>Todas</button>
      </div>

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : visiveis.length === 0 ? (
        <p className="text-gray-600">Nenhuma OS aqui. Toque em "+ Nova OS".</p>
      ) : (
        <ul className="space-y-2">
          {visiveis.map((o) => (
            <li key={o.id}>
              <Link to={`/os/${o.id}`} className="block rounded-xl bg-white p-4 shadow active:bg-gray-50">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800">OS #{o.numero}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${COR[o.status]}`}>{ROTULO[o.status]}</span>
                </div>
                <div className="text-gray-700">{o.clientes?.nome}</div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{o.motos ? `${formatarPlaca(o.motos.placa)}${o.motos.modelo ? ' · ' + o.motos.modelo : ''}` : ''}</span>
                  <span>{formatarMoeda(o.valor_total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
