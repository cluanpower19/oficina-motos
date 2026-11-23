import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarMoeda, formatarPlaca, formatarTelefone, lerNumero, mensagemErro } from '../lib/formatos'
import { COR, ROTULO, STATUS, type StatusOS } from '../lib/status'
import { botao, campo } from './Clientes'

type OS = {
  id: string
  numero: number
  status: StatusOS
  valor_total: number
  defeito_relatado: string | null
  km_entrada: number | null
  criado_em: string
  cliente_id: string
  clientes: { nome: string; telefone: string | null } | null
  motos: { placa: string; marca: string | null; modelo: string | null } | null
}
type Item = { id: string; tipo: 'servico' | 'peca'; descricao: string; quantidade: number; valor_unitario: number; peca_id: string | null }
type Cat = { id: string; nome: string; preco: number }

const vazio = { tipo: 'servico' as 'servico' | 'peca', catId: '', descricao: '', qtd: '1', valor: '' }

export default function OSDetalhe() {
  const { id } = useParams()
  const [os, setOs] = useState<OS | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [servicos, setServicos] = useState<Cat[]>([])
  const [pecas, setPecas] = useState<Cat[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase
        .from('ordens_servico')
        .select('id, numero, status, valor_total, defeito_relatado, km_entrada, criado_em, cliente_id, clientes(nome, telefone), motos(placa, marca, modelo)')
        .eq('id', id)
        .single(),
      supabase
        .from('os_itens')
        .select('id, tipo, descricao, quantidade, valor_unitario, peca_id')
        .eq('os_id', id)
        .order('criado_em'),
    ])
    if (a.error) setErro(a.error.message)
    else setOs(a.data as unknown as OS)
    if (b.data) setItens(b.data as Item[])
    setCarregando(false)
  }, [id])

  useEffect(() => {
    carregar()
    supabase.from('servicos_catalogo').select('id, nome, valor_padrao').order('nome').then(({ data }) =>
      setServicos((data ?? []).map((s) => ({ id: s.id, nome: s.nome, preco: Number(s.valor_padrao) }))),
    )
    supabase.from('pecas').select('id, nome, preco_venda').order('nome').then(({ data }) =>
      setPecas((data ?? []).map((p) => ({ id: p.id, nome: p.nome, preco: Number(p.preco_venda) }))),
    )
  }, [carregar])

  async function mudarStatus(status: StatusOS) {
    if (!os || status === os.status) return
    setErro('')
    const { error } = await supabase.from('ordens_servico').update({ status }).eq('id', os.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  function escolherCatalogo(catId: string) {
    const cat = (f.tipo === 'servico' ? servicos : pecas).find((c) => c.id === catId)
    if (!cat) return setF({ ...f, catId: '', descricao: '', valor: '' })
    setF({ ...f, catId, descricao: cat.nome, valor: String(cat.preco).replace('.', ',') })
  }

  function fechar() {
    setAberto(false)
    setEditId(null)
    setF(vazio)
  }
  function editar(i: Item) {
    setEditId(i.id)
    setF({ tipo: i.tipo, catId: i.peca_id ?? '', descricao: i.descricao, qtd: String(i.quantidade), valor: String(i.valor_unitario).replace('.', ',') })
    setAberto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvarItem(e: FormEvent) {
    e.preventDefault()
    if (!os) return
    setErro('')
    setSalvando(true)
    const dados = {
      tipo: f.tipo,
      descricao: f.descricao.trim(),
      quantidade: Math.max(1, Math.trunc(lerNumero(f.qtd))),
      valor_unitario: lerNumero(f.valor),
      peca_id: f.tipo === 'peca' && f.catId ? f.catId : null,
    }
    const { error } = editId
      ? await supabase.from('os_itens').update(dados).eq('id', editId)
      : await supabase.from('os_itens').insert({ ...dados, os_id: os.id })
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    fechar()
    carregar()
  }

  async function removerItem(i: Item) {
    if (!window.confirm(`Remover "${i.descricao}"?`)) return
    const { error } = await supabase.from('os_itens').delete().eq('id', i.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  if (carregando) return <p className="text-gray-600">Carregando...</p>
  if (!os) return <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro || 'OS não encontrada.'}</p>

  const cat = f.tipo === 'servico' ? servicos : pecas
  const tab = (ativo: boolean) =>
    `flex-1 rounded-lg px-4 py-2 text-center ${ativo ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'}`

  return (
    <div className="space-y-4">
      <Link to="/os" className="text-orange-600">← Ordens de Serviço</Link>

      <div className="space-y-2 rounded-xl bg-white p-4 shadow">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-800">OS #{os.numero}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${COR[os.status]}`}>{ROTULO[os.status]}</span>
        </div>
        <Link to={`/clientes/${os.cliente_id}`} className="block font-semibold text-gray-800 underline">{os.clientes?.nome}</Link>
        <div className="text-sm text-gray-600">
          {formatarTelefone(os.clientes?.telefone) || 'Sem telefone'} ·{' '}
          {os.motos ? `${formatarPlaca(os.motos.placa)} ${[os.motos.marca, os.motos.modelo].filter(Boolean).join(' ')}` : ''}
        </div>
        <div className="text-sm text-gray-600">
          Entrada: {new Date(os.criado_em).toLocaleDateString('pt-BR')}
          {os.km_entrada ? ` · ${os.km_entrada} km` : ''}
        </div>
        {os.defeito_relatado && <p className="rounded-lg bg-gray-50 p-3 text-gray-700">{os.defeito_relatado}</p>}
        <label className="block pt-1 text-sm text-gray-600">
          Status
          <select className={campo} value={os.status} onChange={(e) => mudarStatus(e.target.value as StatusOS)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>{ROTULO[s]}</option>
            ))}
          </select>
        </label>
        <p className="text-xs text-gray-500">As peças saem do estoque ao marcar "Em andamento" (uma vez só).</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800">Itens</h2>
        <button className={botao} onClick={aberto ? fechar : () => setAberto(true)}>{aberto ? 'Cancelar' : '+ Item'}</button>
      </div>

      {aberto && (
        <form onSubmit={salvarItem} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <div className="flex gap-2">
            <button type="button" className={tab(f.tipo === 'servico')} onClick={() => setF({ ...vazio, tipo: 'servico' })}>Serviço</button>
            <button type="button" className={tab(f.tipo === 'peca')} onClick={() => setF({ ...vazio, tipo: 'peca' })}>Peça</button>
          </div>
          <select className={campo} value={f.catId} onChange={(e) => escolherCatalogo(e.target.value)}>
            <option value="">Digitar livre (fora do catálogo)</option>
            {cat.map((c) => (
              <option key={c.id} value={c.id}>{c.nome} — {formatarMoeda(c.preco)}</option>
            ))}
          </select>
          <input className={campo} placeholder="Descrição" required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Quantidade
              <input className={campo} inputMode="numeric" value={f.qtd} onChange={(e) => setF({ ...f, qtd: e.target.value })} />
            </label>
            <label className="text-sm text-gray-600">
              Valor unitário (R$)
              <input className={campo} inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
            </label>
          </div>
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Adicionar'}
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {itens.length === 0 ? (
        <p className="text-gray-600">Nenhum item ainda. Toque em "+ Item".</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((i) => (
            <li key={i.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">{i.descricao}</div>
                  <div className="text-sm text-gray-500">
                    {i.tipo === 'servico' ? 'Serviço' : 'Peça'} · {i.quantidade} x {formatarMoeda(Number(i.valor_unitario))}
                  </div>
                </div>
                <div className="font-semibold text-gray-800">{formatarMoeda(i.quantidade * Number(i.valor_unitario))}</div>
              </div>
              <div className="mt-2 flex justify-end gap-2 text-sm">
                <button onClick={() => editar(i)} className="rounded-lg bg-gray-100 px-3 py-2">Editar</button>
                <button onClick={() => removerItem(i)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Remover</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between rounded-xl bg-gray-800 p-4 text-white">
        <span>Total</span>
        <span className="text-2xl font-bold text-orange-400">{formatarMoeda(Number(os.valor_total))}</span>
      </div>
    </div>
  )
}
