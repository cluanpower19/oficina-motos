import { hojeISO } from './lembretes'

export type Assinatura = {
  ativa: boolean
  status: 'ativo' | 'teste' | 'teste_vencido' | 'bloqueado'
  diasRestantes: number | null
}

const dia = (iso: string) => new Date(iso + 'T00:00:00').getTime()

// Mesma regra do banco (função assinatura_ok): ativo, ou teste dentro do prazo
export function calcularAssinatura(status: string, testeAte: string): Assinatura {
  if (status === 'ativo') return { ativa: true, status: 'ativo', diasRestantes: null }
  if (status === 'teste') {
    const dias = Math.round((dia(testeAte) - dia(hojeISO())) / 86400000)
    return dias >= 0
      ? { ativa: true, status: 'teste', diasRestantes: dias }
      : { ativa: false, status: 'teste_vencido', diasRestantes: dias }
  }
  return { ativa: false, status: 'bloqueado', diasRestantes: null }
}

// Opcional: VITE_SUPORTE_WHATSAPP=55DDDNUMERO no .env (contato para pagar/renovar)
export function linkSuporte(oficina: string): string | null {
  const n = (import.meta.env.VITE_SUPORTE_WHATSAPP as string | undefined)?.replace(/\D/g, '')
  if (!n) return null
  return `https://wa.me/${n}?text=${encodeURIComponent(`Olá! Quero ativar/renovar a assinatura da oficina ${oficina}.`)}`
}
