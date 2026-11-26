export type Assinatura = {
  ativa: boolean
  status: 'ativo' | 'teste' | 'bloqueado'
  diasRestantes: number
  emTolerancia: boolean
  vencimentoPendente: boolean
}

export function hojeBrasil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

function somarDias(data: string, dias: number): string {
  const [ano, mes, dia] = data.split('-').map(Number)
  const d = new Date(Date.UTC(ano, mes - 1, dia + dias))
  return [d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2, '0'), String(d.getUTCDate()).padStart(2, '0')].join('-')
}

function diferencaDias(inicio: string, fim: string): number {
  return Math.round((Date.parse(fim + 'T00:00:00Z') - Date.parse(inicio + 'T00:00:00Z')) / 86400000)
}

export function calcularAssinatura(
  status: string,
  testeAte?: string | null,
  vencimento?: string | null,
  cancelamentoAgendado = false,
  hoje = hojeBrasil(),
): Assinatura {
  if (status === 'teste' && testeAte && testeAte >= hoje) {
    return {
      ativa: true, status: 'teste',
      diasRestantes: diferencaDias(hoje, testeAte) + 1,
      emTolerancia: false, vencimentoPendente: false,
    }
  }

  if (status === 'ativo') {
    // Oficinas antigas sem vencimento continuam ativas até regularização administrativa.
    if (!vencimento) {
      return { ativa: true, status: 'ativo', diasRestantes: 0, emTolerancia: false, vencimentoPendente: true }
    }
    if (hoje <= vencimento) {
      return {
        ativa: true, status: 'ativo',
        diasRestantes: diferencaDias(hoje, vencimento) + 1,
        emTolerancia: false, vencimentoPendente: false,
      }
    }
    const limite = somarDias(vencimento, cancelamentoAgendado ? 0 : 5)
    if (hoje <= limite) {
      return {
        ativa: true, status: 'ativo',
        diasRestantes: diferencaDias(hoje, limite) + 1,
        emTolerancia: !cancelamentoAgendado, vencimentoPendente: false,
      }
    }
  }

  return { ativa: false, status: 'bloqueado', diasRestantes: 0, emTolerancia: false, vencimentoPendente: false }
}

export function dataTeste(valor?: string | null): string {
  if (!valor) return '—'
  const data = new Date(valor + 'T12:00:00Z')
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric' }).format(data)
}

export function linkSuporte(oficina: string): string | null {
  const n = (import.meta.env.VITE_SUPORTE_WHATSAPP as string | undefined)?.replace(/\D/g, '')
  if (!n) return null
  return 'https://wa.me/' + n + '?text=' + encodeURIComponent('Olá! Quero ativar/renovar a assinatura da oficina ' + oficina + '.')
}
