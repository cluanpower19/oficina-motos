export const soDigitos = (v: string) => v.replace(/\D/g, '')

export function formatarTelefone(v: string | null | undefined): string {
  const d = soDigitos(v ?? '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return d
}

export const normalizarPlaca = (v: string) => v.replace(/[^A-Za-z0-9]/g, '').toUpperCase()

export function validarPlaca(v: string): boolean {
  const placa = normalizarPlaca(v)
  return /^[A-Z]{3}\d{4}$/.test(placa) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(placa)
}

export function formatarPlaca(v: string): string {
  const p = normalizarPlaca(v)
  return /^[A-Z]{3}\d/.test(p) && p.length === 7 && /^\d$/.test(p[4]) ? `${p.slice(0, 3)}-${p.slice(3)}` : p
}

export function mensagemErro(e: { code?: string; message: string }): string {
  if (e.code === '23505') {
    const detalhe = e.message.toLowerCase()
    if (detalhe.includes('codigo')) return 'Já existe uma peça com esse código.'
    if (detalhe.includes('placa')) return 'Já existe uma moto com essa placa.'
    return 'Este registro já existe. Confira os dados e tente novamente.'
  }
  return e.message
}

export const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function lerNumeroEstrito(v: string): number | null {
  const texto = v.trim().replace(/\s/g, '')
  if (!texto) return null

  // Com vírgula, interpreta o padrão brasileiro (1.234,56).
  // Sem vírgula, preserva ponto decimal (49.90), mas reconhece milhares (1.250).
  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : /^-?\d{1,3}(?:\.\d{3})+$/.test(texto)
      ? texto.replace(/\./g, '')
      : texto

  const n = Number(normalizado)
  return Number.isFinite(n) ? n : null
}

export function lerNumero(v: string): number {
  return lerNumeroEstrito(v) ?? 0
}


/** Valida o ano de fabricação informado no cadastro da motocicleta. */
export function validarAnoFabricacao(ano: number | null, anoAtual = new Date().getFullYear()): string | null {
  if (ano === null) return null
  if (!Number.isSafeInteger(ano) || ano < 1885 || ano > anoAtual + 1) {
    return 'Informe um ano de fabricação válido.'
  }
  return null
}

/** Valida a quilometragem informada antes de iniciar qualquer gravação da OS. */
export function validarKmEntrada(km: number | null, kmAnterior: number | null): string | null {
  if (km === null) return null
  if (!Number.isSafeInteger(km) || km < 0) return 'Informe uma quilometragem válida.'
  if (kmAnterior !== null && km < kmAnterior) {
    return `A quilometragem de entrada não pode ser menor que a última registrada (${kmAnterior} km).`
  }
  return null
}
