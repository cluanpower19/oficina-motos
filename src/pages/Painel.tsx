import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatarMoeda } from '../lib/formatos'
import { hojeISO } from '../lib/lembretes'
import { ROTULO, STATUS, type StatusOS } from '../lib/status'
import { Chave, Engrenagem, Velocimetro } from '../components/Cenario'
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

  const totalAbertas = r ? Object.values(r.porStatus).reduce((s, n) => s + (n ?? 0), 0) : 0
  const escala = Math.max(8, ...abertas.map((s) => r?.porStatus[s] ?? 0))

  return (
    <div className="space-y-6">
      <section className="heroi">
        <Engrenagem className="engrenagem-fundo" />
        <Chave className="chave-fundo" />
        <div className="heroi-veu" aria-hidden="true" />
        <div className="heroi-conteudo">
          <p className="saudacao">Olá, {perfil?.nome}</p>
          <h1>{perfil?.oficina.nome}</h1>
          <p className="mt-2 text-gray-600">
            {r ? (totalAbertas === 0 ? 'Bancada livre. Nenhuma moto em serviço agora.' : `${totalAbertas} moto(s) em serviço na oficina.`) : 'Abrindo a oficina...'}
          </p>
          <Link to="/os/nova" className={`${botao} mt-5 inline-block`}>+ Nova OS</Link>
        </div>
        <div className="listra-perigo" />
      </section>

      {!r ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <>
          <section className="space-y-3">
            <h2>Motos na bancada</h2>
            {abertas.length === 0 ? (
              <p className="text-gray-600">Nenhuma OS em aberto.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {abertas.map((s) => (
                  <Link key={s} to="/os">
                    <Velocimetro valor={r.porStatus[s] ?? 0} max={escala} rotulo={ROTULO[s]} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className={`grid gap-3 ${dono ? 'md:grid-cols-3' : ''}`}>
            <Link to="/lembretes" className="placar chapa-xadrez block">
              <div className="placar-rotulo">Lembretes para enviar hoje</div>
              <div className={`placar-valor ${r.lembretes > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{r.lembretes}</div>
            </Link>
            {dono && (
              <>
                <Link to="/financeiro" className="placar aco-escovado block">
                  <div className="placar-rotulo">Recebido no mês</div>
                  <div className="placar-valor text-orange-400">{formatarMoeda(r.recebido ?? 0)}</div>
                </Link>
                <Link to="/financeiro" className="placar aco-escovado block">
                  <div className="placar-rotulo">A receber</div>
                  <div className="placar-valor text-gray-800">{formatarMoeda(r.aReceber ?? 0)}</div>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

