import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarPlaca, formatarTelefone, mensagemErro } from '../lib/formatos'
import { botao, campo } from './Clientes'

type Moto = {
  id: string
  placa: string
  marca: string | null
  modelo: string | null
  ano: number | null
  cor: string | null
  km_atual: number | null
}
type Cliente = { id: string; nome: string; telefone: string | null; observacoes: string | null }

export default function ClienteDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const [cli, setCli] = useState<Cliente | null>(null)
  const [motos, setMotos] = useState<Moto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [dados, setDados] = useState({ nome: '', telefone: '', observacoes: '' })
  const [addMoto, setAddMoto] = useState(false)
  const [m, setM] = useState({ placa: '', marca: '', modelo: '', ano: '', cor: '', km: '' })

  async function carregar() {
    const { data: c } = await supabase
      .from('clientes')
      .select('id, nome, telefone, observacoes')
      .eq('id', id!)
      .maybeSingle()
    if (c) {
      setCli(c)
      setDados({ nome: c.nome, telefone: formatarTelefone(c.telefone), observacoes: c.observacoes ?? '' })
      const { data: ms } = await supabase
        .from('motos')
        .select('id, placa, marca, modelo, ano, cor, km_atual')
        .eq('cliente_id', c.id)
        .order('criado_em')
      setMotos(ms ?? [])
    }
    setCarregando(false)
  }
  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function salvarCliente(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setOk('')
    const { error } = await supabase
      .from('clientes')
      .update({ nome: dados.nome.trim(), telefone: dados.telefone, observacoes: dados.observacoes.trim() || null })
      .eq('id', id!)
    if (error) setErro(mensagemErro(error))
    else {
      setOk('Dados salvos.')
      carregar()
    }
  }

  async function salvarMoto(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const { error } = await supabase.from('motos').insert({
      cliente_id: id!,
      placa: m.placa,
      marca: m.marca.trim() || null,
      modelo: m.modelo.trim() || null,
      ano: m.ano ? Number(m.ano) : null,
      cor: m.cor.trim() || null,
      km_atual: m.km ? Number(m.km) : null,
    })
    if (error) return setErro(mensagemErro(error))
    setM({ placa: '', marca: '', modelo: '', ano: '', cor: '', km: '' })
    setAddMoto(false)
    carregar()
  }

  async function removerMoto(moto: Moto) {
    if (!confirm(`Remover a moto ${formatarPlaca(moto.placa)}?`)) return
    const { error } = await supabase.from('motos').delete().eq('id', moto.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  async function removerCliente() {
    if (!confirm('Remover este cliente e todas as motos dele?')) return
    const { error } = await supabase.from('clientes').delete().eq('id', id!)
    if (error) setErro(mensagemErro(error))
    else nav('/clientes')
  }

  const setD = (k: keyof typeof dados) => (e: { target: { value: string } }) => setDados({ ...dados, [k]: e.target.value })
  const setMo = (k: keyof typeof m) => (e: { target: { value: string } }) => setM({ ...m, [k]: e.target.value })

  if (carregando) return <p className="text-gray-600">Carregando...</p>
  if (!cli) return <p className="text-gray-600">Cliente não encontrado. <Link className="text-orange-600" to="/clientes">Voltar</Link></p>

  return (
    <div className="space-y-5">
      <Link to="/clientes" className="text-orange-600">← Clientes</Link>
      <h1 className="text-2xl font-bold text-gray-800">{cli.nome}</h1>

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}
      {ok && <p className="rounded-lg bg-green-100 p-3 text-green-700">{ok}</p>}

      <form onSubmit={salvarCliente} className="space-y-3 rounded-xl bg-white p-4 shadow">
        <input className={campo} required value={dados.nome} onChange={setD('nome')} placeholder="Nome" />
        <input className={campo} inputMode="tel" value={dados.telefone} onChange={setD('telefone')} placeholder="Telefone com DDD" />
        <textarea className={campo} rows={2} value={dados.observacoes} onChange={setD('observacoes')} placeholder="Observações" />
        <button className={botao + ' w-full'}>Salvar dados</button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Motos</h2>
          <button className={botao} onClick={() => setAddMoto(!addMoto)}>{addMoto ? 'Cancelar' : '+ Moto'}</button>
        </div>

        {addMoto && (
          <form onSubmit={salvarMoto} className="space-y-3 rounded-xl bg-white p-4 shadow">
            <input className={campo} required placeholder="Placa" value={m.placa} onChange={setMo('placa')} />
            <div className="grid grid-cols-2 gap-3">
              <input className={campo} placeholder="Marca" value={m.marca} onChange={setMo('marca')} />
              <input className={campo} placeholder="Modelo" value={m.modelo} onChange={setMo('modelo')} />
              <input className={campo} placeholder="Ano" inputMode="numeric" value={m.ano} onChange={setMo('ano')} />
              <input className={campo} placeholder="Cor" value={m.cor} onChange={setMo('cor')} />
            </div>
            <input className={campo} placeholder="Km atual" inputMode="numeric" value={m.km} onChange={setMo('km')} />
            <button className={botao + ' w-full'}>Salvar moto</button>
          </form>
        )}

        {motos.length === 0 ? (
          <p className="text-gray-600">Nenhuma moto cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {motos.map((mo) => (
              <li key={mo.id} className="flex items-start justify-between gap-3 rounded-xl bg-white p-4 shadow">
                <div>
                  <div className="font-semibold text-gray-800">{formatarPlaca(mo.placa)}</div>
                  <div className="text-sm text-gray-600">
                    {[mo.marca, mo.modelo, mo.ano, mo.cor].filter(Boolean).join(' · ') || 'Sem detalhes'}
                  </div>
                  {mo.km_atual != null && <div className="text-sm text-gray-500">{mo.km_atual.toLocaleString('pt-BR')} km</div>}
                </div>
                <button onClick={() => removerMoto(mo)} className="text-sm text-red-600">Remover</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="text-lg font-semibold text-gray-800">Histórico de serviços</h2>
        <p className="text-gray-600">Aparece aqui depois da Etapa 4 (ordens de serviço).</p>
      </div>

      <button onClick={removerCliente} className="text-sm text-red-600">Remover cliente</button>
    </div>
  )
}
