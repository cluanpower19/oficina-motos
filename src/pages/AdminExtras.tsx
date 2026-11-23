import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Oficina={id:string;nome:string}
type Sol={id:string;oficina_id:string;categoria:string;escopo:string;titulo:string;descricao:string;status:string;valor_estimado:number|null;resposta_admin:string|null;criado_em:string;oficinas?:{nome:string}|null}
type Flag={id:string;oficina_id:string;chave:string;nome:string;descricao:string|null;habilitado:boolean}
const status=[['pendente','Pendente'],['em_analise','Em análise'],['aprovada','Aprovada'],['em_desenvolvimento','Em desenvolvimento'],['concluida','Concluída'],['recusada','Recusada']]
const campo='w-full rounded-lg border border-slate-600 bg-[#0a111b] px-3 py-2.5 text-sm text-white outline-none focus:border-orange-400'
export default function AdminExtras(){
 const loc=useLocation(); const {sair}=useAuth(); const aba=loc.pathname.includes('recursos')?'recursos':'solicitacoes'
 const [oficinas,setOficinas]=useState<Oficina[]>([]); const [sols,setSols]=useState<Sol[]>([]); const [flags,setFlags]=useState<Flag[]>([])
 const [selecionada,setSelecionada]=useState(''); const [filtro,setFiltro]=useState('todas')
 const [edicoes,setEdicoes]=useState<Record<string,{status:string;valor:string;resposta:string}>>({})
 const [nome,setNome]=useState(''); const [chave,setChave]=useState(''); const [descricao,setDescricao]=useState('')
 const [erro,setErro]=useState(''); const [aviso,setAviso]=useState(''); const [busy,setBusy]=useState(false)
 const carregar=useCallback(async()=>{
  setErro('')
  const [o,s,f]=await Promise.all([
   supabase.rpc('admin_listar_oficinas'),
   supabase.from('solicitacoes_melhorias').select('id,oficina_id,categoria,escopo,titulo,descricao,status,valor_estimado,resposta_admin,criado_em,oficinas(nome)').order('criado_em',{ascending:false}),
   supabase.from('oficina_funcionalidades').select('*').order('nome')
  ])
  if(o.error) setErro(o.error.message); else {const list=(o.data??[]) as Oficina[];setOficinas(list);if(!selecionada&&list[0])setSelecionada(list[0].id)}
  if(s.error) setErro(s.error.message); else {const list=(s.data??[]) as unknown as Sol[];setSols(list);setEdicoes(Object.fromEntries(list.map(x=>[x.id,{status:x.status,valor:x.valor_estimado===null?'':String(x.valor_estimado),resposta:x.resposta_admin??''}])))}
  if(f.error) setErro(f.error.message); else setFlags((f.data??[]) as Flag[])
 },[selecionada])
 useEffect(()=>{void carregar()},[carregar])
 const filtradas=useMemo(()=>sols.filter(s=>filtro==='todas'||s.status===filtro),[sols,filtro])
 async function salvarSol(s:Sol){
  const e=edicoes[s.id];setBusy(true);setErro('');setAviso('')
  const valor=e.valor.trim()===''?null:Number(e.valor.replace(',','.'))
  if(valor!==null&&(!Number.isFinite(valor)||valor<0)){setErro('Informe um valor válido.');setBusy(false);return}
  const {error}=await supabase.from('solicitacoes_melhorias').update({status:e.status,valor_estimado:valor,resposta_admin:e.resposta.trim()||null,atualizado_em:new Date().toISOString()}).eq('id',s.id)
  setBusy(false);if(error)setErro(error.message);else{setAviso('Solicitação atualizada.');await carregar()}
 }
 async function criarFlag(){
  if(!selecionada||!nome.trim()||! /^[a-z][a-z0-9_]{1,59}$/.test(chave)){setErro('Informe nome e uma chave válida (minúsculas, números e _).');return}
  setBusy(true);setErro('');const {error}=await supabase.from('oficina_funcionalidades').insert({oficina_id:selecionada,nome:nome.trim(),chave,descricao:descricao.trim()||null,habilitado:false})
  setBusy(false);if(error)setErro(error.message);else{setNome('');setChave('');setDescricao('');setAviso('Recurso cadastrado desativado.');await carregar()}
 }
 async function alternar(f:Flag){
  setBusy(true);setErro('');const {error}=await supabase.from('oficina_funcionalidades').update({habilitado:!f.habilitado,atualizado_em:new Date().toISOString()}).eq('id',f.id)
  setBusy(false);if(error)setErro(error.message);else{setAviso('Permissão do recurso atualizada.');await carregar()}
 }
 return <div className="min-h-screen bg-[#080d14] text-slate-100">
  <header className="border-b border-white/10 bg-[#101925]"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-400">Ofício do Motor · Administração</p><h1 className="text-2xl font-bold">Central de personalizações</h1></div><div className="flex gap-2"><Link to="/admin" className="rounded-lg border border-white/10 px-3 py-2 text-sm">Oficinas</Link><button onClick={()=>void sair()} className="rounded-lg border border-white/10 px-3 py-2 text-sm">Sair</button></div></div></header>
  <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
   <nav className="flex flex-wrap gap-2"><Link to="/admin/solicitacoes" className={'rounded-lg px-4 py-2 text-sm font-semibold '+(aba==='solicitacoes'?'bg-orange-500 text-black':'bg-white/5 text-slate-300')}>Solicitações ({sols.length})</Link><Link to="/admin/recursos" className={'rounded-lg px-4 py-2 text-sm font-semibold '+(aba==='recursos'?'bg-orange-500 text-black':'bg-white/5 text-slate-300')}>Recursos exclusivos</Link></nav>
   {erro&&<p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}{aviso&&<p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-300">{aviso}</p>}
   {aba==='solicitacoes'?<section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Solicitações dos clientes</h2><p className="text-sm text-slate-400">Avalie pedidos, defina valores e atualize o andamento.</p></div><select className={campo+' max-w-xs'} value={filtro} onChange={e=>setFiltro(e.target.value)}><option value="todas">Todos os status</option>{status.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
    {filtradas.map(s=>{const e=edicoes[s.id]??{status:s.status,valor:'',resposta:''};return <article key={s.id} className="space-y-3 rounded-2xl border border-white/10 bg-[#101925] p-5"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-xs font-semibold text-orange-400">{s.oficinas?.nome??'Oficina'} · {s.escopo==='exclusivo'?'Solicitação exclusiva':'Pode ser geral'}</p><h3 className="mt-1 text-lg font-bold">{s.titulo}</h3></div><span className="text-xs text-slate-500">{new Date(s.criado_em).toLocaleDateString('pt-BR')}</span></div><p className="whitespace-pre-wrap text-sm text-slate-300">{s.descricao}</p><div className="grid gap-3 md:grid-cols-3"><label className="text-xs text-slate-400">Status<select className={campo+' mt-1'} value={e.status} onChange={ev=>setEdicoes(p=>({...p,[s.id]:{...e,status:ev.target.value}}))}>{status.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label className="text-xs text-slate-400">Valor estimado (R$)<input className={campo+' mt-1'} inputMode="decimal" value={e.valor} onChange={ev=>setEdicoes(p=>({...p,[s.id]:{...e,valor:ev.target.value}}))} placeholder="Deixe vazio se gratuito"/></label><label className="text-xs text-slate-400">Tipo<p className="mt-2 text-sm text-slate-200">{s.categoria==='melhoria'?'Melhoria':s.categoria==='correcao'?'Correção':'Dúvida'}</p></label></div><label className="block text-xs text-slate-400">Resposta para o cliente<textarea className={campo+' mt-1'} rows={2} value={e.resposta} onChange={ev=>setEdicoes(p=>({...p,[s.id]:{...e,resposta:ev.target.value}}))}/></label><button disabled={busy} onClick={()=>void salvarSol(s)} className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">Salvar atualização</button></article>})}
    {filtradas.length===0&&<p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-400">Nenhuma solicitação neste filtro.</p>}
   </section>:<section className="space-y-4"><div><h2 className="text-lg font-bold">Recursos exclusivos por oficina</h2><p className="text-sm text-slate-400">Cadastre e libere permissões de módulos somente para a oficina selecionada.</p></div>
    <div className="rounded-2xl border border-white/10 bg-[#101925] p-5"><label className="block text-sm text-slate-300">Oficina<select className={campo+' mt-1'} value={selecionada} onChange={e=>setSelecionada(e.target.value)}>{oficinas.map(o=><option key={o.id} value={o.id}>{o.nome}</option>)}</select></label>
     <div className="mt-5 grid gap-3 md:grid-cols-3"><label className="text-xs text-slate-400">Nome do recurso<input className={campo+' mt-1'} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Estoque avançado"/></label><label className="text-xs text-slate-400">Chave técnica<input className={campo+' mt-1'} value={chave} onChange={e=>setChave(e.target.value)} placeholder="estoque_avancado"/></label><label className="text-xs text-slate-400">Descrição<input className={campo+' mt-1'} value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Módulo contratado"/></label></div><button disabled={busy} onClick={()=>void criarFlag()} className="mt-3 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">Cadastrar recurso</button>
    </div>
    <div className="space-y-2">{flags.filter(f=>f.oficina_id===selecionada).map(f=><article key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#101925] p-4"><div><h3 className="font-semibold">{f.nome}</h3><p className="text-xs text-slate-400">{f.chave} · {f.descricao??'Sem descrição'}</p></div><button disabled={busy} onClick={()=>void alternar(f)} className={'rounded-lg px-4 py-2 text-sm font-bold '+(f.habilitado?'bg-emerald-500/15 text-emerald-300':'bg-white/10 text-slate-300')}>{f.habilitado?'Ativado':'Desativado'} · Alterar</button></article>)}{flags.filter(f=>f.oficina_id===selecionada).length===0&&<p className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">Nenhum recurso cadastrado para esta oficina.</p>}</div>
   </section>}
  </main>
 </div>
}
