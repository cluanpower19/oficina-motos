import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AdminExtras from './AdminExtras'
import AdminCobrancas from './AdminCobrancas'
import { calcularAssinatura, dataTeste } from '../lib/assinatura'

type Oficina = {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  plano: string | null
  status_assinatura: string
  teste_ate: string
  vencimento_assinatura: string | null
  dia_ciclo: number | null
  cancelamento_agendado: boolean
  criado_em: string
}

type Edicao = { plano: string; status: string }
type AlertaSeguranca = { id: string; email: string; telefone: string; motivo: string; criado_em: string; revisado_em: string | null; tentativas_email_24h: number; tentativas_telefone_24h: number }

const dataCurta = (valor: string) => {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const inicioDoMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

export default function Admin() {
  const { sair, session } = useAuth()
  const [oficinas, setOficinas] = useState<Oficina[]>([])
  const [edicoes, setEdicoes] = useState<Record<string, Edicao>>({})
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('todas')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [alertas, setAlertas] = useState<AlertaSeguranca[]>([])
  const [carregandoAlertas, setCarregandoAlertas] = useState(false)
  const [erroAlertas, setErroAlertas] = useState('')
  const [salvandoAlerta, setSalvandoAlerta] = useState<string | null>(null)
  const [aba, setAba] = useState<'oficinas' | 'cobrancas' | 'seguranca' | 'solicitacoes' | 'recursos'>('oficinas')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('admin_listar_oficinas')
    if (error) setErro(error.message)
    else {
      const lista = (data ?? []) as Oficina[]
      setOficinas(lista)
      setEdicoes(Object.fromEntries(lista.map(o => [o.id, {
        plano: o.plano === 'completo' ? 'completo' : 'basico',
        status: o.status_assinatura === 'ativo' || o.status_assinatura === 'teste' ? o.status_assinatura : 'bloqueado',
      }])))
    }
    setCarregando(false)
  }, [])

  useEffect(() => { void carregar() }, [carregar, session?.user.id])

  const carregarAlertas = useCallback(async () => {
    setCarregandoAlertas(true)
    setErroAlertas('')
    const { data, error } = await supabase.rpc('admin_listar_alertas_seguranca')
    if (error) setErroAlertas(error.message)
    else setAlertas((data ?? []) as AlertaSeguranca[])
    setCarregandoAlertas(false)
  }, [])

  useEffect(() => { void carregarAlertas() }, [carregarAlertas, session?.user.id])

  async function marcarAlertaRevisado(alerta: AlertaSeguranca) {
    setSalvandoAlerta(alerta.id)
    const { error } = await supabase.rpc('admin_marcar_alerta_seguranca_revisado', { p_alerta_id: alerta.id })
    if (error) setErroAlertas(error.message)
    else await carregarAlertas()
    setSalvandoAlerta(null)
  }


  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return oficinas
      .filter(o => !termo || `${o.nome} ${o.telefone ?? ''} ${o.email ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo))
      .filter(o => filtro === 'todas' || (filtro === 'ativas' ? calcularAssinatura(o.status_assinatura,o.teste_ate,o.vencimento_assinatura,o.cancelamento_agendado).ativa && o.status_assinatura === 'ativo' : filtro === 'testes' ? calcularAssinatura(o.status_assinatura,o.teste_ate,o.vencimento_assinatura,o.cancelamento_agendado).status === 'teste' : filtro === 'bloqueadas' ? !calcularAssinatura(o.status_assinatura,o.teste_ate,o.vencimento_assinatura,o.cancelamento_agendado).ativa : o.plano === filtro))
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  }, [oficinas, busca, filtro])

  const ativas = oficinas.filter(o => calcularAssinatura(o.status_assinatura, o.teste_ate, o.vencimento_assinatura, o.cancelamento_agendado).ativa && o.status_assinatura === 'ativo').length
  const testes = oficinas.filter(o => calcularAssinatura(o.status_assinatura, o.teste_ate, o.vencimento_assinatura, o.cancelamento_agendado).status === 'teste').length
  const bloqueadas = oficinas.length - ativas - testes
  const completas = oficinas.filter(o => o.plano === 'completo').length
  const novas = oficinas.filter(o => new Date(o.criado_em) >= inicioDoMes).length

  async function atualizar(oficina: Oficina) {
    const edicao = edicoes[oficina.id] ?? { plano: 'basico', status: 'bloqueado' }
    setSalvando(oficina.id)
    setErro('')
    setAviso('')
    const { error } = await supabase.rpc('admin_atualizar_oficina', {
      p_oficina_id: oficina.id,
      p_plano: edicao.plano,
      p_status: edicao.status,
    })
    if (error) setErro(`Não foi possível atualizar ${oficina.nome}: ${error.message}`)
    else {
      setAviso(`As configurações de ${oficina.nome} foram salvas com sucesso.`)
      await carregar()
    }
    setSalvando(null)
  }

  function alterar(oficina: Oficina, campo: keyof Edicao, valor: string) {
    setEdicoes(atual => ({
      ...atual,
      [oficina.id]: { ...(atual[oficina.id] ?? { plano: 'basico', status: 'bloqueado' }), [campo]: valor },
    }))
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100">
      <header className="border-b border-white/10 bg-[#101925]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-xl font-black text-slate-950 shadow-lg shadow-orange-950/30">OM</div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.24em] text-orange-400">Ofício do Motor · Gestão</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Painel administrativo</h1>
              <p className="mt-0.5 text-sm text-slate-400">Visão geral e controle das oficinas cadastradas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 sm:inline-flex">● Área segura</span>
            <button onClick={() => void sair()} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/5">Sair da administração</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 md:px-8">
        <nav className="flex flex-wrap gap-2 rounded-2xl border border-white/[0.08] bg-[#101925] p-2">
          {[{id:'oficinas',label:'Oficinas'},{id:'cobrancas',label:'Cobranças Pix'},{id:'seguranca',label:`Segurança${alertas.some(a => !a.revisado_em) ? ` · ${alertas.filter(a => !a.revisado_em).length}` : ''}`},{id:'solicitacoes',label:'Solicitações'},{id:'recursos',label:'Recursos exclusivos'}].map(item => <button key={item.id} onClick={() => { setAba(item.id as typeof aba); if (item.id === 'seguranca') void carregarAlertas() }} className={"rounded-xl px-4 py-2.5 text-sm font-semibold transition "+(aba===item.id?"bg-orange-500 text-[#17130f]":"text-slate-300 hover:bg-white/5")}>{item.label}</button>)}
        </nav>
        {aba === 'oficinas' ? <>
        <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-orange-400">Resumo da operação</p>
            <h2 className="mt-1 text-xl font-bold">Indicadores gerais</h2>
          </div>
          <p className="text-xs text-slate-500">Dados atualizados ao carregar a lista</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Total de oficinas', value: oficinas.length, detail: 'Cadastros na plataforma', icon: '▦', tone: 'text-slate-100', accent: 'bg-slate-400/10 text-slate-300' },
            { label: 'Acessos ativos', value: ativas, detail: 'Podem utilizar o sistema', icon: '✓', tone: 'text-emerald-300', accent: 'bg-emerald-400/10 text-emerald-300' },
            { label: 'Em teste grátis', value: testes, detail: 'Dentro dos sete dias', icon: '◷', tone: 'text-sky-300', accent: 'bg-sky-400/10 text-sky-300' },
            { label: 'Acessos bloqueados', value: bloqueadas, detail: 'Sem acesso liberado', icon: '⊘', tone: 'text-amber-300', accent: 'bg-amber-400/10 text-amber-300' },
            { label: 'Novas neste mês', value: novas, detail: `${completas} no plano Completo`, icon: '↗', tone: 'text-orange-300', accent: 'bg-orange-400/10 text-orange-300' },
          ].map(item => (
            <article key={item.label} className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#151f2c] to-[#101721] p-5 shadow-xl shadow-black/10">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-400">{item.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${item.accent}`}>{item.icon}</span>
              </div>
              <p className={`mt-4 text-3xl font-bold tracking-tight ${item.tone}`}>{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/[0.08] bg-[#101925] p-5 md:p-6">
          <h2 className="text-lg font-bold">Novos clientes</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">O cadastro é feito pelo próprio cliente na página pública. Após confirmar o e-mail e entrar pela primeira vez, a oficina é criada automaticamente com 7 dias de teste grátis. Você acompanha o cadastro aqui e confirma a assinatura somente depois de conferir o pagamento na aba Cobranças Pix.</p>
          <a href="https://oficiodomotor.github.io/cadastro" target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-[#17130f] transition hover:bg-orange-400">Abrir cadastro público</a>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101925] shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">Gestão de oficinas</h2>
                <p className="mt-1 text-sm text-slate-400">Consulte cadastros e altere planos. A ativação de novas assinaturas ocorre após a confirmação do Pix.</p>
              </div>
              <button onClick={() => void carregar()} disabled={carregando} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
                <span className={carregando ? 'animate-spin' : ''}>⟳</span> {carregando ? 'Atualizando...' : 'Atualizar dados'}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
                <input className="w-full rounded-xl border border-white/10 bg-[#090f17] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/10" placeholder="Buscar por oficina, telefone ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <select aria-label="Filtrar oficinas" value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-[#090f17] px-4 py-3 text-sm text-slate-300 outline-none focus:border-orange-400/70">
                <option value="todas">Todos os cadastros</option>
                <option value="ativas">Somente ativos</option>
                <option value="testes">Somente em teste</option>
                <option value="bloqueadas">Bloqueados / teste encerrado</option>
                <option value="basico">Plano Básico</option>
                <option value="completo">Plano Completo</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-white/5 px-3 py-1.5">{filtradas.length} resultado(s)</span>
              <span>•</span><span>Ordenado pelos cadastros mais recentes</span>
            </div>
          </div>

          {erro && <div role="alert" className="mx-5 mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 md:mx-6">{erro}</div>}
          {aviso && <div role="status" className="mx-5 mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 md:mx-6">✓ {aviso}</div>}

          {carregando ? (
            <div className="px-5 py-16 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" /><p className="mt-4 text-sm text-slate-400">Carregando dados das oficinas...</p></div>
          ) : filtradas.length === 0 ? (
            <div className="px-5 py-16 text-center"><p className="text-3xl">⌕</p><p className="mt-3 font-semibold text-slate-200">Nenhuma oficina encontrada</p><p className="mt-1 text-sm text-slate-500">Tente mudar a busca ou o filtro selecionado.</p></div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filtradas.map(oficina => {
                const edicao = edicoes[oficina.id] ?? { plano: 'basico', status: 'bloqueado' }
                const assinatura = calcularAssinatura(oficina.status_assinatura, oficina.teste_ate, oficina.vencimento_assinatura, oficina.cancelamento_agendado)
                const ativo = assinatura.status === 'ativo'
                const emTeste = assinatura.status === 'teste'
                const statusTexto = ativo ? (assinatura.emTolerancia ? 'Em tolerância' : 'Acesso ativo') : emTeste ? 'Em teste' : oficina.status_assinatura === 'teste' ? 'Teste encerrado' : 'Bloqueado'
                const alterado = edicao.plano !== (oficina.plano === 'completo' ? 'completo' : 'basico') || edicao.status !== oficina.status_assinatura
                return (
                  <article key={oficina.id} className="p-5 transition hover:bg-white/[0.015] md:px-6">
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,1.15fr)] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-white">{oficina.nome}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ativo ? (assinatura.emTolerancia ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300') : emTeste ? 'bg-sky-400/10 text-sky-300' : 'bg-amber-400/10 text-amber-300'}`}>{statusTexto}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                          <span>Telefone: {oficina.telefone || 'Nao informado'}</span>
                          <span className="break-all">E-mail: {oficina.email || 'Nao encontrado'}</span>
                          <span>▦ Cadastro: {dataCurta(oficina.criado_em)}</span>
                          <span>Plano atual: <strong className="font-semibold text-slate-300">{oficina.plano === 'completo' ? 'Completo' : 'Básico'}</strong></span>
                          {oficina.vencimento_assinatura && <span>Vencimento: {dataTeste(oficina.vencimento_assinatura)}</span>}
                          {assinatura.vencimentoPendente && <span className="text-amber-300">Vencimento não cadastrado</span>}
                          {oficina.cancelamento_agendado && <span className="text-amber-300">Renovação cancelada</span>}
                        </div>
                        {oficina.status_assinatura === 'teste' && <p className="mt-2 text-xs text-slate-400">{emTeste ? 'Teste grátis até ' : 'Teste encerrado em '}{dataTeste(oficina.teste_ate)}.</p>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block text-xs font-medium text-slate-400">Plano da oficina
                          <select value={edicao.plano} onChange={e => alterar(oficina, 'plano', e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090f17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-400/70">
                            <option value="basico">Básico</option><option value="completo">Completo</option>
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-400">Permissão de acesso
                          <select value={edicao.status} onChange={e => alterar(oficina, 'status', e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090f17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-400/70">
                            {oficina.status_assinatura === 'ativo' && <option value="ativo">Ativo</option>}{oficina.status_assinatura === 'teste' && <option value="teste">Em teste (automático)</option>}<option value="bloqueado">Bloqueado</option>
                          </select>
                        </label>
                        <button disabled={salvando === oficina.id || !alterado} onClick={() => void atualizar(oficina)} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-[#17130f] shadow-lg shadow-orange-950/20 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40">
                          {salvando === oficina.id ? 'Salvando...' : 'Salvar'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
        <footer className="flex flex-col items-center justify-between gap-2 pb-3 text-xs text-slate-600 sm:flex-row">
          <span>Ofício do Motor · Central de administração</span>
          <span>Ambiente restrito a administradores autorizados</span>
        </footer>
        </> : aba === 'cobrancas' ? <AdminCobrancas /> : aba === 'seguranca' ? <>
          <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-sm font-medium text-orange-400">Proteção contra abuso</p><h2 className="mt-1 text-xl font-bold">Alertas de segurança</h2><p className="mt-1 max-w-3xl text-sm text-slate-400">Tentativas de iniciar um novo teste usando e-mail ou telefone que já participou de um trial. Os dados são conferidos novamente pelo banco antes de registrar o alerta.</p></div>
            <button onClick={() => void carregarAlertas()} disabled={carregandoAlertas} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50">{carregandoAlertas ? 'Atualizando...' : 'Atualizar alertas'}</button>
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-2xl border border-white/[0.08] bg-[#101925] p-5"><p className="text-sm text-slate-400">Alertas registrados</p><p className="mt-3 text-3xl font-bold">{alertas.length}</p><p className="mt-1 text-xs text-slate-500">Últimos 100 registros</p></article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#101925] p-5"><p className="text-sm text-slate-400">Aguardando revisão</p><p className="mt-3 text-3xl font-bold text-amber-300">{alertas.filter(a => !a.revisado_em).length}</p><p className="mt-1 text-xs text-slate-500">Alertas ainda não analisados</p></article>
            <article className="rounded-2xl border border-white/[0.08] bg-[#101925] p-5"><p className="text-sm text-slate-400">Repetições em 24 horas</p><p className="mt-3 text-3xl font-bold text-orange-300">{alertas.filter(a => Math.max(Number(a.tentativas_email_24h), Number(a.tentativas_telefone_24h)) > 1).length}</p><p className="mt-1 text-xs text-slate-500">Alertas associados a identificadores repetidos</p></article>
          </section>
          {erroAlertas && <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{erroAlertas}</div>}
          <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101925]">
            <div className="border-b border-white/[0.07] p-5"><h3 className="font-bold">Histórico de tentativas bloqueadas</h3><p className="mt-1 text-xs text-slate-500">E-mail e telefone foram informados no cadastro e ficam visíveis somente para administradores.</p></div>
            {carregandoAlertas ? <p className="p-8 text-center text-sm text-slate-400">Carregando alertas...</p> : alertas.length === 0 ? <p className="p-8 text-center text-sm text-slate-400">Nenhuma tentativa de reutilização de trial registrada ainda.</p> : <div className="divide-y divide-white/[0.06]">{alertas.map(alerta => <article key={alerta.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="min-w-0 space-y-2"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${alerta.revisado_em ? 'bg-slate-500/10 text-slate-400' : 'bg-amber-400/10 text-amber-300'}`}>{alerta.revisado_em ? 'Revisado' : 'Pendente'}</span><span className="text-xs text-slate-500">{new Date(alerta.criado_em).toLocaleString('pt-BR')}</span></div><p className="break-all text-sm font-semibold text-white">{alerta.email}</p><p className="text-sm text-slate-300">Telefone: {alerta.telefone}</p><p className="text-xs text-slate-400">{alerta.motivo === 'email_e_telefone_reutilizados' ? 'E-mail e telefone já utilizados em outro teste' : alerta.motivo === 'email_reutilizado' ? 'E-mail já utilizado em outro teste' : 'Telefone já utilizado em outro teste'}</p><p className="text-xs text-slate-500">Últimas 24h: {alerta.tentativas_email_24h} tentativa(s) com este e-mail · {alerta.tentativas_telefone_24h} com este telefone</p></div>{!alerta.revisado_em && <button onClick={() => void marcarAlertaRevisado(alerta)} disabled={salvandoAlerta === alerta.id} className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50">{salvandoAlerta === alerta.id ? 'Salvando...' : 'Marcar como revisado'}</button>}</article>)}</div>}
          </section>
          <p className="text-xs leading-relaxed text-slate-500">Limite desta versão: registra bloqueios do trial depois da confirmação do e-mail. Não registra tentativas de CAPTCHA reprovadas nem IP do visitante. Para acompanhar desafios automatizados, consulte as métricas do Turnstile no Cloudflare.</p>
        </> : <AdminExtras embedded section={aba} />}
      </main>
    </div>
  )
}
