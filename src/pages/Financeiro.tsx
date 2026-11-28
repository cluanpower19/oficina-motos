import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatarMoeda, lerNumeroEstrito, mensagemErro } from '../lib/formatos'
import { dataBR, hojeISO } from '../lib/lembretes'
import { botao, campo } from './Clientes'

type Mov = {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data: string
  pago: boolean
  os_id: string | null
}

const pad = (n: number) => String(n).padStart(2, '0')

function limitesDoMes(mes: string) {
  const [a, m] = mes.split('-').map(Number)
  const prox = m === 12 ? `${a + 1}-01-01` : `${a}-${pad(m + 1)}-01`
  return { inicio: `${mes}-01`, fim: prox }
}

function somarMes(mes: string, delta: number) {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(a, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

const nomeMes = (mes: string) => {
  const [a, m] = mes.split('-').map(Number)
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const soma = (l: Mov[]) => l.reduce((s, x) => s + Number(x.valor), 0)
const vazio = { tipo: 'saida' as 'entrada' | 'saida', descricao: '', valor: '', data: '', pago: true }

export default function Financeiro() {
  const [mes, setMes] = useState(() => hojeISO().slice(0, 7))
  const [lista, setLista] = useState<Mov[]>([])
  const [receber, setReceber] = useState<Mov[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setErro('')
    setCarregando(true)
    try {
      const { inicio, fim } = limitesDoMes(mes)
      const cols = 'id, tipo, descricao, valor, data, pago, os_id'
      const [a, b] = await Promise.all([
        supabase.from('financeiro').select(cols).gte('data', inicio).lt('data', fim).order('data', { ascending: false }).order('criado_em', { ascending: false }),
        supabase.from('financeiro').select(cols).eq('tipo', 'entrada').eq('pago', false).order('data'),
      ])
      if (a.error) setErro(a.error.message)
      else setLista((a.data ?? []) as Mov[])
      if (b.error) setErro((anterior) => anterior || b.error.message)
      else setReceber((b.data ?? []) as Mov[])
    } catch {
      setErro('Não foi possível carregar o financeiro. Verifique sua conexão e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [mes])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const valor = lerNumeroEstrito(f.valor)
    if (valor === null || valor <= 0) return setErro('Informe um valor válido maior que zero.')
    setSalvando(true)
    const { error } = await supabase
      .from('financeiro')
      .insert({ tipo: f.tipo, descricao: f.descricao.trim(), valor, data: f.data || hojeISO(), pago: f.pago })
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    setAberto(false)
    setF(vazio)
    carregar()
  }

  async function alternarPago(m: Mov) {
    const { error } = await supabase.from('financeiro').update({ pago: !m.pago }).eq('id', m.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  async function remover(m: Mov) {
    if (!window.confirm(`Apagar "${m.descricao}"?`)) return
    const { error } = await supabase.from('financeiro').delete().eq('id', m.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  const entradas = soma(lista.filter((m) => m.tipo === 'entrada' && m.pago))
  const saidas = soma(lista.filter((m) => m.tipo === 'saida' && m.pago))
  const saldo = entradas - saidas
  const tab = (ativo: boolean, cor: string) =>
    `flex-1 rounded-lg px-4 py-2 text-center ${ativo ? cor + ' text-white' : 'bg-gray-100 text-gray-700'}`

  const linha = (m: Mov) => (
    <li key={m.id} className="space-y-2 rounded-xl bg-white p-4 shadow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-800">{m.descricao}</div>
          <div className="text-sm text-gray-500">
            {dataBR(m.data)} · {m.pago ? (m.tipo === 'entrada' ? 'Recebido' : 'Pago') : m.tipo === 'entrada' ? 'A receber' : 'A pagar'}
          </div>
        </div>
        <div className={`font-semibold ${m.tipo === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
          {m.tipo === 'saida' ? '− ' : ''}
          {formatarMoeda(Number(m.valor))}
        </div>
      </div>
      <div className="flex justify-end gap-2 text-sm">
        <button onClick={() => alternarPago(m)} className="rounded-lg bg-gray-100 px-3 py-2">
          {m.pago ? 'Desfazer' : m.tipo === 'entrada' ? 'Marcar recebido' : 'Marcar pago'}
        </button>
        <button onClick={() => remover(m)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Apagar</button>
      </div>
    </li>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Financeiro</h1>
        <button className={botao} onClick={() => setAberto(!aberto)}>{aberto ? 'Cancelar' : '+ Lançamento'}</button>
      </div>

      {aberto && (
        <form onSubmit={salvar} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <div className="flex gap-2">
            <button type="button" className={tab(f.tipo === 'saida', 'bg-red-600')} onClick={() => setF({ ...f, tipo: 'saida' })}>Saída</button>
            <button type="button" className={tab(f.tipo === 'entrada', 'bg-green-600')} onClick={() => setF({ ...f, tipo: 'entrada' })}>Entrada</button>
          </div>
          <input className={campo} placeholder="Descrição (ex.: aluguel, compra de peças)" required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Valor (R$)
              <input className={campo} inputMode="decimal" required value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
            </label>
            <label className="text-sm text-gray-600">
              Data
              <input type="date" className={campo} value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-gray-700">
            <input type="checkbox" checked={f.pago} onChange={(e) => setF({ ...f, pago: e.target.checked })} />
            {f.tipo === 'entrada' ? 'Já recebido' : 'Já pago'}
          </label>
          <button className={botao + ' w-full'} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      <div className="flex items-center justify-between rounded-xl bg-white p-2 shadow">
        <button className="rounded-lg px-4 py-2 text-xl" onClick={() => setMes(somarMes(mes, -1))} aria-label="Mês anterior">‹</button>
        <span className="font-semibold capitalize text-gray-800">{nomeMes(mes)}</span>
        <button className="rounded-lg px-4 py-2 text-xl" onClick={() => setMes(somarMes(mes, 1))} aria-label="Próximo mês">›</button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white p-3 shadow">
          <div className="text-xs text-gray-500">Entradas</div>
          <div className="font-bold text-green-700">{formatarMoeda(entradas)}</div>
        </div>
        <div className="rounded-xl bg-white p-3 shadow">
          <div className="text-xs text-gray-500">Saídas</div>
          <div className="font-bold text-red-700">{formatarMoeda(saidas)}</div>
        </div>
        <div className="rounded-xl bg-gray-800 p-3 shadow">
          <div className="text-xs text-gray-300">Saldo</div>
          <div className={`font-bold ${saldo < 0 ? 'text-red-300' : 'text-orange-400'}`}>{formatarMoeda(saldo)}</div>
        </div>
      </div>
      <p className="text-xs text-gray-500">Entradas e saídas contam só o que já foi recebido ou pago.</p>

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <>
          {receber.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-bold text-gray-800">
                Contas a receber · {formatarMoeda(soma(receber))}
              </h2>
              <ul className="space-y-2">{receber.map(linha)}</ul>
            </section>
          )}
          <section className="space-y-2">
            <h2 className="font-bold text-gray-800">Movimentos do mês</h2>
            {lista.length === 0 ? <p className="text-gray-600">Nenhum lançamento neste mês.</p> : <ul className="space-y-2">{lista.map(linha)}</ul>}
          </section>
        </>
      )}
    </div>
  )
}
