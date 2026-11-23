export const STATUS = [
  'orcamento',
  'aguardando_aprovacao',
  'aprovado',
  'em_andamento',
  'pronto',
  'entregue',
  'cancelado',
] as const

export type StatusOS = (typeof STATUS)[number]

export const ROTULO: Record<StatusOS, string> = {
  orcamento: 'Orçamento',
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  em_andamento: 'Em andamento',
  pronto: 'Pronto',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

export const COR: Record<StatusOS, string> = {
  orcamento: 'bg-gray-100 text-gray-700',
  aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-orange-100 text-orange-800',
  pronto: 'bg-green-100 text-green-800',
  entregue: 'bg-green-200 text-green-900',
  cancelado: 'bg-red-100 text-red-700',
}
