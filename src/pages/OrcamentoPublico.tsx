import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatarMoeda, formatarPlaca, formatarTelefone } from '../lib/formatos'

type Dados = {
  oficina: { nome: string; telefone: string | null; endereco: string | null; logo?: string | null }
  os: { numero: number; status: string; valor_total: number; defeito_relatado: string | null; km_entrada: number | null; criado_em: string; aprovado_em: string | null }
  cliente: string
  moto: { placa: string; marca: string | null; modelo: string | null }
  itens: { tipo: string; descricao: string; quantidade: number; valor_unitario: number }[]
  fotos: { path: string; legenda: string | null }[]
}
type FotoPublica = { path: string; legenda: string | null; url: string }

export default function OrcamentoPublico() {
  const { token } = useParams()
  const [d, setD] = useState<Dados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')
  const [erroCarga, setErroCarga] = useState('')
  const [erroFotos, setErroFotos] = useState('')
  const [fotosAssinadas, setFotosAssinadas] = useState<FotoPublica[]>([])

  const carregar = useCallback(async () => {
    setErroCarga('')
    setErroFotos('')
    try {
      const { data, error } = await supabase.rpc('orcamento_publico', { p_token: token })
      if (error) throw error
      const dados = (data as Dados | null) ?? null
      setD(dados)

      if (dados?.fotos?.length) {
        try {
          const { data: respostaFotos, error: erroRespostaFotos } = await supabase.functions.invoke('orcamento-fotos', { body: { token } })
          if (erroRespostaFotos) {
            setErroFotos('Não foi possível carregar as fotos deste orçamento.')
            setFotosAssinadas([])
          } else {
            setFotosAssinadas(Array.isArray(respostaFotos?.fotos) ? respostaFotos.fotos as FotoPublica[] : [])
          }
        } catch {
          setErroFotos('Não foi possível carregar as fotos deste orçamento.')
          setFotosAssinadas([])
        }
      } else {
        setFotosAssinadas([])
      }
    } catch {
      setD(null)
      setFotosAssinadas([])
      setErroCarga('Não foi possível carregar o orçamento agora. Verifique sua conexão e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [token])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function responder(aprovar: boolean) {
    if (enviando || !window.confirm(aprovar ? 'Aprovar este orçamento?' : 'Recusar este orçamento?')) return
    setEnviando(true)
    setMsg('')
    try {
      const { data, error } = await supabase.rpc('responder_orcamento', { p_token: token, p_aprovar: aprovar })
      if (error) throw error
      if (data === 'nao_encontrado') {
        setMsg('Este orçamento não foi encontrado. Peça um novo link à oficina.')
        return
      }
      if (data === 'ja_respondido') setMsg('Este orçamento já foi respondido.')
      await carregar()
    } catch {
      setMsg('Não foi possível enviar sua resposta. Verifique sua conexão e tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return <div className="p-8 text-gray-600">Carregando...</div>
  if (!d) return <div className="space-y-3 p-8 text-center text-gray-700" role="alert">{erroCarga || 'Orçamento não encontrado. Confira o link com a oficina.'}<button className="mx-auto block rounded-lg bg-gray-800 px-4 py-2 text-white" onClick={() => { setCarregando(true); void carregar() }}>Tentar novamente</button></div>

  const aberto = d.os.status === 'orcamento' || d.os.status === 'aguardando_aprovacao'
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="rounded-xl bg-gray-800 p-4 text-white">
        <div className="text-xl font-bold text-orange-400">{d.oficina.logo ? <img src={d.oficina.logo} alt="" className="mr-2 inline h-10 w-10 rounded object-cover align-middle" /> : '\u{1F3CD}\u{FE0F} '}{d.oficina.nome}</div>
        <div className="text-sm text-gray-300">
          {[formatarTelefone(d.oficina.telefone), d.oficina.endereco].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="space-y-1 rounded-xl bg-white p-4 shadow">
        <h1 className="text-xl font-bold text-gray-800">Orçamento #{d.os.numero}</h1>
        <p className="text-gray-700">Olá, {d.cliente}!</p>
        <p className="text-gray-700">
          Moto: <b>{formatarPlaca(d.moto.placa)}</b> {[d.moto.marca, d.moto.modelo].filter(Boolean).join(' ')}
        </p>
        {d.os.defeito_relatado && <p className="text-sm text-gray-600">Problema relatado: {d.os.defeito_relatado}</p>}
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        {d.itens.length === 0 ? (
          <p className="text-gray-600">Sem itens ainda.</p>
        ) : (
          <ul className="divide-y">
            {d.itens.map((i, k) => (
              <li key={k} className="flex justify-between gap-3 py-2">
                <div>
                  <div className="text-gray-800">{i.descricao}</div>
                  <div className="text-sm text-gray-500">
                    {i.tipo === 'servico' ? 'Serviço' : 'Peça'} · {i.quantidade} x {formatarMoeda(Number(i.valor_unitario))}
                  </div>
                </div>
                <div className="font-semibold">{formatarMoeda(i.quantidade * Number(i.valor_unitario))}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-gray-700">Total</span>
          <span className="text-2xl font-bold text-orange-600">{formatarMoeda(Number(d.os.valor_total))}</span>
        </div>
      </div>

      {erroFotos && <p className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800" role="status">{erroFotos}</p>}
      {fotosAssinadas.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {fotosAssinadas.map((f, k) => (
            <a key={f.path || k} href={f.url} target="_blank" rel="noreferrer">
              <img src={f.url} alt={f.legenda ?? 'Foto da moto'} className="h-36 w-full rounded-lg object-cover" />
            </a>
          ))}
        </div>
      )}

      {aberto ? (
        <div className="grid grid-cols-2 gap-3">
          <button disabled={enviando} onClick={() => responder(false)} className="rounded-lg bg-gray-200 px-4 py-4 font-semibold text-gray-800 disabled:opacity-50">
            Recusar
          </button>
          <button disabled={enviando} onClick={() => responder(true)} className="rounded-lg bg-green-600 px-4 py-4 font-semibold text-white disabled:opacity-50">
            Aprovar
          </button>
        </div>
      ) : (
        <p className="rounded-xl bg-white p-4 text-center font-semibold text-gray-800 shadow">
          {d.os.status === 'cancelado'
            ? 'Orçamento recusado.'
            : d.os.aprovado_em
              ? `Orçamento aprovado em ${new Date(d.os.aprovado_em).toLocaleString('pt-BR')}. Obrigado!`
              : 'Este orçamento já foi respondido.'}
        </p>
      )}
      {msg && <p className="rounded-lg bg-yellow-100 p-3 text-yellow-800">{msg}</p>}
    </div>
  )
}
