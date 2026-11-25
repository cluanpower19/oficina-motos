import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarPlaca, formatarTelefone, mensagemErro, normalizarPlaca, validarAnoFabricacao, validarPlaca } from '../lib/formatos'

type Moto = { id: string; placa: string; marca: string | null; modelo: string | null }
type Cliente = { id: string; nome: string; telefone: string | null; motos: Moto[] }

export const campo = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base'
export const botao = 'rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-50'

export default function Clientes() {
  const nav = useNavigate()
  const [lista, setLista] = useState<Cliente[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [novo, setNovo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [f, setF] = useState({ nome: '', telefone: '', placa: '', marca: '', modelo: '', ano: '' })

  async function carregar() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, telefone, motos(id, placa, marca, modelo)')
      .order('nome')
    if (error) setErro(error.message)
    else setLista((data ?? []) as Cliente[])
    setCarregando(false)
  }
  useEffect(() => {
    carregar()
  }, [])

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const qp = normalizarPlaca(busca).toLowerCase()
    if (!q) return lista
    return lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (qp && c.motos.some((m) => m.placa.toLowerCase().includes(qp))),
    )
  }, [lista, busca])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    if (f.placa.trim() && !validarPlaca(f.placa)) {
      setSalvando(false)
      return setErro('Informe uma placa válida (ABC1234 ou ABC1D23).')
    }
    const ano = f.ano.trim() ? Number(f.ano) : null
    const erroAno = validarAnoFabricacao(ano)
    if (erroAno) {
      setSalvando(false)
      return setErro(erroAno)
    }
    const { data: cli, error } = await supabase
      .from('clientes')
      .insert({ nome: f.nome.trim(), telefone: f.telefone })
      .select('id')
      .single()
    if (error || !cli) {
      setErro(error ? mensagemErro(error) : 'Erro ao salvar')
      setSalvando(false)
      return
    }
    if (f.placa.trim()) {
      const { error: e2 } = await supabase.from('motos').insert({
        cliente_id: cli.id,
        placa: normalizarPlaca(f.placa),
        marca: f.marca.trim() || null,
        modelo: f.modelo.trim() || null,
        ano,
      })
      if (e2) {
        setErro('Cliente salvo, mas a moto não: ' + mensagemErro(e2))
        setSalvando(false)
        carregar()
        return
      }
    }
    nav(`/clientes/${cli.id}`)
  }

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Clientes e motos</h1>
        <button className={botao} onClick={() => setNovo(!novo)}>
          {novo ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {novo && (
        <form onSubmit={salvar} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className={campo} placeholder="Nome do cliente" required value={f.nome} onChange={set('nome')} />
          <input className={campo} placeholder="Telefone com DDD" inputMode="tel" value={f.telefone} onChange={set('telefone')} />
          <p className="text-sm text-gray-500">Moto (opcional, dá para adicionar depois)</p>
          <input className={campo} placeholder="Placa" value={f.placa} onChange={set('placa')} />
          <div className="grid grid-cols-2 gap-3">
            <input className={campo} placeholder="Marca" value={f.marca} onChange={set('marca')} />
            <input className={campo} placeholder="Modelo" value={f.modelo} onChange={set('modelo')} />
          </div>
          <input className={campo} placeholder="Ano" inputMode="numeric" value={f.ano} onChange={set('ano')} />
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      <input
        className={campo}
        placeholder="Buscar por nome ou placa"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : filtrada.length === 0 ? (
        <p className="text-gray-600">{lista.length === 0 ? 'Nenhum cliente ainda. Toque em "+ Novo".' : 'Nada encontrado.'}</p>
      ) : (
        <ul className="space-y-2">
          {filtrada.map((c) => (
            <li key={c.id}>
              <Link to={`/clientes/${c.id}`} className="block rounded-xl bg-white p-4 shadow active:bg-gray-50">
                <div className="font-semibold text-gray-800">{c.nome}</div>
                <div className="text-sm text-gray-500">{formatarTelefone(c.telefone) || 'Sem telefone'}</div>
                {c.motos.length > 0 && (
                  <div className="mt-1 text-sm text-gray-700">
                    {c.motos.map((m) => `${formatarPlaca(m.placa)}${m.modelo ? ' · ' + m.modelo : ''}`).join('  |  ')}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
