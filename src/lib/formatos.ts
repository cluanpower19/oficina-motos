export const soDigitos = (v: string) => v.replace(/\D/g, '')

export function formatarTelefone(v: string | null | undefined): string {
  const d = soDigitos(v ?? '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export const normalizarPlaca = (v: string) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

export function formatarPlaca(v: string): string {
  const p = normalizarPlaca(v)
  return /^[A-Z]{3}\d/.test(p) && p.length === 7 && /^\d$/.test(p[4]) ? `${p.slice(0, 3)}-${p.slice(3)}` : p
}

export function mensagemErro(e: { code?: string; message: string }): string {
  if (e.code === '23505') {
    if (e.message.includes('codigo')) return 'Já existe uma peça com esse código.'
    return 'Já existe uma moto com essa placa.'
  }
  return e.message
}

export const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function lerNumero(v: string): number {
  const n = Number(v.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
