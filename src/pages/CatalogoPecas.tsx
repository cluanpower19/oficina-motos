import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatarMoeda, lerNumero, mensagemErro } from '../lib/formatos'
import { botao, campo } from './Clientes'

type Peca = {
  id: string
  nome: string
  codigo: string | null
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
}
const vazio = { nome: '', codigo: '', preco: '', qtd: '0', min: '0' }
const baixo = (p: Peca) => p.quantidade_estoque <= p.estoque_minimo

export default function CatalogoPecas() {
  const [lista, setLista] = useState<Peca[]>([])
  const [busca, setBusca] = useState('')
  const [soBaixo, setSoBaixo] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const { data, error } = await supabase
      .from('pecas')
      .select('id, nome, codigo, preco_venda, quantidade_estoque, estoque_minimo')
      .order('nome')
    if (error) setErro(error.message)
    else setLista((data ?? []) as Peca[])
    setCarregando(false)
  }
  useEffect(() => {
    carregar()
  }, [])

  function fechar() {
    setAberto(false)
    setEditId(null)
    setF(vazio)
  }
  function editar(p: Peca) {
    setEditId(p.id)
    setF({
      nome: p.nome,
      codigo: p.codigo ?? '',
      preco: String(p.preco_venda).replace('.', ','),
      qtd: String(p.quantidade_estoque),
      min: String(p.estoque_minimo),
    })
    setAberto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    const dados = {
      nome: f.nome.trim(),
      codigo: f.codigo.trim() || null,
      preco_venda: lerNumero(f.preco),
      quantidade_estoque: Math.trunc(lerNumero(f.qtd)),
      estoque_minimo: Math.max(0, Math.trunc(lerNumero(f.min))),
    }
    const { error } = editId
      ? await supabase.from('pecas').update(dados).eq('id', editId)
      : await supabase.from('pecas').insert(dados)
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    fechar()
    carregar()
  }

  async function remover(p: Peca) {
    if (!window.confirm(`Remover "${p.nome}"?`)) return
    const { error } = await supabase.from('pecas').delete().eq('id', p.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const q = busca.trim().toLowerCase()
  const filtrada = lista.filter(
    (p) =>
      (!q || p.nome.toLowerCase().includes(q) || (p.codigo ?? '').toLowerCase().includes(q)) && (!soBaixo || baixo(p)),
  )
  const qtdBaixo = lista.filter(baixo).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input className={campo} placeholder="Buscar por nome ou código" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <button className={botao + ' whitespace-nowrap'} onClick={aberto ? fechar : () => setAberto(true)}>
          {aberto ? 'Cancelar' : '+ Nova'}
        </button>
      </div>

      {qtdBaixo > 0 && (
        <button
          onClick={() => setSoBaixo(!soBaixo)}
          className="w-full rounded-lg bg-red-100 p-3 text-left text-red-700"
        >
          ⚠️ {qtdBaixo} {qtdBaixo === 1 ? 'peça com estoque baixo' : 'peças com estoque baixo'}{' '}
          <span className="underline">{soBaixo ? '(mostrar todas)' : '(ver)'}</span>
        </button>
      )}

      {aberto && (
        <form onSubmit={salvar} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className={campo} placeholder="Nome da peça" required value={f.nome} onChange={set('nome')} />
          <input className={campo} placeholder="Código (opcional)" value={f.codigo} onChange={set('codigo')} />
          <input className={campo} placeholder="Preço de venda (R$)" inputMode="decimal" value={f.preco} onChange={set('preco')} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Em estoque
              <input className={campo} inputMode="numeric" value={f.qtd} onChange={set('qtd')} />
            </label>
            <label className="text-sm text-gray-600">
              Estoque mínimo
              <input className={campo} inputMode="numeric" value={f.min} onChange={set('min')} />
            </label>
          </div>
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Salvar'}
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : filtrada.length === 0 ? (
        <p className="text-gray-600">{lista.length === 0 ? 'Nenhuma peça ainda. Toque em "+ Nova".' : 'Nada encontrado.'}</p>
      ) : (
        <ul className="space-y-2">
          {filtrada.map((p) => (
            <li key={p.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-800">{p.nome}</div>
                  <div className="text-sm text-gray-500">{p.codigo ? `Cód. ${p.codigo} · ` : ''}{formatarMoeda(p.preco_venda)}</div>
                </div>
                <span
                  className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${
                    baixo(p) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {p.quantidade_estoque} un.{baixo(p) ? ' · baixo' : ''}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                <span>Mínimo: {p.estoque_minimo}</span>
                <div className="flex gap-2">
                  <button onClick={() => editar(p)} className="rounded-lg bg-gray-100 px-3 py-2 text-gray-800">Editar</button>
                  <button onClick={() => remover(p)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Remover</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
