export type StatusCobranca = 'teste' | 'ativo' | 'bloqueado'

export type EstadoAcessoCobranca = {
  estado: 'teste' | 'ativa' | 'tolerancia' | 'somente_consulta'
  podeAlterar: boolean
  diasRestantes: number
  vencimentoPendente: boolean
  limiteAcesso: string | null
}

export type DadosCiclo = {
  hoje: string
  status: StatusCobranca
  testeAte?: string | null
  vencimentoAtual?: string | null
  diaCiclo?: number | null
}

function validarDataISO(valor: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new Error('Data inválida. Use AAAA-MM-DD.')
  }
  const [ano, mes, dia] = valor.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    throw new Error('Data inválida. Use uma data real no formato AAAA-MM-DD.')
  }
}

function partesData(valor: string): [number, number, number] {
  validarDataISO(valor)
  return valor.split('-').map(Number) as [number, number, number]
}

function formatarData(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function somarDiasISO(dataISO: string, quantidade: number): string {
  const [ano, mes, dia] = partesData(dataISO)
  if (!Number.isInteger(quantidade)) throw new Error('A quantidade de dias precisa ser um número inteiro.')
  const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade))
  return formatarData(data.getUTCFullYear(), data.getUTCMonth() + 1, data.getUTCDate())
}

/**
 * Avança um mês mantendo o dia de cobrança original.
 * Ex.: dia 31 -> último dia de fevereiro -> dia 31 em março.
 */
export function somarMesesNoDiaCiclo(dataBase: string, diaCiclo: number): string {
  const [ano, mes] = partesData(dataBase)
  if (!Number.isInteger(diaCiclo) || diaCiclo < 1 || diaCiclo > 31) {
    throw new Error('O dia do ciclo precisa estar entre 1 e 31.')
  }
  const indiceMes = ano * 12 + (mes - 1) + 1
  const anoDestino = Math.floor(indiceMes / 12)
  const mesDestino = (indiceMes % 12) + 1
  const ultimoDia = new Date(Date.UTC(anoDestino, mesDestino, 0)).getUTCDate()
  return formatarData(anoDestino, mesDestino, Math.min(diaCiclo, ultimoDia))
}

function diferencaDias(inicio: string, fim: string): number {
  const [a1, m1, d1] = partesData(inicio)
  const [a2, m2, d2] = partesData(fim)
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000)
}

/**
 * Calcula o acesso sem alterar dados.
 * O vencimento é inclusivo; a tolerância de cinco dias também é inclusiva.
 * Assinaturas antigas ativas sem vencimento permanecem ativas até serem regularizadas,
 * mas são sinalizadas para o painel administrativo.
 */
export function calcularEstadoAcesso(input: DadosCiclo & {
  cancelamentoAgendado?: boolean
}): EstadoAcessoCobranca {
  const { hoje, status, testeAte, vencimentoAtual, cancelamentoAgendado = false } = input
  validarDataISO(hoje)

  if (status === 'teste') {
    if (testeAte) validarDataISO(testeAte)
    if (testeAte && hoje <= testeAte) {
      return {
        estado: 'teste',
        podeAlterar: true,
        diasRestantes: diferencaDias(hoje, testeAte) + 1,
        vencimentoPendente: false,
        limiteAcesso: testeAte,
      }
    }
    return { estado: 'somente_consulta', podeAlterar: false, diasRestantes: 0, vencimentoPendente: false, limiteAcesso: testeAte ?? null }
  }

  if (status !== 'ativo') {
    return { estado: 'somente_consulta', podeAlterar: false, diasRestantes: 0, vencimentoPendente: false, limiteAcesso: null }
  }

  if (!vencimentoAtual) {
    return { estado: 'ativa', podeAlterar: true, diasRestantes: 0, vencimentoPendente: true, limiteAcesso: null }
  }
  validarDataISO(vencimentoAtual)

  if (hoje <= vencimentoAtual) {
    return {
      estado: 'ativa',
      podeAlterar: true,
      diasRestantes: diferencaDias(hoje, vencimentoAtual) + 1,
      vencimentoPendente: false,
      limiteAcesso: vencimentoAtual,
    }
  }

  if (cancelamentoAgendado) {
    return { estado: 'somente_consulta', podeAlterar: false, diasRestantes: 0, vencimentoPendente: false, limiteAcesso: vencimentoAtual }
  }

  const limite = somarDiasISO(vencimentoAtual, 5)
  if (hoje <= limite) {
    return {
      estado: 'tolerancia',
      podeAlterar: true,
      diasRestantes: diferencaDias(hoje, limite) + 1,
      vencimentoPendente: false,
      limiteAcesso: limite,
    }
  }

  return { estado: 'somente_consulta', podeAlterar: false, diasRestantes: 0, vencimentoPendente: false, limiteAcesso: limite }
}

/**
 * O pagamento antecipado preserva os dias ainda disponíveis.
 * Após o vencimento, o novo ciclo começa no dia da confirmação, sem retroativos.
 */
export function calcularNovoCiclo(input: DadosCiclo): {
  inicioPeriodo: string
  vencimento: string
  diaCiclo: number
  preservouTempoRestante: boolean
} {
  const { hoje, status, testeAte, vencimentoAtual, diaCiclo } = input
  validarDataISO(hoje)
  if (testeAte) validarDataISO(testeAte)
  if (vencimentoAtual) validarDataISO(vencimentoAtual)
  if (diaCiclo != null && (!Number.isInteger(diaCiclo) || diaCiclo < 1 || diaCiclo > 31)) {
    throw new Error('O dia do ciclo precisa estar entre 1 e 31.')
  }

  const pagoEmDia = status === 'ativo' && Boolean(vencimentoAtual && hoje <= vencimentoAtual)
  const pagoDuranteTeste = status === 'teste' && Boolean(testeAte && hoje <= testeAte)
  const preservouTempoRestante = pagoEmDia || pagoDuranteTeste

  const dataBase = pagoEmDia
    ? vencimentoAtual!
    : pagoDuranteTeste
      ? testeAte!
      : hoje

  validarDataISO(dataBase)
  const dia = preservouTempoRestante && diaCiclo
    ? diaCiclo
    : Number(dataBase.slice(8, 10))
  const inicioPeriodo = preservouTempoRestante ? somarDiasISO(dataBase, 1) : hoje

  return {
    inicioPeriodo,
    vencimento: somarMesesNoDiaCiclo(dataBase, dia),
    diaCiclo: dia,
    preservouTempoRestante,
  }
}
