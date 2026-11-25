export type Assinatura = {
  ativa: boolean
  status: 'ativo' | 'bloqueado'
}

// Somente assinaturas pagas e ativadas pelo suporte liberam o sistema.
export function calcularAssinatura(status: string): Assinatura {
  return status === 'ativo'
    ? { ativa: true, status: 'ativo' }
    : { ativa: false, status: 'bloqueado' }
}

// Opcional: VITE_SUPORTE_WHATSAPP=55DDDNUMERO no .env (contato para pagar/renovar)
export function linkSuporte(oficina: string): string | null {
  const n = (import.meta.env.VITE_SUPORTE_WHATSAPP as string | undefined)?.replace(/\D/g, '')
  if (!n) return null
  return `https://wa.me/${n}?text=${encodeURIComponent(`Olá! Quero ativar/renovar a assinatura da oficina ${oficina}.`)}`
}
