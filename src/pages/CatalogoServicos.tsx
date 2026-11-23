import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatarMoeda, lerNumero, mensagemErro } from '../lib/formatos'
import { botao, campo } from './Clientes'

type Servico = { id: string; nome: string; valor_padrao: number }
const vazio = { nome: '', valor: '' }

export default function CatalogoServicos() {
  const [lista, setLista] = useState<Servico[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    const { data, error } = await supabase.from('servicos_catalogo').select('id, nome, valor_padrao').order('nome')
    if (error) setErro(error.message)
    else setLista((data ?? []) as Servico[])
    setCarregando(false)
  }
  useEffect(() => {
    carregar()
  }, [])

  function abrirNovo() {
    setEditId(null)
    setF(vazio)
    setAberto(true)
  }
  function editar(s: Servico) {
    setEditId(s.id)
    setF({ nome: s.nome, valor: String(s.valor_padrao).replace('.', ',') })
    setAberto(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function fechar() {
    setAberto(false)
    setEditId(null)
    setF(vazio)
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    const dados = { nome: f.nome.trim(), valor_padrao: lerNumero(f.valor) }
    const { error } = editId
      ? await supabase.from('servicos_catalogo').update(dados).eq('id', editId)
      : await supabase.from('servicos_catalogo').insert(dados)
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    fechar()
    carregar()
  }

  async function remover(s: Servico) {
    if (!window.confirm(`Remover "${s.nome}"?`)) return
    const { error } = await supabase.from('servicos_catalogo').delete().eq('id', s.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  const q = busca.trim().toLowerCase()
  const filtrada = q ? lista.filter((s) => s.nome.toLowerCase().includes(q)) : lista

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <input className={campo} placeholder="Buscar serviço" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <button className={botao + ' whitespace-nowrap'} onClick={aberto ? fechar : abrirNovo}>
          {aberto ? 'Cancelar' : '+ Novo'}
        </button>
      </div>

      {aberto && (
        <form onSubmit={salvar} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className={campo} placeholder="Nome do serviço (ex.: Troca de óleo)" required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          <input className={campo} placeholder="Valor padrão (R$)" inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
          <button className={botao + ' w-full'} disabled={salvando}>
            {salvando ? 'Salvando...' : editId ? 'Salvar alterações' : 'Salvar'}
          </button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : filtrada.length === 0 ? (
        <p className="text-gray-600">{lista.length === 0 ? 'Nenhum serviço ainda. Toque em "+ Novo".' : 'Nada encontrado.'}</p>
      ) : (
        <ul className="space-y-2">
          {filtrada.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow">
              <div>
                <div className="font-semibold text-gray-800">{s.nome}</div>
                <div className="text-sm text-gray-600">{formatarMoeda(s.valor_padrao)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => editar(s)} className="rounded-lg bg-gray-100 px-3 py-2 text-sm">Editar</button>
                <button onClick={() => remover(s)} className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Remover</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
