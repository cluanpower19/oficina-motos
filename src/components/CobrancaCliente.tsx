import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { dataTeste } from '../lib/assinatura'

type Plano = { plano: string; preco: number }
type Pix = { tipo_chave: string | null; chave_pix: string | null; titular: string | null; instrucoes: string | null }
type Comprovante = { id: string; status: string; enviado_em: string; motivo_rejeicao: string | null }
type Notificacao = { id: string; tipo: string; titulo: string; mensagem: string; criado_em: string; lida_em: string | null }
type Pagamento = {
  id: string; plano: string; valor: number; status: string; criado_em: string
  confirmado_em: string | null; novo_vencimento: string | null; motivo_rejeicao: string | null
  comprovantes_assinatura: Comprovante[]
}

const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CobrancaCliente() {
  const { perfil, recarregarPerfil } = useAuth()
  const oficina = perfil!.oficina
  const [planos, setPlanos] = useState<Plano[]>([])
  const [pix, setPix] = useState<Pix | null>(null)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [planoEscolhido, setPlanoEscolhido] = useState(oficina.plano === 'completo' ? 'completo' : 'basico')
  const [carregando, setCarregando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [p, x, h, n] = await Promise.all([
      supabase.from('planos_cobranca').select('plano,preco').order('preco'),
      supabase.from('configuracao_pix').select('tipo_chave,chave_pix,titular,instrucoes').eq('id', true).maybeSingle(),
      supabase.from('pagamentos_assinatura').select('id,plano,valor,status,criado_em,confirmado_em,novo_vencimento,motivo_rejeicao,comprovantes_assinatura(id,status,enviado_em,motivo_rejeicao)').eq('oficina_id', oficina.id).order('criado_em', { ascending: false }),
      supabase.from('notificacoes_cobranca').select('id,tipo,titulo,mensagem,criado_em,lida_em').eq('oficina_id', oficina.id).order('criado_em',{ascending:false}).limit(5),
    ])
    if (p.error || x.error || h.error || n.error) setErro('Não foi possível carregar a cobrança. Atualize a página e tente novamente.')
    else {
      setPlanos((p.data ?? []) as Plano[])
      setPix(x.data as Pix | null)
      setPagamentos((h.data ?? []) as unknown as Pagamento[])
      setNotificacoes((n.data ?? []) as Notificacao[])
    }
    setCarregando(false)
  }, [oficina.id])

  useEffect(() => { void carregar() }, [carregar])

  async function solicitar() {
    setOcupado(true); setErro(''); setAviso('')
    const { error } = await supabase.rpc('solicitar_pagamento_assinatura', { p_plano: planoEscolhido })
    setOcupado(false)
    if (error) setErro(error.message.includes('cobrança em aberto') ? error.message : 'Não foi possível gerar a cobrança. ' + error.message)
    else { setAviso('Cobrança criada. Faça o Pix e envie o comprovante abaixo.'); await carregar() }
  }

  async function enviarComprovante(pagamento: Pagamento, e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (arquivo.size > 5 * 1024 * 1024) { setErro('O comprovante deve ter no máximo 5 MB.'); return }
    const extensao = arquivo.type === 'application/pdf' ? 'pdf'
      : arquivo.type === 'image/png' ? 'png'
      : arquivo.type === 'image/webp' ? 'webp'
      : arquivo.type === 'image/jpeg' ? 'jpg' : ''
    if (!extensao) { setErro('Envie um comprovante em PDF, JPG, PNG ou WEBP.'); return }
    setOcupado(true); setErro(''); setAviso('')
    const caminho = oficina.id + '/' + pagamento.id + '/' + crypto.randomUUID() + '.' + extensao
    const up = await supabase.storage.from('comprovantes-pix').upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })
    if (up.error) {
      setOcupado(false); setErro('Não foi possível enviar o arquivo: ' + up.error.message); return
    }
    const reg = await supabase.rpc('registrar_comprovante_assinatura', { p_pagamento_id: pagamento.id, p_caminho: caminho })
    setOcupado(false)
    if (reg.error) setErro('Arquivo enviado, mas não foi possível registrar o comprovante. Contate o suporte antes de enviar novamente.')
    else { setAviso('Comprovante enviado. A assinatura só será ativada após a conferência do Pix.'); await carregar() }
  }

  async function marcarLida(n: Notificacao) {
    if (n.lida_em) return
    const { error } = await supabase.from('notificacoes_cobranca').update({ lida_em: new Date().toISOString() }).eq('id', n.id)
    if (!error) setNotificacoes(v => v.map(x => x.id === n.id ? { ...x, lida_em: new Date().toISOString() } : x))
  }

  async function cancelar() {
    if (!window.confirm('Deseja cancelar a renovação automática? Seu acesso permanece até o fim do período já pago.')) return
    setOcupado(true); setErro(''); setAviso('')
    const { error } = await supabase.rpc('solicitar_cancelamento_assinatura')
    setOcupado(false)
    if (error) setErro(error.message)
    else { setAviso('Cancelamento agendado. Seu acesso permanece até o vencimento.'); await recarregarPerfil(); await carregar() }
  }

  const pendente = pagamentos.find(p => p.status === 'aguardando_comprovante' || p.status === 'em_analise')

  return (
    <section className="space-y-4 rounded-xl border border-orange-200 bg-white p-4 shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Pagamentos e renovação</h2>
          <p className="mt-1 text-sm text-gray-600">Pagamento manual por Pix. O comprovante será conferido pela administração antes da ativação.</p>
        </div>
        <button type="button" onClick={() => { void recarregarPerfil(); void carregar() }} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700">Atualizar status</button>
      </div>
      {erro && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {aviso && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{aviso}</p>}
      {carregando ? <p className="text-sm text-gray-500">Carregando dados de cobrança...</p> : <>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-medium text-gray-700">Plano
            <select value={planoEscolhido} onChange={e => setPlanoEscolhido(e.target.value)} disabled={Boolean(pendente)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-3">
              {planos.map(p => <option key={p.plano} value={p.plano}>{p.plano === 'completo' ? 'Completo' : 'Básico'} — {moeda(p.preco)}/mês</option>)}
            </select>
          </label>
          <button type="button" disabled={ocupado || Boolean(pendente) || !planos.length || !pix?.chave_pix} onClick={() => void solicitar()} className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {pendente ? 'Existe cobrança em aberto' : !pix?.chave_pix ? 'Pix ainda não configurado' : 'Gerar cobrança Pix'}
          </button>
        </div>
        {pendente && (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="font-semibold text-gray-800">Cobrança {pendente.status === 'em_analise' ? 'em análise' : 'aguardando comprovante'}</p>
            <p className="text-sm text-gray-700">{pendente.plano === 'completo' ? 'Plano Completo' : 'Plano Básico'} · {moeda(Number(pendente.valor))}</p>
            {pix?.chave_pix ? (
              <div className="space-y-1 text-sm text-gray-700">
                <p><strong>Chave Pix ({pix.tipo_chave ?? 'Pix'}):</strong> {pix.chave_pix}</p>
                {pix.titular && <p><strong>Favorecido:</strong> {pix.titular}</p>}
                {pix.instrucoes && <p>{pix.instrucoes}</p>}
                <button type="button" onClick={() => { void navigator.clipboard.writeText(pix.chave_pix!); setAviso('Chave Pix copiada.') }} className="rounded-lg bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800">Copiar chave Pix</button>
              </div>
            ) : <p className="text-sm text-amber-800">Os dados Pix ainda não foram configurados. Entre em contato com o suporte.</p>}
            {pendente.status === 'aguardando_comprovante' && <label className="block text-sm font-semibold text-gray-700">Enviar comprovante (PDF ou imagem, até 5 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={ocupado} onChange={e => void enviarComprovante(pendente,e)} className="mt-2 block w-full text-sm" />
            </label>}
            {pendente.status === 'em_analise' && <p className="text-sm text-gray-700">Seu comprovante foi recebido. Aguarde a conferência administrativa.</p>}
          </div>
        )}
        {oficina.status_assinatura === 'ativo' && oficina.vencimento_assinatura && !oficina.cancelamento_agendado && (
          <button type="button" disabled={ocupado} onClick={() => void cancelar()} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50">Cancelar renovação</button>
        )}
        {oficina.cancelamento_agendado && <p className="text-sm text-amber-800">Renovação cancelada. Seu acesso termina em {dataTeste(oficina.vencimento_assinatura)}.</p>}
        {notificacoes.length > 0 && <div className="space-y-2"><h3 className="font-semibold text-gray-800">Avisos da assinatura</h3>{notificacoes.map(n => <button type="button" key={n.id} onClick={() => void marcarLida(n)} className={'block w-full rounded-lg border p-3 text-left '+(n.lida_em?'border-gray-200 bg-white':'border-orange-200 bg-orange-50')}><strong className="text-sm text-gray-800">{n.titulo}</strong><p className="mt-1 text-sm text-gray-700">{n.mensagem}</p><span className="text-xs text-gray-500">{new Date(n.criado_em).toLocaleString('pt-BR')}{n.lida_em?' · lida':' · toque para marcar como lida'}</span></button>)}</div>}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800">Histórico de pagamentos</h3>
          {pagamentos.length === 0 ? <p className="text-sm text-gray-500">Nenhum pagamento registrado.</p> : pagamentos.map(p => (
            <article key={p.id} className="rounded-lg border border-gray-200 p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{p.plano === 'completo' ? 'Completo' : 'Básico'} · {moeda(Number(p.valor))}</strong>
                <span>{p.status === 'confirmado' ? 'Confirmado' : p.status === 'em_analise' ? 'Em análise' : p.status === 'cancelado' ? 'Cancelado' : 'Aguardando comprovante'}</span>
              </div>
              <p className="mt-1 text-gray-500">Solicitado em {new Date(p.criado_em).toLocaleDateString('pt-BR')}</p>
              {p.novo_vencimento && <p className="text-gray-600">Vencimento do ciclo: {dataTeste(p.novo_vencimento)}</p>}
              {p.comprovantes_assinatura?.map(c => c.status === 'rejeitado' && <p key={c.id} className="mt-2 rounded bg-red-50 p-2 text-red-700">Comprovante rejeitado: {c.motivo_rejeicao}</p>)}
            </article>
          ))}
        </div>
      </>}
    </section>
  )
}
