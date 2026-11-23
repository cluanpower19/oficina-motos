export const TIPOS = ['oleo', 'revisao', 'pneu', 'outro'] as const
export type TipoLembrete = (typeof TIPOS)[number]

export const TIPO_ROTULO: Record<TipoLembrete, string> = {
  oleo: 'Troca de óleo',
  revisao: 'Revisão',
  pneu: 'Pneu',
  outro: 'Outro',
}

// Usado na frase "Está chegando a hora da ..." do WhatsApp
export const TIPO_TEXTO: Record<TipoLembrete, string> = {
  oleo: 'troca de óleo',
  revisao: 'revisão',
  pneu: 'troca de pneu',
  outro: 'manutenção',
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Datas 'AAAA-MM-DD' no fuso local (sem deslocar o dia)
export const hojeISO = () => iso(new Date())

export function somarDias(dataISO: string, dias: number): string {
  const [a, m, d] = dataISO.split('-').map(Number)
  return iso(new Date(a, m - 1, d + dias))
}

export function dataBR(dataISO: string | null): string {
  if (!dataISO) return ''
  const [a, m, d] = dataISO.split('-')
  return `${d}/${m}/${a}`
}
