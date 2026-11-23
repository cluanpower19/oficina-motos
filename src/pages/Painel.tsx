import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatarMoeda } from '../lib/formatos'
import { hojeISO } from '../lib/lembretes'
import { COR, ROTULO, STATUS, type StatusOS } from '../lib/status'
import { botao } from './Clientes'

type Resumo = {
  porStatus: Partial<Record<StatusOS, number>>
  lembretes: number
  recebido: number | null
  aReceber: number | null
}

const soma = (l: { valor: number }[] | null) => (l ?? []).reduce((s, x) => s + Number(x.valor), 0)

export default function Painel() {
  const { perfil } = useAuth()
  const [r, setR] = useState<Resumo | null>(null)
  const dono = perfil?.papel === 'dono'

  useEffect(() => {
    if (!perfil) return
    const hoje = hojeISO()
    const mes = hoje.slice(0, 7)
    const [a, m] = mes.split('-').map(Number)
    const fim = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`
    ;(async () => {
      const [os, lem, rec, rcb] = await Promise.all([
        supabase.from('ordens_servico').select('status').not('status', 'in', '(entregue,cancelado)'),
        supabase.from('lembretes').select('id', { count: 'exact', head: true }).eq('enviado', false).lte('data_prevista', hoje),
        dono
          ? supabase.from('financeiro').select('valor').eq('tipo', 'entrada').eq('pago', true).gte('data', `${mes}-01`).lt('data', fim)
          : Promise.resolve({ data: null }),
        dono ? supabase.from('financeiro').select('valor').eq('tipo', 'entrada').eq('pago', false) : Promise.resolve({ data: null }),
      ])
      const porStatus: Resumo['porStatus'] = {}
      for (const o of (os.data ?? []) as { status: StatusOS }[]) porStatus[o.status] = (porStatus[o.status] ?? 0) + 1
      setR({
        porStatus,
        lembretes: lem.count ?? 0,
        recebido: dono ? soma(rec.data as { valor: number }[] | null) : null,
        aReceber: dono ? soma(rcb.data as { valor: number }[] | null) : null,
      })
    })()
  }, [perfil, dono])

  const abertas = r ? STATUS.filter((s) => (r.porStatus[s] ?? 0) > 0) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{perfil?.oficina.nome}</h1>
          <p className="text-gray-600">Olá, {perfil?.nome}!</p>
        </div>
        <Link to="/os/nova" className={botao}>+ Nova OS</Link>
      </div>

      {!r ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <>
          <section className="space-y-2">
            <h2 className="font-bold text-gray-800">OS em aberto</h2>
            {abertas.length === 0 ? (
              <p className="text-gray-600">Nenhuma OS em aberto.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {abertas.map((s) => (
                  <Link key={s} to="/os" className="rounded-xl bg-white p-4 shadow active:bg-gray-50">
                    <div className="text-3xl font-bold text-gray-800">{r.porStatus[s]}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${COR[s]}`}>{ROTULO[s]}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <Link to="/lembretes" className="block rounded-xl bg-white p-4 shadow active:bg-gray-50">
            <div className="text-sm text-gray-500">Lembretes para enviar hoje</div>
            <div className={`text-3xl font-bold ${r.lembretes > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{r.lembretes}</div>
          </Link>

          {dono && (
            <Link to="/financeiro" className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-gray-800 p-4 shadow">
                <div className="text-sm text-gray-300">Recebido no mês</div>
                <div className="text-xl font-bold text-orange-400">{formatarMoeda(r.recebido ?? 0)}</div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow">
                <div className="text-sm text-gray-500">A receber</div>
                <div className="text-xl font-bold text-gray-800">{formatarMoeda(r.aReceber ?? 0)}</div>
              </div>
            </Link>
          )}
        </>
      )}
    </div>
  )
}
