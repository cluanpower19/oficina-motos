import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarMoeda, formatarPlaca, formatarTelefone, mensagemErro, validarAnoFabricacao, validarPlaca } from '../lib/formatos'
import { COR, ROTULO, type StatusOS } from '../lib/status'
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
type HistoricoOS = {
  id: string
  numero: number
  moto_id: string
  status: StatusOS
  valor_total: number
  km_entrada: number | null
  criado_em: string
}
type ItemHistorico = {
  id: string
  os_id: string
  tipo: 'servico' | 'peca'
  descricao: string
  quantidade: number
  valor_unitario: number
}

export default function ClienteDetalhe() {
  const { id } = useParams()
  const nav = useNavigate()
  const [cli, setCli] = useState<Cliente | null>(null)
  const [motos, setMotos] = useState<Moto[]>([])\n  const [historico, setHistorico] = useState<HistoricoOS[]>([])\n  const [itensHistorico, setItensHistorico] = useState<ItemHistorico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [dados, setDados] = useState({ nome: '', telefone: '', observacoes: '' })
  const [addMoto, setAddMoto] = useState(false)
  const [m, setM] = useState({ placa: '', marca: '', modelo: '', ano: '', cor: '', km: '' })

  async function carregar() {
    try {
      const { data: c, error: erroCliente } = await supabase
        .from('clientes')
        .select('id, nome, telefone, observacoes')
        .eq('id', id!)
        .maybeSingle()
      if (erroCliente) {
        setErro(mensagemErro(erroCliente))
        setCli(null)
        return
      }
      if (!c) {
        setCli(null)
        setMotos([])
        return
      }
      setCli(c)
      setDados({ nome: c.nome, telefone: formatarTelefone(c.telefone), observacoes: c.observacoes ?? '' })
      const { data: ms, error: erroMotos } = await supabase
        .from('motos')
        .select('id, placa, marca, modelo, ano, cor, km_atual')
        .eq('cliente_id', c.id)
        .order('criado_em')
      if (erroMotos) {
        setMotos([])
        setErro(mensagemErro(erroMotos))
      } else {
        setMotos(ms ?? [])
      }
    } catch {
      setErro('Não foi possível carregar o cliente e suas motos. Verifique sua conexão e tente novamente.')
    } finally {
      setCarregando(false)
    }
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
    if (!validarPlaca(m.placa)) {
      return setErro('Informe uma placa válida (ABC1234 ou ABC1D23).')
    }
    const ano = m.ano.trim() ? Number(m.ano) : null
    const kmAtual = m.km.trim() ? Number(m.km) : null
    const erroAno = validarAnoFabricacao(ano)
    if (erroAno) return setErro(erroAno)
    if (kmAtual !== null && (!Number.isSafeInteger(kmAtual) || kmAtual < 0)) {
      return setErro('A quilometragem deve ser um número inteiro igual ou maior que zero.')
    }
    const { error } = await supabase.from('motos').insert({
      cliente_id: id!,
      placa: m.placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase(),
      marca: m.marca.trim() || null,
      modelo: m.modelo.trim() || null,
      ano,
      cor: m.cor.trim() || null,
      km_atual: kmAtual,
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

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Histórico de manutenção</h2>
          <p className="text-sm text-gray-500">Ordens de serviço e serviços realizados em cada moto.</p>
        </div>
        {historico.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-sm text-gray-600 shadow">
            Ainda não há ordens de serviço registradas para este cliente.
          </div>
        ) : motos.map((mo) => {
          const ordensMoto = historico.filter((os) => os.moto_id === mo.id)
          if (!ordensMoto.length) return null
          return (
            <div key={mo.id} className="space-y-2 rounded-xl bg-white p-4 shadow">
              <div className="font-semibold text-gray-800">{formatarPlaca(mo.placa)} · {[mo.marca, mo.modelo].filter(Boolean).join(' ')}</div>
              {mo.km_atual != null && <p className="text-xs text-gray-500">Quilometragem cadastrada: {mo.km_atual.toLocaleString('pt-BR')} km</p>}
              {ordensMoto.map((os) => {
                const itens = itensHistorico.filter((item) => item.os_id === os.id)
                return (
                  <div key={os.id} className="border-t border-gray-100 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link to={`/os/${os.id}`} className="font-semibold text-orange-600 underline">OS #{os.numero}</Link>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${COR[os.status]}`}>{ROTULO[os.status]}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(os.criado_em).toLocaleDateString('pt-BR')}
                      {os.km_entrada != null ? ` · ${os.km_entrada.toLocaleString('pt-BR')} km` : ''}
                    </p>
                    {itens.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {itens.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3 text-sm text-gray-700">
                            <span>{item.descricao} <span className="text-gray-400">({item.tipo === 'servico' ? 'serviço' : 'peça'} · {item.quantidade}x)</span></span>
                            <span className="shrink-0">{formatarMoeda(Number(item.quantidade) * Number(item.valor_unitario))}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-2 text-xs text-gray-400">Nenhum serviço ou peça lançado nesta OS.</p>}
                    <div className="mt-2 text-right text-sm font-semibold text-gray-800">Total: {formatarMoeda(Number(os.valor_total))}</div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </section>

      <button onClick={removerCliente} className="text-sm text-red-600">Remover cliente</button>
    </div>
  )
}
