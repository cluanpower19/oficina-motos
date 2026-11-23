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

// Modelos padrão. Variáveis: {cliente} {moto} {placa} {link} {total} {tipo}
export const MODELO_ORCAMENTO =
  'Olá, {cliente}! O orçamento da sua {moto} ({placa}) está pronto. Veja os detalhes e aprove por aqui: {link}'
export const MODELO_PRONTA = 'Olá, {cliente}! Sua {moto} ({placa}) está pronta para retirada. Valor: {total}.'
export const MODELO_LEMBRETE =
  'Olá, {cliente}! Está chegando a hora da {tipo} da sua {moto}. Quer agendar um horário?'

export function aplicarModelo(modelo: string, vars: Record<string, string>): string {
  return modelo.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
}

const base = (d: Dados) => ({ cliente: primeiroNome(d.cliente), moto: nomeMoto(d), placa: formatarPlaca(d.placa) })

export const msgOrcamento = (d: Dados, link: string, modelo?: string | null) =>
  aplicarModelo(modelo?.trim() || MODELO_ORCAMENTO, { ...base(d), link })

export const msgPronta = (d: Dados, total: number, modelo?: string | null) =>
  aplicarModelo(modelo?.trim() || MODELO_PRONTA, { ...base(d), total: formatarMoeda(total) })

export const msgLembrete = (d: Dados, tipo: string, modelo?: string | null) =>
  aplicarModelo(modelo?.trim() || MODELO_LEMBRETE, { ...base(d), tipo })
