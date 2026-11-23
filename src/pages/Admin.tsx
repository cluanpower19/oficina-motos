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

export default function Admin() {
  const { sair, session } = useAuth()
  const [oficinas, setOficinas] = useState<Oficina[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    const { data, error } = await supabase.rpc('admin_listar_oficinas')
    if (error) setErro(error.message)
    else setOficinas((data ?? []) as Oficina[])
    setCarregando(false)
  }, [])

  useEffect(() => { void carregar() }, [carregar, session?.user.id])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    if (!termo) return oficinas
    return oficinas.filter((o) => `${o.nome} ${o.telefone ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo))
  }, [oficinas, busca])

  async function atualizar(oficina: Oficina, plano: string, status: string) {
    setSalvando(oficina.id)
    setErro('')
    setAviso('')
    const { error } = await supabase.rpc('admin_atualizar_oficina', {
      p_oficina_id: oficina.id,
      p_plano: plano,
      p_status: status,
    })
    if (error) setErro(`Não foi possível atualizar ${oficina.nome}: ${error.message}`)
    else {
      setAviso(`Dados de ${oficina.nome} atualizados.`)
      await carregar()
    }
    setSalvando(null)
  }

  const dataCurta = (valor: string) => new Date(valor).toLocaleDateString('pt-BR')

  return (
    <div className="min-h-screen bg-[#0b1016] text-gray-100">
      <header className="border-b border-[#27313d] bg-[#111923]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-orange-400">Ofício do Motor</p>
            <h1 className="mt-1 text-2xl font-bold">Painel administrativo</h1>
            <p className="mt-1 text-sm text-gray-400">Gestão de oficinas, planos e assinaturas</p>
          </div>
          <button onClick={sair} className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800">Sair</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-7 md:px-8">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#27313d] bg-[#111923] p-5">
            <p className="text-sm text-gray-400">Oficinas cadastradas</p>
            <p className="mt-2 text-3xl font-bold">{oficinas.length}</p>
          </div>
          <div className="rounded-xl border border-[#27313d] bg-[#111923] p-5">
            <p className="text-sm text-gray-400">Assinaturas ativas</p>
            <p className="mt-2 text-3xl font-bold text-green-400">{oficinas.filter(o => o.status_assinatura === 'ativo').length}</p>
          </div>
          <div className="rounded-xl border border-[#27313d] bg-[#111923] p-5">
            <p className="text-sm text-gray-400">Bloqueadas ou antigas</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">{oficinas.filter(o => o.status_assinatura !== 'ativo').length}</p>
          </div>
        </section>

        <section className="rounded-xl border border-[#27313d] bg-[#111923] p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Oficinas</h2>
              <p className="text-sm text-gray-400">Pesquise pelo nome ou telefone e gerencie o acesso.</p>
            </div>
            <button onClick={() => void carregar()} className="rounded-lg border border-gray-600 px-4 py-2 text-sm hover:bg-gray-800">Atualizar lista</button>
          </div>

          <input
            className="mt-5 w-full rounded-lg border border-[#394554] bg-[#0b1016] px-4 py-3 text-sm text-white outline-none focus:border-orange-400"
            placeholder="Buscar oficina por nome ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          {erro && <p className="mt-4 rounded-lg bg-red-950/60 p-3 text-sm text-red-300">{erro}</p>}
          {aviso && <p className="mt-4 rounded-lg bg-green-950/50 p-3 text-sm text-green-300">{aviso}</p>}

          {carregando ? (
            <p className="py-10 text-center text-sm text-gray-400">Carregando oficinas...</p>
          ) : filtradas.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Nenhuma oficina encontrada.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtradas.map((oficina) => (
                <article key={oficina.id} className="rounded-lg border border-[#303b49] bg-[#0d141d] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{oficina.nome}</h3>
                      <p className="mt-1 text-sm text-gray-400">{oficina.telefone || 'Telefone não informado'} · Cadastro: {dataCurta(oficina.criado_em)}</p>
                      <p className="mt-2 text-xs text-gray-500">Status atual: {oficina.status_assinatura === 'ativo' ? 'Ativo' : oficina.status_assinatura === 'teste' ? 'Teste antigo (sem acesso)' : 'Bloqueado'}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[480px]">
                      <label className="text-xs text-gray-400">
                        Plano
                        <select id={`plano-${oficina.id}`} defaultValue={oficina.plano || 'basico'} className="mt-1 w-full rounded-md border border-[#394554] bg-[#182331] px-3 py-2 text-sm text-white">
                          <option value="basico">Básico</option>
                          <option value="completo">Completo</option>
                        </select>
                      </label>
                      <label className="text-xs text-gray-400">
                        Acesso
                        <select id={`status-${oficina.id}`} defaultValue={oficina.status_assinatura === 'ativo' ? 'ativo' : 'bloqueado'} className="mt-1 w-full rounded-md border border-[#394554] bg-[#182331] px-3 py-2 text-sm text-white">
                          <option value="ativo">Ativo</option>
                          <option value="bloqueado">Bloqueado</option>
                        </select>
                      </label>
                      <button
                        disabled={salvando === oficina.id}
                        onClick={() => {
                          const plano = (document.getElementById(`plano-${oficina.id}`) as HTMLSelectElement).value
                          const status = (document.getElementById(`status-${oficina.id}`) as HTMLSelectElement).value
                          void atualizar(oficina, plano, status)
                        }}
                        className="self-end rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-[#15191f] hover:bg-orange-400 disabled:opacity-50"
                      >
                        {salvando === oficina.id ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="text-center text-xs text-gray-600">Área restrita de administração · Ofício do Motor</p>
      </main>
    </div>
  )
}
