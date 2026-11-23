import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Solicitacao = {
  id: string; categoria: string; escopo: string; titulo: string; descricao: string;
  status: string; valor_estimado: number | null; resposta_admin: string | null; criado_em: string
}
const statusLabel: Record<string,string> = {
  pendente:'Pendente', em_analise:'Em análise', aprovada:'Aprovada',
  em_desenvolvimento:'Em desenvolvimento', concluida:'Concluída', recusada:'Recusada'
}
const campo = 'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-500'
export default function Suporte() {
  const { perfil, session } = useAuth()
  const [lista,setLista] = useState<Solicitacao[]>([])
  const [categoria,setCategoria] = useState('melhoria')
  const [escopo,setEscopo] = useState('exclusivo')
  const [titulo,setTitulo] = useState('')
  const [descricao,setDescricao] = useState('')
  const [erro,setErro] = useState('')
  const [aviso,setAviso] = useState('')
  const [ocupado,setOcupado] = useState(false)
  const carregar = useCallback(async () => {
    if (!perfil?.oficina.id) return
    const {data,error} = await supabase.from('solicitacoes_melhorias').select('id,categoria,escopo,titulo,descricao,status,valor_estimado,resposta_admin,criado_em').eq('oficina_id',perfil.oficina.id).order('criado_em',{ascending:false})
    if (error) setErro('Não foi possível carregar suas solicitações.')
    else setLista((data ?? []) as Solicitacao[])
  },[perfil?.oficina.id])
  useEffect(()=>{void carregar()},[carregar,session?.user.id])
  async function enviar(e:FormEvent) {
    e.preventDefault()
    if (!perfil?.oficina.id || !session?.user.id) return
    setOcupado(true); setErro(''); setAviso('')
    const {error} = await supabase.from('solicitacoes_melhorias').insert({
      oficina_id:perfil.oficina.id, criado_por:session.user.id, categoria, escopo,
      titulo:titulo.trim(), descricao:descricao.trim()
    })
    setOcupado(false)
    if (error) { setErro('Não foi possível enviar. Confira os dados e tente novamente.'); return }
    setTitulo(''); setDescricao(''); setAviso('Solicitação enviada. Você poderá acompanhar o andamento aqui.')
    await carregar()
  }
  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Atendimento</p><h1 className="mt-1 text-2xl font-bold text-gray-900">Suporte e melhorias</h1><p className="mt-2 text-sm text-gray-600">Peça correções, tire dúvidas ou solicite recursos exclusivos para sua oficina.</p></header>
    {erro && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
    {aviso && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
    <form onSubmit={enviar} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Nova solicitação</h2>
      <label className="block text-sm font-medium text-gray-700">Tipo
        <select className={campo+' mt-1'} value={categoria} onChange={e=>setCategoria(e.target.value)}>
          <option value="melhoria">Nova funcionalidade / melhoria</option><option value="correcao">Correção de problema</option><option value="duvida">Dúvida ou ajuda</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-gray-700">Esta solicitação é
        <select className={campo+' mt-1'} value={escopo} onChange={e=>setEscopo(e.target.value)}>
          <option value="exclusivo">Exclusiva da minha oficina</option><option value="geral">Pode beneficiar todas as oficinas</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-gray-700">Título
        <input className={campo+' mt-1'} minLength={4} maxLength={120} required value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ex.: Relatório de peças por período"/>
      </label>
      <label className="block text-sm font-medium text-gray-700">Explique o que você precisa
        <textarea className={campo+' mt-1'} rows={5} minLength={10} maxLength={4000} required value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Descreva como gostaria que funcionasse e qual problema resolveria."/>
      </label>
      <button disabled={ocupado} className="rounded-xl bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50">{ocupado?'Enviando...':'Enviar solicitação'}</button>
    </form>
    <section className="space-y-3">
      <div><h2 className="text-lg font-bold text-gray-900">Minhas solicitações</h2><p className="text-sm text-gray-500">Acompanhe as respostas e o andamento.</p></div>
      {lista.length===0 ? <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">Você ainda não enviou solicitações.</p> : lista.map(s=><article key={s.id} className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-gray-900">{s.titulo}</h3><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{statusLabel[s.status]??s.status}</span></div>
        <p className="text-sm text-gray-600">{s.descricao}</p>
        <p className="text-xs text-gray-500">{s.categoria==='melhoria'?'Melhoria':s.categoria==='correcao'?'Correção':'Dúvida'} · {s.escopo==='exclusivo'?'Exclusiva':'Pode ser geral'} · {new Date(s.criado_em).toLocaleDateString('pt-BR')}</p>
        {s.valor_estimado!==null && <p className="text-sm font-semibold text-gray-800">Valor estimado: {Number(s.valor_estimado).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>}
        {s.resposta_admin && <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700"><strong>Resposta:</strong> {s.resposta_admin}</div>}
      </article>)}
    </section>
  </div>
}
