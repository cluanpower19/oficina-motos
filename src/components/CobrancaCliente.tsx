import { useCallback, useEffect, useState, type ChangeEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { dataTeste } from '../lib/assinatura'
import './cobranca-cliente.css'

type Plano = { plano: string; preco: number }
type Pix = { tipo_chave: string | null; chave_pix: string | null; titular: string | null; instrucoes: string | null }
type Comprovante = { id: string; status: string; enviado_em: string; motivo_rejeicao: string | null }
type Notificacao = { id: string; tipo: string; titulo: string; mensagem: string; criado_em: string; lida_em: string | null }
type Pagamento = {
  id: string; plano: string; valor: number; status: string; criado_em: string
  confirmado_em: string | null; novo_vencimento: string | null; motivo_rejeicao: string | null
  provedor: string; pix_payload: string | null; pix_encoded_image: string | null; pix_expira_em: string | null
  comprovantes_assinatura: Comprovante[]
}

const moeda = (valor: number) => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = (valor: string) => new Date(valor).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const nomePlano = (plano: string) => plano === 'completo' ? 'Completo' : 'Básico'
const tiposChave: Record<string, string> = { cpf: 'CPF', cnpj: 'CNPJ', email: 'E-mail', telefone: 'Telefone', aleatoria: 'Chave aleatória' }
const tipoChave = (tipo: string | null) => tiposChave[tipo ?? ''] ?? 'Chave Pix'

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
  const [copiado, setCopiado] = useState(false)
  const [documento, setDocumento] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const [p, x, h, n] = await Promise.all([
      supabase.from('planos_cobranca').select('plano,preco').order('preco'),
      supabase.from('configuracao_pix').select('tipo_chave,chave_pix,titular,instrucoes').eq('id', true).maybeSingle(),
      supabase.from('pagamentos_assinatura').select('id,plano,valor,status,criado_em,confirmado_em,novo_vencimento,motivo_rejeicao,provedor,pix_payload,pix_encoded_image,pix_expira_em,comprovantes_assinatura(id,status,enviado_em,motivo_rejeicao)').eq('oficina_id', oficina.id).order('criado_em', { ascending: false }),
      supabase.from('notificacoes_cobranca').select('id,tipo,titulo,mensagem,criado_em,lida_em').eq('oficina_id', oficina.id).order('criado_em',{ascending:false}).limit(5),
    ])
    if (p.error || x.error || h.error || n.error) {
      setErro('Não foi possível carregar os dados de pagamento. Confira sua conexão e tente atualizar.')
    } else {
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
    else { setAviso('Cobrança criada. Confira os dados do PIX e envie o comprovante após pagar.'); await carregar() }
  }

  async function solicitarAsaas() {
    const digits = documento.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) { setErro('Informe um CPF (11 números) ou CNPJ (14 números) válido.'); return }
    setOcupado(true); setErro(''); setAviso('')
    const { data, error } = await supabase.functions.invoke('criar-cobranca-pix', { body: { plano: planoEscolhido, cpfCnpj: digits } })
    setOcupado(false)
    if (error || !data?.success) { setErro(data?.error || error?.message || 'Não foi possível gerar o PIX. Tente novamente.'); return }
    setDocumento('')
    setAviso('PIX gerado. Pague pelo QR Code ou copie e cole o código no aplicativo do seu banco.')
    await carregar()
  }

  async function copiarPayload(payload: string) {
    try { await navigator.clipboard.writeText(payload); setCopiado(true); setAviso('Código PIX Copia e Cola copiado.'); window.setTimeout(() => setCopiado(false), 2500) }
    catch { setErro('Não foi possível copiar automaticamente. Selecione e copie o código PIX.') }
  }

  async function copiarChave() {
    if (!pix?.chave_pix) return
    try {
      await navigator.clipboard.writeText(pix.chave_pix)
      setCopiado(true)
      setAviso('Chave PIX copiada. Cole no aplicativo do seu banco.')
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setErro('Não foi possível copiar automaticamente. Selecione e copie a chave exibida.')
    }
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
    if (reg.error) setErro('O arquivo foi enviado, mas não conseguimos registrar o comprovante. Contate o suporte antes de tentar novamente.')
    else { setAviso('Comprovante recebido. A assinatura será ativada após a conferência do pagamento.'); await carregar() }
  }

  async function marcarLida(n: Notificacao) {
    if (n.lida_em) return
    const agora = new Date().toISOString()
    const { error } = await supabase.from('notificacoes_cobranca').update({ lida_em: agora }).eq('id', n.id)
    if (!error) setNotificacoes(v => v.map(x => x.id === n.id ? { ...x, lida_em: agora } : x))
  }

  async function cancelar() {
    if (!window.confirm('Deseja programar o encerramento da assinatura? Seu acesso permanece até o fim do período já pago.')) return
    setOcupado(true); setErro(''); setAviso('')
    const { error } = await supabase.rpc('solicitar_cancelamento_assinatura')
    setOcupado(false)
    if (error) setErro(error.message)
    else { setAviso('Cancelamento agendado. Seu acesso permanece até o vencimento.'); await recarregarPerfil(); await carregar() }
  }

  const pendente = pagamentos.find(p => p.status === 'aguardando_comprovante' || p.status === 'aguardando_pagamento' || p.status === 'em_analise')
  const precoEscolhido = planos.find(p => p.plano === planoEscolhido)?.preco
  const pagamentoConfirmado = pagamentos.find(p => p.status === 'confirmado')
  const statusPagamento = (status: string) => status === 'confirmado' ? 'Pagamento confirmado' : status === 'em_analise' ? 'Comprovante em análise' : status === 'cancelado' ? 'Cobrança cancelada' : status === 'aguardando_pagamento' ? 'Aguardando pagamento' : 'Aguardando comprovante'

  return (
    <section className="cc-shell" aria-labelledby="cc-title">
      <div className="cc-heading">
        <div>
          <span className="cc-eyebrow">ÁREA FINANCEIRA · ASSINATURA</span>
          <h2 id="cc-title">Pagamentos e renovação</h2>
          <p>Gerencie seu plano e acompanhe cada etapa da ativação.</p>
        </div>
        <button type="button" onClick={() => { void recarregarPerfil(); void carregar() }} className="cc-refresh" disabled={carregando}>↻ <span>Atualizar</span></button>
      </div>

      <div className="cc-trust-row">
        <span><b>✓</b> PIX dinâmico ou manual</span>
        <span><b>✓</b> Comprovante privado</span>
        <span><b>✓</b> Ativação após conferência</span>
      </div>

      {erro && <p role="alert" className="cc-feedback cc-error">{erro}</p>}
      {aviso && <p role="status" className="cc-feedback cc-success">{aviso}</p>}

      {carregando ? <div className="cc-loading"><span className="cc-spinner" /> Carregando informações de pagamento...</div> : <>
        <div className="cc-current-plan">
          <div className="cc-current-icon" aria-hidden="true">✦</div>
          <div className="cc-current-copy">
            <span>PLANO ATUAL DA OFICINA</span>
            <strong>{nomePlano(oficina.plano)}</strong>
            <small>{oficina.status_assinatura === 'teste' ? 'Você está no período de teste grátis.' : oficina.status_assinatura === 'ativo' ? 'Sua assinatura está ativa.' : 'Seu acesso está em modo de consulta.'}</small>
          </div>
          {oficina.vencimento_assinatura && <div className="cc-current-date"><span>VENCIMENTO</span><strong>{dataTeste(oficina.vencimento_assinatura)}</strong></div>}
        </div>

        {!pendente && !oficina.cancelamento_agendado && (
          <div className="cc-select-plan">
            <div className="cc-section-heading">
              <div><span>01 / ESCOLHA</span><h3>Selecione seu plano</h3></div>
              <small>Valores mensais · em reais</small>
            </div>
            <div className="cc-plan-grid">
              {planos.map(p => {
                const completo = p.plano === 'completo'
                const selecionado = planoEscolhido === p.plano
                return (
                  <button type="button" key={p.plano} onClick={() => setPlanoEscolhido(p.plano)} aria-pressed={selecionado} className={'cc-plan-card'+(selecionado?' is-selected':'')}>
                    {completo && <span className="cc-recommended">MAIS RECURSOS</span>}
                    <span className="cc-plan-name">{nomePlano(p.plano)}</span>
                    <span className="cc-plan-price">{moeda(Number(p.preco))}<small>/mês</small></span>
                    <span className="cc-plan-description">{completo ? 'Gestão completa da rotina e do financeiro da oficina.' : 'Organização essencial dos clientes e serviços.'}</span>
                    <span className="cc-plan-features">{completo ? '✓ Estoque  ✓ Lembretes  ✓ Financeiro' : '✓ Clientes  ✓ Motocicletas  ✓ Ordens de serviço'}</span>
                    <span className="cc-plan-choice">{selecionado ? '✓ Plano selecionado' : 'Selecionar este plano'}</span>
                  </button>
                )
              })}
            </div>
            <div className="cc-order-summary">
              <div><span>RESUMO DA CONTRATAÇÃO</span><strong>Plano {nomePlano(planoEscolhido)}</strong><small>Pagamento mensal por PIX · sem cobrança automática</small></div>
              <div className="cc-order-value"><span>VALOR DO CICLO</span><strong>{precoEscolhido === undefined ? '—' : moeda(Number(precoEscolhido))}</strong></div>
            </div>
            <div className="cc-document-field">
              <label htmlFor="cc-cpf-cnpj">CPF ou CNPJ do responsável pelo pagamento</label>
              <input id="cc-cpf-cnpj" type="text" inputMode="numeric" autoComplete="off" maxLength={18} placeholder="Digite somente números ou use a pontuação" value={documento} onChange={e => setDocumento(e.target.value.replace(/[^0-9./-]/g, '').slice(0,18))} />
              <small>Usado para identificar o pagador no Asaas. O documento não será armazenado no banco do Ofício do Motor.</small>
            </div>
            <button type="button" disabled={ocupado || !planos.length || documento.replace(/\D/g,'').length < 11 || precoEscolhido === undefined} onClick={() => void solicitarAsaas()} className="cc-primary-action">
              {ocupado ? 'Preparando cobrança...' : 'Gerar PIX com QR Code'} <span>→</span>
            </button>
            {pix?.chave_pix && <button type="button" disabled={ocupado || precoEscolhido === undefined} onClick={() => void solicitar()} className="cc-manual-action">Usar PIX manual (chave e comprovante)</button>}
            <p className="cc-no-surprise">Nenhuma cobrança é feita ao selecionar o plano. O QR Code é individual e o acesso é liberado após a confirmação do pagamento pelo Asaas.</p>
          </div>
        )}

        {pendente && (
          <div className="cc-payment-flow">
            <div className="cc-section-heading">
              <div><span>02 / PAGAMENTO EM ANDAMENTO</span><h3>Conclua sua ativação</h3></div>
              <span className={'cc-status-pill '+(pendente.status === 'em_analise' ? 'is-review' : 'is-pending')}>{statusPagamento(pendente.status)}</span>
            </div>
            <div className="cc-steps">
              <div className="is-done"><b>1</b><span>Cobrança criada</span></div>
              <div className={pendente.status === 'em_analise' ? 'is-done' : 'is-current'}><b>2</b><span>PIX e comprovante</span></div>
              <div className={pendente.status === 'em_analise' ? 'is-current' : ''}><b>3</b><span>Conferência</span></div>
              <div><b>4</b><span>Acesso liberado</span></div>
            </div>
            <div className="cc-payment-summary">
              <div><span>PLANO</span><strong>{nomePlano(pendente.plano)}</strong></div>
              <div><span>VALOR EXATO</span><strong className="cc-highlight">{moeda(Number(pendente.valor))}</strong></div>
              <div><span>SOLICITADO EM</span><strong>{dataHora(pendente.criado_em)}</strong></div>
            </div>
            {pendente.provedor === 'asaas' && pendente.pix_payload ? (
              <div className="cc-pix-card cc-asaas-pix">
                <div className="cc-pix-top"><span className="cc-pix-symbol">PIX</span><div><strong>PIX dinâmico gerado pelo Asaas</strong><small>Escaneie o QR Code ou use o código Copia e Cola.</small></div></div>
                {pendente.pix_encoded_image && <img className="cc-asaas-qr" src={'data:image/png;base64,' + pendente.pix_encoded_image} alt="QR Code PIX para pagamento" />}
                <div className="cc-pix-detail"><span>PIX COPIA E COLA</span><strong className="cc-pix-key">{pendente.pix_payload}</strong></div>
                <button type="button" onClick={() => void copiarPayload(pendente.pix_payload!)} className="cc-copy-button">{copiado ? '✓ Código copiado' : '▣ Copiar código PIX'}</button>
                {pendente.pix_expira_em && <p className="cc-pix-instructions">Válido até {dataHora(pendente.pix_expira_em)}. Se expirar, solicite uma nova cobrança.</p>}
                <div className="cc-security-note"><b>Pagamento seguro:</b> confira o valor e o nome do recebedor no aplicativo do banco. A confirmação é automática após o retorno do Asaas.</div>
              </div>
            ) : pendente.status === 'aguardando_comprovante' && pix?.chave_pix ? (
              <div className="cc-pix-card">
                <div className="cc-pix-top"><span className="cc-pix-symbol">PIX</span><div><strong>Faça a transferência pelo aplicativo do seu banco</strong><small>Confira o favorecido antes de confirmar a operação.</small></div></div>
                <div className="cc-pix-detail"><span>{tipoChave(pix.tipo_chave)}</span><strong className="cc-pix-key">{pix.chave_pix}</strong></div>
                {pix.titular && <div className="cc-pix-detail"><span>FAVORECIDO</span><strong>{pix.titular}</strong></div>}
                <button type="button" onClick={() => void copiarChave()} className="cc-copy-button">{copiado ? '✓ Chave copiada' : '▣ Copiar chave PIX'}</button>
                {pix.instrucoes && <p className="cc-pix-instructions">{pix.instrucoes}</p>}
                <div className="cc-security-note"><b>Importante:</b> a chave PIX acima é o dado configurado para recebimento. Confirme nome e valor no aplicativo do banco antes de pagar.</div>
              </div>
            ) : pendente.status === 'em_analise' ? (
              <div className="cc-review-panel"><span className="cc-review-icon">◷</span><div><strong>Comprovante recebido com sucesso</strong><p>A administração está conferindo o pagamento. Você verá a atualização aqui assim que a análise for concluída. Não envie outro comprovante enquanto este estiver em análise.</p></div></div>
            ) : <p className="cc-feedback cc-error">Os dados PIX não estão disponíveis no momento. Fale com o suporte para receber orientação.</p>}
            {pendente.status === 'aguardando_comprovante' && (
              <label className="cc-upload">
                <span className="cc-upload-icon">↑</span>
                <span><strong>Depois de pagar, envie o comprovante</strong><small>PDF, JPG, PNG ou WEBP · máximo de 5 MB</small></span>
                <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={ocupado} onChange={e => void enviarComprovante(pendente,e)} />
                <span className="cc-upload-button">{ocupado ? 'Enviando...' : 'Escolher arquivo'}</span>
              </label>
            )}
            {pendente.motivo_rejeicao && <p className="cc-feedback cc-error"><strong>Comprovante recusado:</strong> {pendente.motivo_rejeicao} Confira os dados e envie um novo arquivo.</p>}
          </div>
        )}

        {oficina.status_assinatura === 'ativo' && oficina.vencimento_assinatura && !oficina.cancelamento_agendado && !pendente && (
          <div className="cc-renewal-row"><div><strong>Renovação da assinatura</strong><p>Seu acesso permanece ativo até o fim do período pago. Você pode solicitar o encerramento da assinatura. O acesso permanece até o fim do período pago.</p></div><button type="button" disabled={ocupado} onClick={() => void cancelar()} className="cc-cancel-button">Solicitar encerramento</button></div>
        )}
        {oficina.cancelamento_agendado && <p className="cc-feedback cc-warning">Renovação cancelada. Seu acesso permanece até {dataTeste(oficina.vencimento_assinatura)}.</p>}

        {pagamentoConfirmado && (
          <div className="cc-confirmed"><span>✓</span><div><strong>Último pagamento confirmado</strong><p>{nomePlano(pagamentoConfirmado.plano)} · {moeda(Number(pagamentoConfirmado.valor))}{pagamentoConfirmado.novo_vencimento ? ' · próximo vencimento ' + dataTeste(pagamentoConfirmado.novo_vencimento) : ''}</p></div></div>
        )}

        {notificacoes.length > 0 && <div className="cc-notifications"><div className="cc-section-heading"><div><span>AVISOS</span><h3>Atualizações da assinatura</h3></div></div>{notificacoes.map(n => <button type="button" key={n.id} onClick={() => void marcarLida(n)} className={'cc-notification'+(n.lida_em?' is-read':'')}><strong>{n.titulo}</strong><p>{n.mensagem}</p><small>{dataHora(n.criado_em)}{n.lida_em ? ' · lida' : ' · toque para marcar como lida'}</small></button>)}</div>}

        <div className="cc-history">
          <div className="cc-section-heading"><div><span>HISTÓRICO</span><h3>Movimentações de pagamento</h3></div><small>{pagamentos.length} registro(s)</small></div>
          {pagamentos.length === 0 ? <p className="cc-empty">Nenhuma cobrança registrada. Quando solicitar uma ativação, ela aparecerá aqui.</p> : pagamentos.map(p => (
            <article key={p.id} className="cc-history-item">
              <div className="cc-history-icon">{p.status === 'confirmado' ? '✓' : p.status === 'cancelado' ? '×' : '◷'}</div>
              <div className="cc-history-main"><strong>{nomePlano(p.plano)} · {moeda(Number(p.valor))}</strong><small>{dataHora(p.criado_em)}</small>{p.novo_vencimento && <small>Vencimento aplicado: {dataTeste(p.novo_vencimento)}</small>}{p.comprovantes_assinatura?.filter(c=>c.status==='rejeitado').map(c=><small className="cc-history-rejected" key={c.id}>Comprovante recusado: {c.motivo_rejeicao || 'verifique os dados e reenvie'}</small>)}</div>
              <span className={'cc-history-status '+(p.status==='confirmado'?'is-confirmed':p.status==='em_analise'?'is-review':'')}>{statusPagamento(p.status)}</span>
            </article>
          ))}
        </div>
      </>}
    </section>
  )
}
