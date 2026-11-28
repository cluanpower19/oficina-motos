import { useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { soDigitos } from '../lib/formatos'
import { reduzirImagem } from '../lib/imagem'
import { calcularAssinatura, dataTeste } from '../lib/assinatura'
import { MODELO_LEMBRETE, MODELO_ORCAMENTO, MODELO_PRONTA } from '../lib/whatsapp'
import CobrancaCliente from '../components/CobrancaCliente'

const campo =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:border-orange-500 focus:outline-none'
const botao = 'rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60'
const cartao = 'space-y-3 rounded-xl bg-white p-4 shadow'

export default function Configuracoes() {
  const { perfil, recarregarPerfil } = useAuth()
  const of = perfil!.oficina
  const assin = calcularAssinatura(of.status_assinatura, of.teste_ate, of.vencimento_assinatura, of.cancelamento_agendado)

  const [nome, setNome] = useState(of.nome)
  const [telefone, setTelefone] = useState(of.telefone ?? '')
  const [endereco, setEndereco] = useState(of.endereco ?? '')
  const [mOrc, setMOrc] = useState(of.msg_orcamento ?? MODELO_ORCAMENTO)
  const [mPronta, setMPronta] = useState(of.msg_pronta ?? MODELO_PRONTA)
  const [mLemb, setMLemb] = useState(of.msg_lembrete ?? MODELO_LEMBRETE)
  const [msg, setMsg] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)


  function aviso(ok: string) {
    setErro('')
    setMsg(ok)
    setTimeout(() => setMsg(''), 3000)
  }

  async function atualizar(campos: Record<string, string | null>, ok: string) {
    setOcupado(true)
    setMsg('')
    const { error } = await supabase.from('oficinas').update(campos).eq('id', of.id)
    setOcupado(false)
    if (error) return setErro('Não foi possível salvar. Tente de novo.')
    await recarregarPerfil()
    aviso(ok)
  }

  function salvarDados(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Informe o nome da oficina.')
    atualizar(
      { nome: nome.trim(), telefone: soDigitos(telefone) || null, endereco: endereco.trim() || null },
      'Dados salvos.',
    )
  }

  function salvarMensagens(e: FormEvent) {
    e.preventDefault()
    const v = (t: string, padrao: string) => (t.trim() && t.trim() !== padrao ? t.trim() : null)
    atualizar(
      { msg_orcamento: v(mOrc, MODELO_ORCAMENTO), msg_pronta: v(mPronta, MODELO_PRONTA), msg_lembrete: v(mLemb, MODELO_LEMBRETE) },
      'Mensagens salvas.',
    )
  }

  async function enviarLogo(e: ChangeEvent<HTMLInputElement>) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (!arq) return
    setOcupado(true)
    setErro('')
    try {
      const blob = await reduzirImagem(arq, 400)
      const caminho = `${of.id}/logo-${Date.now()}.jpg`
      const up = await supabase.storage.from('logos').upload(caminho, blob, { contentType: 'image/jpeg' })
      if (up.error) throw up.error
      const url = supabase.storage.from('logos').getPublicUrl(caminho).data.publicUrl
      await atualizar({ logo_url: url }, 'Logo atualizada.')
    } catch {
      setErro('Não foi possível enviar a logo. Use uma imagem JPG ou PNG.')
    } finally {
      setOcupado(false)
    }
  }



  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Configurações</h1>
      {msg && <p className="rounded-lg bg-green-100 p-3 text-green-800">{msg}</p>}
      {erro && <p className="rounded-lg bg-red-100 p-3 text-red-700">{erro}</p>}

      <form onSubmit={salvarDados} className={cartao}>
        <h2 className="text-lg font-semibold text-gray-800">Dados da oficina</h2>
        <div className="flex items-center gap-4">
          {of.logo_url ? (
            <img src={of.logo_url} alt="Logo" className="h-16 w-16 rounded-lg border object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-200 text-2xl">🏍️</div>
          )}
          <label className="cursor-pointer rounded-lg bg-gray-200 px-4 py-3 text-sm font-medium text-gray-800">
            {of.logo_url ? 'Trocar logo' : 'Enviar logo'}
            <input type="file" accept="image/*" className="hidden" onChange={enviarLogo} disabled={ocupado} />
          </label>
        </div>
        <input className={campo} placeholder="Nome da oficina" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input className={campo} placeholder="Telefone com DDD" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        <input className={campo} placeholder="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
        <button disabled={ocupado} className={botao}>Salvar dados</button>
      </form>

      <form onSubmit={salvarMensagens} className={cartao}>
        <h2 className="text-lg font-semibold text-gray-800">Mensagens de WhatsApp</h2>
        <p className="text-sm text-gray-600">
          Use: {'{cliente}'} {'{moto}'} {'{placa}'} {'{link}'} {'{total}'} {'{tipo}'}
        </p>
        <label className="block text-sm font-medium text-gray-700">Orçamento (use {'{link}'})</label>
        <textarea className={campo} rows={3} maxLength={1000} value={mOrc} onChange={(e) => setMOrc(e.target.value)} />
        <label className="block text-sm font-medium text-gray-700">Moto pronta (use {'{total}'})</label>
        <textarea className={campo} rows={3} maxLength={1000} value={mPronta} onChange={(e) => setMPronta(e.target.value)} />
        <label className="block text-sm font-medium text-gray-700">Lembrete de retorno (use {'{tipo}'})</label>
        <textarea className={campo} rows={3} maxLength={1000} value={mLemb} onChange={(e) => setMLemb(e.target.value)} />
        <div className="flex flex-wrap gap-3">
          <button disabled={ocupado} className={botao}>Salvar mensagens</button>
          <button
            type="button"
            className="rounded-lg bg-gray-200 px-5 py-3 font-medium text-gray-800"
            onClick={() => {
              setMOrc(MODELO_ORCAMENTO)
              setMPronta(MODELO_PRONTA)
              setMLemb(MODELO_LEMBRETE)
            }}
          >
            Restaurar padrão
          </button>
        </div>
      </form>

      <section className={cartao}>
        <h2 className="text-lg font-semibold text-gray-800">Assinatura</h2>
        <p className="text-gray-800">
          Plano {of.plano === 'completo' ? 'Completo' : 'Básico'}:{' '}
          <strong>
            {assin.status === 'ativo' && (assin.emTolerancia ? 'em período de tolerância' : 'ativa')}
            {assin.status === 'teste' && 'em teste grátis — ' + assin.diasRestantes + ' dia(s) restante(s)'}
            {assin.status === 'bloqueado' && (of.status_assinatura === 'teste' ? 'teste encerrado' : 'bloqueada')}
          </strong>
        </p>
        {assin.status === 'teste' && <p className="text-sm text-gray-600">Seu teste termina em {dataTeste(of.teste_ate)}. Não haverá cobrança automática.</p>}
        {of.vencimento_assinatura && <p className="text-sm text-gray-600">Vencimento atual: {dataTeste(of.vencimento_assinatura)}.</p>}
        {assin.vencimentoPendente && <p className="text-sm text-amber-700">Sua assinatura ativa ainda não tem vencimento cadastrado. O acesso atual foi preservado; procure o suporte para regularização.</p>}
        {of.cancelamento_agendado && <p className="text-sm text-amber-700">A renovação foi cancelada. O acesso permanece até o vencimento.</p>}
      </section>

      <CobrancaCliente />

    </div>
  )
}
