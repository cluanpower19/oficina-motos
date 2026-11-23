import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { formatarPlaca, lerNumero, mensagemErro } from '../lib/formatos'
import { botao, campo } from './Clientes'
import { linkWhatsApp, msgLembrete } from '../lib/whatsapp'
import { useAuth } from '../hooks/useAuth'
import { TIPOS, TIPO_ROTULO, TIPO_TEXTO, dataBR, hojeISO, somarDias, type TipoLembrete } from '../lib/lembretes'

type Lembrete = {
  id: string
  tipo: TipoLembrete
  data_prevista: string | null
  km_previsto: number | null
  motos: {
    placa: string
    marca: string | null
    modelo: string | null
    clientes: { nome: string; telefone: string | null } | null
  } | null
}
type MotoOpc = { id: string; placa: string; modelo: string | null; clientes: { nome: string } | null }

const vazio = { motoId: '', tipo: 'oleo' as TipoLembrete, data: '', km: '' }

export default function Lembretes() {
  const { perfil } = useAuth()
  const [lista, setLista] = useState<Lembrete[]>([])
  const [motos, setMotos] = useState<MotoOpc[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [f, setF] = useState(vazio)
  const [salvando, setSalvando] = useState(false)
  const [verTodos, setVerTodos] = useState(false)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('lembretes')
      .select('id, tipo, data_prevista, km_previsto, motos(placa, marca, modelo, clientes(nome, telefone))')
      .eq('enviado', false)
      .order('data_prevista', { ascending: true, nullsFirst: false })
    if (error) setErro(error.message)
    else setLista((data ?? []) as unknown as Lembrete[])
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function abrirForm() {
    setAberto(true)
    if (motos.length === 0) {
      const { data } = await supabase.from('motos').select('id, placa, modelo, clientes(nome)').order('placa')
      setMotos((data ?? []) as unknown as MotoOpc[])
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    const km = f.km.trim() ? Math.trunc(lerNumero(f.km)) : null
    if (!f.motoId) return setErro('Escolha a moto.')
    if (!f.data && km === null) return setErro('Informe a data ou a quilometragem.')
    setSalvando(true)
    const { error } = await supabase
      .from('lembretes')
      .insert({ moto_id: f.motoId, tipo: f.tipo, data_prevista: f.data || null, km_previsto: km })
    setSalvando(false)
    if (error) return setErro(mensagemErro(error))
    setAberto(false)
    setF(vazio)
    carregar()
  }

  function whats(l: Lembrete) {
    const m = l.motos
    const link = linkWhatsApp(
      m?.clientes?.telefone,
      msgLembrete({ cliente: m?.clientes?.nome ?? '', marca: m?.marca, modelo: m?.modelo, placa: m?.placa ?? '' }, TIPO_TEXTO[l.tipo], perfil?.oficina.msg_lembrete),
    )
    if (!link) return setErro('O cliente não tem um telefone válido com DDD. Corrija no cadastro do cliente.')
    setErro('')
    window.open(link, '_blank', 'noopener')
  }

  async function marcarEnviado(l: Lembrete) {
    const { error } = await supabase.from('lembretes').update({ enviado: true }).eq('id', l.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  async function remover(l: Lembrete) {
    if (!window.confirm('Apagar este lembrete?')) return
    const { error } = await supabase.from('lembretes').delete().eq('id', l.id)
    if (error) setErro(mensagemErro(error))
    else carregar()
  }

  const hoje = hojeISO()
  const limite = somarDias(hoje, 30)
  const grupos: { titulo: string; itens: Lembrete[] }[] = [
    { titulo: 'Atrasados', itens: lista.filter((l) => l.data_prevista && l.data_prevista < hoje) },
    { titulo: 'Próximos 30 dias', itens: lista.filter((l) => l.data_prevista && l.data_prevista >= hoje && l.data_prevista <= limite) },
    { titulo: 'Só por quilometragem', itens: lista.filter((l) => !l.data_prevista) },
  ]
  const adiante = lista.filter((l) => l.data_prevista && l.data_prevista > limite)
  if (verTodos) grupos.push({ titulo: 'Mais adiante', itens: adiante })
  const total = grupos.reduce((s, g) => s + g.itens.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Lembretes</h1>
        <button className={botao} onClick={aberto ? () => setAberto(false) : abrirForm}>{aberto ? 'Cancelar' : '+ Lembrete'}</button>
      </div>

      {aberto && (
        <form onSubmit={salvar} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <select className={campo} required value={f.motoId} onChange={(e) => setF({ ...f, motoId: e.target.value })}>
            <option value="">Escolha a moto</option>
            {motos.map((m) => (
              <option key={m.id} value={m.id}>
                {formatarPlaca(m.placa)} {m.modelo ?? ''} — {m.clientes?.nome ?? ''}
              </option>
            ))}
          </select>
          <select className={campo} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoLembrete })}>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{TIPO_ROTULO[t]}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-600">
              Data prevista
              <input type="date" className={campo} value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} />
            </label>
            <label className="text-sm text-gray-600">
              Ou km previsto
              <input className={campo} inputMode="numeric" value={f.km} onChange={(e) => setF({ ...f, km: e.target.value })} />
            </label>
          </div>
          <button className={botao + ' w-full'} disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar lembrete'}</button>
        </form>
      )}

      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      {carregando ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <>
          {total === 0 && <p className="text-gray-600">Nenhum lembrete pendente. Eles são sugeridos ao entregar uma OS.</p>}
          {grupos.map(
            (g) =>
              g.itens.length > 0 && (
                <section key={g.titulo} className="space-y-2">
                  <h2 className={`font-bold ${g.titulo === 'Atrasados' ? 'text-red-700' : 'text-gray-800'}`}>{g.titulo}</h2>
                  <ul className="space-y-2">
                    {g.itens.map((l) => (
                      <li key={l.id} className="space-y-2 rounded-xl bg-white p-4 shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-gray-800">{TIPO_ROTULO[l.tipo]}</div>
                            <div className="text-gray-700">{l.motos?.clientes?.nome}</div>
                            <div className="text-sm text-gray-500">
                              {l.motos ? `${formatarPlaca(l.motos.placa)} ${[l.motos.marca, l.motos.modelo].filter(Boolean).join(' ')}` : ''}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-700">
                            {l.data_prevista && <div>{dataBR(l.data_prevista)}</div>}
                            {l.km_previsto !== null && <div>{l.km_previsto.toLocaleString('pt-BR')} km</div>}
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2 text-sm">
                          <button onClick={() => whats(l)} className="rounded-lg bg-green-600 px-3 py-2 font-semibold text-white">WhatsApp</button>
                          <button onClick={() => marcarEnviado(l)} className="rounded-lg bg-gray-100 px-3 py-2">Já enviei</button>
                          <button onClick={() => remover(l)} className="rounded-lg bg-red-50 px-3 py-2 text-red-700">Apagar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
          {adiante.length > 0 && (
            <button className="text-orange-600 underline" onClick={() => setVerTodos(!verTodos)}>
              {verTodos ? 'Ocultar os mais distantes' : `Ver mais ${adiante.length} lembrete(s) para depois`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
