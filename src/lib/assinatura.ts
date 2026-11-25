export type Assinatura = {
  ativa: boolean
  status: 'ativo' | 'teste' | 'bloqueado'
  diasRestantes: number
}

export function hojeBrasil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}

export function calcularAssinatura(status: string, testeAte?: string | null): Assinatura {
  if (status === 'ativo') return { ativa: true, status: 'ativo', diasRestantes: 0 }
  const hoje = hojeBrasil()
  if (status === 'teste' && testeAte && testeAte >= hoje) {
    const inicio = Date.parse(hoje + 'T00:00:00Z')
    const fim = Date.parse(testeAte + 'T00:00:00Z')
    const diasRestantes = Math.max(1, Math.floor((fim - inicio) / 86400000) + 1)
    return { ativa: true, status: 'teste', diasRestantes }
  }
  return { ativa: false, status: 'bloqueado', diasRestantes: 0 }
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
