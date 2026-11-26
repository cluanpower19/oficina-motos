import { describe, expect, it } from 'vitest'
import {
  calcularEstadoAcesso,
  calcularNovoCiclo,
  somarDiasISO,
  somarMesesNoDiaCiclo,
} from '../src/lib/cobranca'

describe('ciclo mensal da assinatura', () => {
  it('usa o último dia válido de fevereiro sem perder o dia original do ciclo', () => {
    expect(somarMesesNoDiaCiclo('2026-01-31', 31)).toBe('2026-02-28')
    expect(somarMesesNoDiaCiclo('2024-01-31', 31)).toBe('2024-02-29')
    expect(somarMesesNoDiaCiclo('2026-02-28', 31)).toBe('2026-03-31')
  })

  it('mantém os dias restantes quando o cliente paga antes do vencimento', () => {
    expect(calcularNovoCiclo({
      hoje: '2026-12-20',
      status: 'ativo',
      vencimentoAtual: '2026-12-31',
      diaCiclo: 31,
    })).toEqual({
      inicioPeriodo: '2027-01-01',
      vencimento: '2027-01-31',
      diaCiclo: 31,
      preservouTempoRestante: true,
    })
  })

  it('soma o tempo restante do trial ao primeiro ciclo pago', () => {
    expect(calcularNovoCiclo({
      hoje: '2026-12-25',
      status: 'teste',
      testeAte: '2026-12-31',
    })).toEqual({
      inicioPeriodo: '2027-01-01',
      vencimento: '2027-01-31',
      diaCiclo: 31,
      preservouTempoRestante: true,
    })
  })

  it('reinicia o ciclo na confirmação quando o pagamento está atrasado', () => {
    expect(calcularNovoCiclo({
      hoje: '2026-12-20',
      status: 'ativo',
      vencimentoAtual: '2026-12-15',
      diaCiclo: 15,
    })).toEqual({
      inicioPeriodo: '2026-12-20',
      vencimento: '2027-01-20',
      diaCiclo: 20,
      preservouTempoRestante: false,
    })
  })

  it('preserva o dia 30 mesmo quando fevereiro termina no dia 28', () => {
    expect(somarMesesNoDiaCiclo('2026-01-30', 30)).toBe('2026-02-28')
    expect(somarMesesNoDiaCiclo('2026-02-28', 30)).toBe('2026-03-30')
  })

  it('soma dias corridos sem sofrer com horário de verão ou fuso local', () => {
    expect(somarDiasISO('2026-12-31', 5)).toBe('2027-01-05')
  })

  it('rejeita datas impossíveis e dias de ciclo inválidos', () => {
    expect(() => somarDiasISO('2026-02-30', 1)).toThrow()
    expect(() => somarMesesNoDiaCiclo('2026-01-01', 32)).toThrow()
  })
})

describe('acesso por vencimento, tolerância e cancelamento', () => {
  it('mantém acesso completo até o vencimento inclusive', () => {
    expect(calcularEstadoAcesso({
      hoje: '2026-12-31',
      status: 'ativo',
      vencimentoAtual: '2026-12-31',
    }).estado).toBe('ativa')
  })

  it('mantém acesso completo durante os cinco dias de tolerância', () => {
    const estado = calcularEstadoAcesso({
      hoje: '2027-01-05',
      status: 'ativo',
      vencimentoAtual: '2026-12-31',
    })
    expect(estado.estado).toBe('tolerancia')
    expect(estado.podeAlterar).toBe(true)
  })

  it('bloqueia gravações no sexto dia após o vencimento', () => {
    const estado = calcularEstadoAcesso({
      hoje: '2027-01-06',
      status: 'ativo',
      vencimentoAtual: '2026-12-31',
    })
    expect(estado.estado).toBe('somente_consulta')
    expect(estado.podeAlterar).toBe(false)
  })

  it('não concede tolerância quando o cliente cancelou a renovação', () => {
    const estado = calcularEstadoAcesso({
      hoje: '2027-01-01',
      status: 'ativo',
      vencimentoAtual: '2026-12-31',
      cancelamentoAgendado: true,
    })
    expect(estado.estado).toBe('somente_consulta')
  })

  it('mantém o trial ativo até o último dia informado', () => {
    expect(calcularEstadoAcesso({
      hoje: '2026-12-31',
      status: 'teste',
      testeAte: '2026-12-31',
    }).estado).toBe('teste')
    expect(calcularEstadoAcesso({
      hoje: '2027-01-01',
      status: 'teste',
      testeAte: '2026-12-31',
    }).estado).toBe('somente_consulta')
  })

  it('não bloqueia uma assinatura legada ativa sem vencimento, mas sinaliza a pendência', () => {
    expect(calcularEstadoAcesso({
      hoje: '2026-12-31',
      status: 'ativo',
    })).toMatchObject({
      estado: 'ativa',
      podeAlterar: true,
      vencimentoPendente: true,
    })
  })

  it('não libera uma oficina bloqueada', () => {
    expect(calcularEstadoAcesso({
      hoje: '2026-12-31',
      status: 'bloqueado',
      vencimentoAtual: '2027-01-31',
    }).podeAlterar).toBe(false)
  })
})
