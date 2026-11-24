import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarPlaca, mensagemErro, normalizarPlaca, validarKmEntrada } from '../lib/formatos'
import { botao, campo } from './Clientes'

type MotoBusca = {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  km_atual: number | null
  cliente_id: string
  clientes: { nome: string } | null
}

export default function NovaOS() {
  const nav = useNavigate()
  const [placa, setPlaca] = useState('')
  const [achadas, setAchadas] = useState<MotoBusca[]>([])
  const [moto, setMoto] = useState<MotoBusca | null>(null)
  const [novo, setNovo] = useState(false)
  const [n, setN] = useState({ nome: '', telefone: '', marca: '', modelo: '', ano: '' })
  const [defeito, setDefeito] = useState('')
  const [km, setKm] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    const p = normalizarPlaca(placa)
    if (moto || p.length < 2) return setAchadas([])
    supabase
      .from('motos')
      .select('id, placa, marca, modelo, km_atual, cliente_id, clientes(nome)')
      .ilike('placa', `%${p}%`)
      .limit(8)
      .then(({ data }) => setAchadas((data ?? []) as unknown as MotoBusca[]))
  }, [placa, moto])

  function escolher(m: MotoBusca) {
    setMoto(m)
    setNovo(false)
    setPlaca(formatarPlaca(m.placa))
    if (m.km_atual) setKm(String(m.km_atual))
  }
  function trocar() {
    setMoto(null)
    setPlaca('')
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    const kmNum = km ? Number(km) : null
    const erroKm = validarKmEntrada(kmNum, moto?.km_atual ?? null)
    if (erroKm) {
      setSalvando(false)
      return setErro(erroKm)
    }
    let clienteId = moto?.cliente_id ?? ''
    let motoId = moto?.id ?? ''
    let clienteNovo = false

    if (!moto) {
      if (!normalizarPlaca(placa)) {
        setSalvando(false)
        return setErro('Informe a placa.')
      }
      const { data: cli, error } = await supabase
        .from('clientes')
        .insert({ nome: n.nome.trim(), telefone: n.telefone })
        .select('id')
        .single()
      if (error || !cli) {
        setSalvando(false)
        return setErro(error ? mensagemErro(error) : 'Erro ao salvar cliente')
      }
      clienteId = cli.id
      clienteNovo = true
      const { data: mt, error: e2 } = await supabase
        .from('motos')
        .insert({
          cliente_id: cli.id,
          placa,
          marca: n.marca.trim() || null,
          modelo: n.modelo.trim() || null,
          ano: n.ano ? Number(n.ano) : null,
        })
        .select('id')
        .single()
      if (e2 || !mt) {
        await supabase.from('clientes').delete().eq('id', cli.id)
        setSalvando(false)
        return setErro(e2 ? mensagemErro(e2) : 'Erro ao salvar moto')
      }
      motoId = mt.id
    }

    const { data: os, error: e3 } = await supabase
      .from('ordens_servico')
      .insert({
        cliente_id: clienteId,
        moto_id: motoId,
        defeito_relatado: defeito.trim() || null,
        km_entrada: kmNum,
      })
      .select('id')
      .single()
    if (e3 || !os) {
      setSalvando(false)
      if (clienteNovo) {
        const apagarMoto = await supabase.from('motos').delete().eq('id', motoId)
        const apagarCliente = apagarMoto.error
          ? null
          : await supabase.from('clientes').delete().eq('id', clienteId)
        if (apagarMoto.error || apagarCliente?.error) {
          setErro('A OS não foi criada e não foi possível desfazer todo o cadastro. Confira o cliente e a moto antes de tentar novamente. ' + (e3?.message ?? ''))
        } else {
          setErro('A OS não foi criada. O cadastro provisório de cliente e moto foi desfeito. ' + (e3?.message ?? ''))
        }
      } else {
        setErro(e3?.message ?? 'Erro ao criar OS')
      }
      return
    }
    if (kmNum) await supabase.from('motos').update({ km_atual: kmNum }).eq('id', motoId)
    nav(`/os/${os.id}`)
  }

  const setNv = (k: keyof typeof n) => (e: { target: { value: string } }) => setN({ ...n, [k]: e.target.value })

  return (
    <form onSubmit={salvar} className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Nova OS</h1>

      <div className="space-y-2 rounded-xl bg-white p-4 shadow">
        <label className="text-sm text-gray-600">Placa da moto</label>
        <div className="flex gap-2">
          <input
            className={campo}
            placeholder="ABC1D23"
            value={placa}
            onChange={(e) => {
              setPlaca(e.target.value)
              setNovo(false)
            }}
            disabled={!!moto}
            autoFocus
          />
          {moto && (
            <button type="button" onClick={trocar} className="rounded-lg bg-gray-100 px-4">Trocar</button>
          )}
        </div>

        {moto && (
          <p className="rounded-lg bg-green-50 p-3 text-green-800">
            {moto.clientes?.nome} · {[moto.marca, moto.modelo].filter(Boolean).join(' ') || 'moto'}
          </p>
        )}

        {!moto && achadas.length > 0 && (
          <ul className="space-y-1">
            {achadas.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => escolher(m)}
                  className="w-full rounded-lg bg-gray-50 p-3 text-left active:bg-gray-100"
                >
                  <b>{formatarPlaca(m.placa)}</b> · {m.clientes?.nome}
                  <span className="text-gray-500"> · {[m.marca, m.modelo].filter(Boolean).join(' ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!moto && normalizarPlaca(placa).length >= 2 && (
          <button type="button" onClick={() => setNovo(!novo)} className="text-orange-600 underline">
            {novo ? 'Cancelar cadastro novo' : 'Não achou? Cadastrar cliente e moto novos'}
          </button>
        )}
      </div>

      {novo && !moto && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className={campo} placeholder="Nome do cliente" required value={n.nome} onChange={setNv('nome')} />
          <input className={campo} placeholder="Telefone com DDD" inputMode="tel" value={n.telefone} onChange={setNv('telefone')} />
          <div className="grid grid-cols-2 gap-3">
            <input className={campo} placeholder="Marca" value={n.marca} onChange={setNv('marca')} />
            <input className={campo} placeholder="Modelo" value={n.modelo} onChange={setNv('modelo')} />
          </div>
          <input className={campo} placeholder="Ano" inputMode="numeric" value={n.ano} onChange={setNv('ano')} />
        </div>
      )}

      {(moto || novo) && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow">
          <textarea className={campo} rows={3} placeholder="Defeito relatado" value={defeito} onChange={(e) => setDefeito(e.target.value)} />
          <input className={campo} placeholder="Km de entrada" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value.replace(/\D/g, ''))} />
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar OS'}
          </button>
        </div>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}
    </form>
  )
}
