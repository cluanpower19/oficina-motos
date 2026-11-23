import { formatarMoeda, formatarPlaca, soDigitos } from './formatos'

// Telefone salvo só com dígitos e DDD. O link do WhatsApp leva o prefixo 55.
export function linkWhatsApp(telefone: string | null | undefined, texto: string): string | null {
  let d = soDigitos(telefone ?? '')
  if (d.length === 10 || d.length === 11) d = '55' + d
  if (!(d.length === 12 || d.length === 13) || !d.startsWith('55')) return null
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`
}

type Dados = { cliente: string; marca?: string | null; modelo?: string | null; placa: string }

const nomeMoto = (d: Dados) => [d.marca, d.modelo].filter(Boolean).join(' ') || 'moto'
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0] || n

// Mensagens padrão (a edição pelas Configurações vem na Etapa 9)
export const msgOrcamento = (d: Dados, link: string) =>
  `Olá, ${primeiroNome(d.cliente)}! O orçamento da sua ${nomeMoto(d)} (${formatarPlaca(d.placa)}) está pronto. Veja os detalhes e aprove por aqui: ${link}`

export const msgPronta = (d: Dados, total: number) =>
  `Olá, ${primeiroNome(d.cliente)}! Sua ${nomeMoto(d)} (${formatarPlaca(d.placa)}) está pronta para retirada. Valor: ${formatarMoeda(total)}.`

export const msgLembrete = (d: Dados, tipo: string) =>
  `Olá, ${primeiroNome(d.cliente)}! Está chegando a hora da ${tipo} da sua ${nomeMoto(d)}. Quer agendar um horário?`
