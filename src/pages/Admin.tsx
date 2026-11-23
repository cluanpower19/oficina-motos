import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Oficina = {
  id: string
  nome: string
  telefone: string | null
  plano: string | null
  status_assinatura: string
  criado_em: string
}

type Edicao = { plano: string; status: string }

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
        status: o.status_assinatura === 'ativo' ? 'ativo' : 'bloqueado',
      }])))
    }
    setCarregando(false)
  }, [])

  useEffect(() => { void carregar() }, [carregar, session?.user.id])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return oficinas
      .filter(o => !termo || `${o.nome} ${o.telefone ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo))
      .filter(o => filtro === 'todas' || (filtro === 'ativas' ? o.status_assinatura === 'ativo' : filtro === 'bloqueadas' ? o.status_assinatura !== 'ativo' : o.plano === filtro))
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  }, [oficinas, busca, filtro])

  const ativas = oficinas.filter(o => o.status_assinatura === 'ativo').length
  const bloqueadas = oficinas.length - ativas
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
        <section className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-orange-400">Resumo da operação</p>
            <h2 className="mt-1 text-xl font-bold">Indicadores gerais</h2>
          </div>
          <p className="text-xs text-slate-500">Dados atualizados ao carregar a lista</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total de oficinas', value: oficinas.length, detail: 'Cadastros na plataforma', icon: '▦', tone: 'text-slate-100', accent: 'bg-slate-400/10 text-slate-300' },
            { label: 'Acessos ativos', value: ativas, detail: 'Podem utilizar o sistema', icon: '✓', tone: 'text-emerald-300', accent: 'bg-emerald-400/10 text-emerald-300' },
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

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101925] shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] p-5 md:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold">Gestão de oficinas</h2>
                <p className="mt-1 text-sm text-slate-400">Consulte cadastros, altere planos e libere ou bloqueie acessos.</p>
              </div>
              <button onClick={() => void carregar()} disabled={carregando} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50">
                <span className={carregando ? 'animate-spin' : ''}>⟳</span> {carregando ? 'Atualizando...' : 'Atualizar dados'}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
                <input className="w-full rounded-xl border border-white/10 bg-[#090f17] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400/70 focus:ring-2 focus:ring-orange-400/10" placeholder="Buscar por nome ou telefone..." value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              <select aria-label="Filtrar oficinas" value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-xl border border-white/10 bg-[#090f17] px-4 py-3 text-sm text-slate-300 outline-none focus:border-orange-400/70">
                <option value="todas">Todos os cadastros</option>
                <option value="ativas">Somente ativos</option>
                <option value="bloqueadas">Bloqueados / sem acesso</option>
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
                const ativo = oficina.status_assinatura === 'ativo'
                const alterado = edicao.plano !== (oficina.plano === 'completo' ? 'completo' : 'basico') || edicao.status !== (ativo ? 'ativo' : 'bloqueado')
                return (
                  <article key={oficina.id} className="p-5 transition hover:bg-white/[0.015] md:px-6">
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(440px,1.15fr)] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-bold text-white">{oficina.nome}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ativo ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{ativo ? 'Acesso ativo' : 'Bloqueado'}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                          <span>☎ {oficina.telefone || 'Telefone não informado'}</span>
                          <span>▦ Cadastro: {dataCurta(oficina.criado_em)}</span>
                          <span>Plano atual: <strong className="font-semibold text-slate-300">{oficina.plano === 'completo' ? 'Completo' : 'Básico'}</strong></span>
                        </div>
                        {oficina.status_assinatura === 'teste' && <p className="mt-2 text-xs text-amber-300">Cadastro com status antigo de teste; sem acesso liberado.</p>}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                        <label className="block text-xs font-medium text-slate-400">Plano da oficina
                          <select value={edicao.plano} onChange={e => alterar(oficina, 'plano', e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090f17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-400/70">
                            <option value="basico">Básico</option><option value="completo">Completo</option>
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-400">Permissão de acesso
                          <select value={edicao.status} onChange={e => alterar(oficina, 'status', e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#090f17] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-orange-400/70">
                            <option value="ativo">Ativo</option><option value="bloqueado">Bloqueado</option>
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
      </main>
    </div>
  )
}
