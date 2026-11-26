import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Comprovante = { id: string; caminho_arquivo: string; status: string; enviado_em: string; motivo_rejeicao: string | null }
type Pagamento = {
  id: string; oficina_id: string; plano: string; valor: number; status: string; criado_em: string
  confirmado_em: string | null; novo_vencimento: string | null; motivo_rejeicao: string | null
  oficinas: { nome: string } | null
  comprovantes_assinatura: Comprovante[]
}
type Plano = { plano: string; preco: number }
type Pix = { tipo_chave: string | null; chave_pix: string | null; titular: string | null; instrucoes: string | null }

const dinheiro = (n: number) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AdminCobrancas() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [precos, setPrecos] = useState<Record<string,string>>({})
  const [pix, setPix] = useState<Pix>({ tipo_chave: 'aleatoria', chave_pix: '', titular: '', instrucoes: '' })
  const [motivos, setMotivos] = useState<Record<string,string>>({})
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true); setErro('')
    const [h,p,x] = await Promise.all([
      supabase.from('pagamentos_assinatura').select('id,oficina_id,plano,valor,status,criado_em,confirmado_em,novo_vencimento,motivo_rejeicao,oficinas(nome),comprovantes_assinatura(id,caminho_arquivo,status,enviado_em,motivo_rejeicao)').order('criado_em',{ascending:false}),
      supabase.from('planos_cobranca').select('plano,preco').order('plano'),
      supabase.from('configuracao_pix').select('tipo_chave,chave_pix,titular,instrucoes').eq('id',true).maybeSingle(),
    ])
    if(h.error || p.error || x.error) setErro('Não foi possível carregar o painel de cobrança. ' + (h.error?.message || p.error?.message || x.error?.message))
    else {
      setPagamentos((h.data ?? []) as unknown as Pagamento[])
      setPrecos(Object.fromEntries(((p.data ?? []) as Plano[]).map(v=>[v.plano,String(v.preco)])))
      if(x.data) setPix(x.data as Pix)
    }
    setCarregando(false)
  }, [])

  useEffect(()=>{void carregar()},[carregar])

  async function salvarConfiguracao() {
    if (!Number.isFinite(Number(precos.basico)) || Number(precos.basico) <= 0 ||
        !Number.isFinite(Number(precos.completo)) || Number(precos.completo) <= 0) {
      setErro('Informe preços válidos e maiores que zero para os dois planos.')
      return
    }
    setOcupado('config'); setErro(''); setAviso('')
    const atualizacoes = await Promise.all([
      ...(['basico','completo'] as const).map(plano => supabase.from('planos_cobranca').update({preco:Number(precos[plano])}).eq('plano',plano)),
      supabase.from('configuracao_pix').update({
        tipo_chave: pix.tipo_chave || null, chave_pix: pix.chave_pix?.trim() || null,
        titular: pix.titular?.trim() || null, instrucoes: pix.instrucoes?.trim() || null,
      }).eq('id',true),
    ])
    setOcupado('')
    const falha = atualizacoes.find(r=>r.error)?.error
    if(falha) setErro('Não foi possível salvar a configuração: '+falha.message)
    else {setAviso('Preços e dados Pix atualizados.'); await carregar()}
  }

  async function visualizar(c: Comprovante) {
    setOcupado(c.id); setErro('')
    const {data,error}=await supabase.storage.from('comprovantes-pix').createSignedUrl(c.caminho_arquivo,300)
    setOcupado('')
    if(error) setErro('Não foi possível abrir o comprovante: '+error.message)
    else window.open(data.signedUrl,'_blank','noopener,noreferrer')
  }

  async function confirmar(c: Comprovante) {
    if(!window.confirm('Você conferiu o recebimento real do Pix na conta? Confirmar ativa a assinatura.')) return
    setOcupado(c.id); setErro(''); setAviso('')
    const {error}=await supabase.rpc('admin_confirmar_comprovante',{p_comprovante_id:c.id})
    setOcupado('')
    if(error) setErro('Não foi possível confirmar: '+error.message)
    else {setAviso('Pagamento confirmado e assinatura atualizada.'); await carregar()}
  }

  async function rejeitar(c: Comprovante) {
    const motivo=motivos[c.id]?.trim()
    if(!motivo){setErro('Informe o motivo antes de rejeitar o comprovante.');return}
    setOcupado(c.id);setErro('');setAviso('')
    const {error}=await supabase.rpc('admin_rejeitar_comprovante',{p_comprovante_id:c.id,p_motivo:motivo})
    setOcupado('')
    if(error) setErro('Não foi possível rejeitar: '+error.message)
    else {setAviso('Comprovante rejeitado. O cliente poderá enviar outro.');setMotivos(v=>({...v,[c.id]:''}));await carregar()}
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-[#101925] p-5">
        <h2 className="text-lg font-bold">Configuração comercial e Pix</h2>
        <p className="mt-1 text-sm text-slate-400">Os preços são editáveis. A chave Pix é exibida somente a usuários autenticados.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Plano Básico (R$ / mês)
            <input type="number" min="0.01" step="0.01" value={precos.basico??''} onChange={e=>setPrecos(v=>({...v,basico:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white"/>
          </label>
          <label className="text-sm text-slate-300">Plano Completo (R$ / mês)
            <input type="number" min="0.01" step="0.01" value={precos.completo??''} onChange={e=>setPrecos(v=>({...v,completo:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white"/>
          </label>
          <label className="text-sm text-slate-300">Tipo de chave Pix
            <select value={pix.tipo_chave??'aleatoria'} onChange={e=>setPix(v=>({...v,tipo_chave:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white">
              <option value="cpf">CPF</option><option value="cnpj">CNPJ</option><option value="email">E-mail</option><option value="telefone">Telefone</option><option value="aleatoria">Aleatória</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">Chave Pix
            <input value={pix.chave_pix??''} onChange={e=>setPix(v=>({...v,chave_pix:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white"/>
          </label>
          <label className="text-sm text-slate-300">Titular / favorecido
            <input value={pix.titular??''} onChange={e=>setPix(v=>({...v,titular:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white"/>
          </label>
          <label className="text-sm text-slate-300">Instruções adicionais
            <input value={pix.instrucoes??''} onChange={e=>setPix(v=>({...v,instrucoes:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#090f17] p-3 text-white"/>
          </label>
        </div>
        <button disabled={ocupado==='config'} onClick={()=>void salvarConfiguracao()} className="mt-4 rounded-lg bg-orange-500 px-5 py-3 font-bold text-slate-950 disabled:opacity-50">{ocupado==='config'?'Salvando...':'Salvar configuração'}</button>
      </section>

      {erro && <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{erro}</p>}
      {aviso && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{aviso}</p>}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101925]">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div><h2 className="text-lg font-bold">Pagamentos e comprovantes</h2><p className="mt-1 text-sm text-slate-400">Confira o recebimento na conta antes de confirmar.</p></div>
          <button onClick={()=>void carregar()} disabled={carregando} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">Atualizar</button>
        </div>
        {carregando ? <p className="p-8 text-center text-slate-400">Carregando...</p> : pagamentos.length===0 ? <p className="p-8 text-center text-slate-400">Nenhuma cobrança registrada.</p> : (
          <div className="divide-y divide-white/10">
            {pagamentos.map(p=>(
              <article key={p.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div><h3 className="font-bold text-white">{p.oficinas?.nome??'Oficina'} · {p.plano==='completo'?'Completo':'Básico'}</h3><p className="mt-1 text-sm text-slate-400">{dinheiro(Number(p.valor))} · {new Date(p.criado_em).toLocaleString('pt-BR')}</p></div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{p.status==='confirmado'?'Confirmado':p.status==='em_analise'?'Em análise':p.status==='cancelado'?'Cancelado':'Aguardando comprovante'}</span>
                </div>
                {p.novo_vencimento && <p className="text-sm text-slate-400">Vencimento aplicado: {new Date(p.novo_vencimento+'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                {p.comprovantes_assinatura?.map(c=>(
                  <div key={c.id} className="space-y-2 rounded-xl border border-white/10 bg-[#0b121b] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-slate-300">Comprovante enviado em {new Date(c.enviado_em).toLocaleString('pt-BR')} · {c.status}</span>
                      <button disabled={ocupado===c.id} onClick={()=>void visualizar(c)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200">{ocupado===c.id?'Abrindo...':'Visualizar comprovante'}</button>
                    </div>
                    {c.status==='em_analise' && p.status==='em_analise' && <>
                      <label className="block text-xs text-slate-400">Motivo obrigatório se rejeitar
                        <input value={motivos[c.id]??''} onChange={e=>setMotivos(v=>({...v,[c.id]:e.target.value}))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#101925] p-2.5 text-sm text-white" placeholder="Ex.: valor não identificado na conta"/>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button disabled={Boolean(ocupado)} onClick={()=>void confirmar(c)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Confirmar recebimento</button>
                        <button disabled={Boolean(ocupado)} onClick={()=>void rejeitar(c)} className="rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-300">Rejeitar comprovante</button>
                      </div>
                    </>}
                    {c.motivo_rejeicao && <p className="text-sm text-red-300">Motivo: {c.motivo_rejeicao}</p>}
                  </div>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
