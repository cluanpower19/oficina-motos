import { describe, expect, it } from 'vitest'
import { calcularAssinatura } from '../src/lib/assinatura'

describe('estado de acesso por vencimento da assinatura', () => {
  it('preserva acesso legado ativo sem vencimento cadastrado', () => {
    const estado = calcularAssinatura('ativo', null, null, false, '2026-11-25')
    expect(estado.ativa).toBe(true)
    expect(estado.vencimentoPendente).toBe(true)
  })

  it('mantém acesso completo até o dia do vencimento', () => {
    const estado = calcularAssinatura('ativo', null, '2026-11-25', false, '2026-11-25')
    expect(estado.ativa).toBe(true)
    expect(estado.emTolerancia).toBe(false)
  })

  it('permite os cinco dias corridos de tolerância', () => {
    const estado = calcularAssinatura('ativo', null, '2026-11-25', false, '2026-11-30')
    expect(estado.ativa).toBe(true)
    expect(estado.emTolerancia).toBe(true)
    expect(estado.diasRestantes).toBe(1)
  })

  it('bloqueia alterações no sexto dia após o vencimento', () => {
    const estado = calcularAssinatura('ativo', null, '2026-11-25', false, '2026-12-01')
    expect(estado.ativa).toBe(false)
    expect(estado.status).toBe('bloqueado')
  })

  it('não concede tolerância depois de cancelamento agendado', () => {
    const estado = calcularAssinatura('ativo', null, '2026-11-25', true, '2026-11-26')
    expect(estado.ativa).toBe(false)
  })

  it('preserva o trial até a data final inclusive', () => {
    const estado = calcularAssinatura('teste', '2026-11-25', null, false, '2026-11-25')
    expect(estado.status).toBe('teste')
    expect(estado.diasRestantes).toBe(1)
  })

  it('bloqueia status bloqueado', () => {
    expect(calcularAssinatura('bloqueado', null, null, false, '2026-11-25').ativa).toBe(false)
  })
})
